/**
 * «Oltin yo'l» avtopiloti — 11 qadam, har biri api.* orqali bajariladi.
 * Ekranlar faqat ko'rsatadi; ilova (masalan, telefon) qadamni o'zi bajarsa, avtopilot kutadi,
 * bajarmasa (placeholder) — API'ga o'tib, yo'lni har doim oxirigacha olib boradi.
 */
import { useSyncExternalStore } from 'react'
import { api } from '@/api'
import { useStore } from '@/store'
import { stageNav } from '@/lib/router'
import { GOLDEN } from '@/seed/golden'
import type { Listing } from '@/domain/types'
import { applyRole, type StagePane } from './roles'

// ─── cancellable sleep ────────────────────────────────────────────────────
/** Resolves after `ms` or as soon as `signal` aborts (never rejects). */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted || ms <= 0) { resolve(); return }
    const t = setTimeout(done, ms)
    function done() { clearTimeout(t); signal?.removeEventListener('abort', done); resolve() }
    signal?.addEventListener('abort', done, { once: true })
  })
}

export class GoldenStopped extends Error {
  constructor() { super('Oltin yo’l to’xtatildi'); this.name = 'GoldenStopped' }
}

// ─── step contract ────────────────────────────────────────────────────────
export interface StepCtx {
  /** cancellable wait; ≤150 ms in fast mode; honours pause and stop */
  wait(ms: number): Promise<void>
  /** glide the fake cursor to a pane and optionally "click" */
  cursor(pane: StagePane, click?: boolean): Promise<void>
  nav: typeof stageNav.go
  role: typeof applyRole
  fast: boolean
  /** skip signal for the current step (aborted by «Keyingi») */
  signal: AbortSignal
  memo: { orderId?: string; subId?: string }
}

export interface GoldenStep {
  id: string
  title: string
  caption: string
  pane: StagePane
  /** rough seconds for the progress hint */
  duration: number
  run: (ctx: StepCtx) => Promise<void>
}

const golden = () => useStore.getState().data.listings.find((l) => l.id === GOLDEN.listingId)

/** Fallback for step 2: do what the phone's «Sotish» wizard would do, via API. */
async function submitViaApi(l: Listing) {
  if (l.status === 'draft' || l.status === 'returned_for_edit' || l.status === 'declined_by_seller') {
    await api.listings.submit({ id: l.id, categoryId: l.categoryId, title: l.title, description: l.description, images: l.images, regionId: l.regionId, district: l.district, condition: l.condition, askingTiyin: l.askingTiyin, imei: l.imei, attributes: l.attributes })
  }
  const st = golden()?.status
  if (st === 'submitted' || st === 'ai_checked') await api.listings.aiCheck(l.id)
}

async function waitForStatus(statuses: string[], timeoutMs: number, signal: AbortSignal): Promise<boolean> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs && !signal.aborted) {
    const st = golden()?.status
    if (st && statuses.includes(st)) return true
    await sleep(200, signal)
  }
  const st = golden()?.status
  return Boolean(st && statuses.includes(st))
}

export const GOLDEN_STEPS: GoldenStep[] = [
  {
    id: 'buyer-home', pane: 'phone', duration: 3,
    title: 'Xaridor bosh sahifada',
    caption: 'Aziz kecha iPhone 13 ko’rgan edi — «Siz uchun» blokida shu model birinchi turadi. Tavsiya izohi: «Siz iPhone 13 ko’rgansiz».',
    async run(c) {
      c.role('buyer'); c.nav('mobile', '/')
      await c.wait(3000)
    },
  },
  {
    id: 'seller-sell', pane: 'phone', duration: 12,
    title: 'Sotuvchi e’lon beradi',
    caption: 'Dilnoza «Sotish»da iPhone 13 Pro, 4 rasm, IMEI va 6 600 000 so’m kiritadi. AI tahlili modelni taniydi, IMEI’ni tekshiradi — e’lon «Tekshiruvda».',
    async run(c) {
      c.role('seller')
      const l = golden()
      if (!l) throw new Error('Oltin e’lon topilmadi')
      if (c.fast) {
        await submitViaApi(l)
        c.nav('mobile', `/sell/ai/${l.id}`)
      } else {
        c.nav('mobile', '/sell?golden=1')
        const done = await waitForStatus(['in_review', 'offer_sent', 'accepted', 'published'], 25_000, c.signal)
        if (!done) {
          const cur = golden()
          if (cur) { await submitViaApi(cur); c.nav('mobile', `/sell/ai/${cur.id}`) }
        }
      }
      await c.wait(1500)
    },
  },
  {
    id: 'admin-pricing', pane: 'desktop', duration: 5,
    title: 'Narx tahlilchisi taqqoslaydi',
    caption: 'Admin → Narx tahlili: o’xshash e’lonlar jadvali, holat va bozor o’rtachasi. AI tavsiyasi 6 200 000 so’m, ishonch 87%. Tahlilchi sotuvchiga taklif yuboradi.',
    async run(c) {
      c.role('price_analyst'); c.nav('admin', `/pricing?id=${GOLDEN.listingId}`)
      await c.wait(3000)
      await c.cursor('desktop', true)
      const st = golden()?.status
      if (st === 'in_review' || st === 'ai_checked') await api.listings.sendOffer(GOLDEN.listingId, GOLDEN.suggested, 'O’xshashlar o’rtachasi va holat bo’yicha')
      await c.wait(800)
    },
  },
  {
    id: 'seller-offer', pane: 'phone', duration: 5,
    title: 'Sotuvchiga taklif keldi',
    caption: 'Telefonda push: 6 200 000 so’m. Xizmat haqi 186 000, qo’lga 6 014 000 so’m. Dilnoza «Roziman, joylash»ni bosadi — e’lon «Narx tekshirilgan» muhri bilan chiqadi.',
    async run(c) {
      c.role('seller'); c.nav('mobile', `/sell/offer/${GOLDEN.listingId}`)
      await c.wait(3500)
      await c.cursor('phone', true)
      if (golden()?.status === 'offer_sent') await api.listings.acceptOffer(GOLDEN.listingId)
      await c.wait(600)
    },
  },
  {
    id: 'buyer-push', pane: 'phone', duration: 5,
    title: 'Xaridorga push',
    caption: 'Tavsiya triggeri ishladi: Aziz qiziqqan model tekshirilgan narxda sotuvga chiqdi. E’lonni ochadi — «Bu narx nega adolatli» varag’i.',
    async run(c) {
      c.role('buyer')
      await c.wait(1500)
      c.nav('mobile', `/listing/${GOLDEN.listingId}`)
      await c.wait(3000)
    },
  },
  {
    id: 'buyer-checkout', pane: 'phone', duration: 8,
    title: 'Savat va rasmiylashtirish',
    caption: 'Xaritadan BTS Namangan Markaz filiali, Payme. Jami 6 235 000 so’m (35 000 yetkazish). To’lov escrow’da — muhr animatsiyasi.',
    async run(c) {
      c.role('buyer')
      const l = golden()
      if (!l) throw new Error('Oltin e’lon topilmadi')
      const cart = useStore.getState().ui.cart
      if (l.status === 'published' && !cart.some((x) => x.refId === l.id)) {
        await api.orders.addToCart({ source: 'listing', refId: l.id, sellerKey: `u:${l.sellerId}`, priceTiyin: l.priceTiyin, title: l.title, image: l.images[0] })
      }
      c.nav('mobile', '/cart')
      await c.wait(1500)
      c.nav('mobile', '/checkout')
      await c.wait(2500)
      await c.cursor('phone', true)
      const existing = useStore.getState().data.orders.find((o) => o.subOrders.some((so) => so.items.some((i) => i.refId === GOLDEN.listingId)) && o.status !== 'cancelled')
      if (existing) {
        c.memo.orderId = existing.id; c.memo.subId = existing.subOrders[0].id
      } else {
        const o = await api.orders.checkout({ delivery: 'bts_branch', branchId: GOLDEN.branchId, payment: 'payme' })
        c.memo.orderId = o.id; c.memo.subId = o.subOrders[0].id
      }
      await c.wait(1500)
      c.nav('mobile', `/orders/${c.memo.orderId}`)
      await c.wait(1200)
    },
  },
  {
    id: 'admin-logistics', pane: 'desktop', duration: 7,
    title: 'Logistika: qadoqlash va kechki partiya',
    caption: 'Logist «Qadoqlandi»ni bosadi — BTS yuk xati (A6) chiqadi. Demo soati 17:00 — partiya yopiladi; 19:00 — kechki BTS mashinasi olib ketadi.',
    async run(c) {
      c.role('logistics'); c.nav('admin', `/logistics?highlight=${c.memo.subId ?? ''}`)
      await c.wait(2000)
      const sub = () => useStore.getState().data.orders.flatMap((o) => o.subOrders).find((s) => s.id === c.memo.subId)
      await c.cursor('desktop', true)
      if (c.memo.subId && sub()?.status === 'packing') await api.logistics.pack(c.memo.subId)
      await c.wait(1500)
      await api.demo.to17()
      await c.wait(1500)
      await api.demo.btsArrived()
      await c.wait(800)
    },
  },
  {
    id: 'bts-accept', pane: 'desktop', duration: 4,
    title: 'BTS partiyani qabul qildi',
    caption: 'BTS paneli: «Partiyani qabul qildim». Xaridor telefonida buyurtma timeline’ida «BTS olib ketdi» paydo bo’ladi.',
    async run(c) {
      c.role('bts')
      await c.wait(1500)
      const d = useStore.getState().data
      const m = d.manifests.find((x) => c.memo.subId && x.subOrderIds.includes(c.memo.subId))
      await c.cursor('desktop', true)
      if (m && m.status !== 'picked_up') await api.logistics.btsAcceptManifest(m.id)
      if (c.memo.orderId) c.nav('mobile', `/orders/${c.memo.orderId}`)
      await c.wait(1500)
    },
  },
  {
    id: 'bts-delivered', pane: 'desktop', duration: 4,
    title: '+1 kun: filialda → topshirildi',
    caption: 'Ertasi kuni yuk Namangan filialida. BTS «Topshirildi» — e’lon «Sotildi», xaridorga baholash so’rovi, sotuvchiga juma to’lovi rejalashtirildi.',
    async run(c) {
      await api.demo.plusDay()
      await c.wait(1500)
      await c.cursor('desktop', true)
      const sub = useStore.getState().data.orders.flatMap((o) => o.subOrders).find((s) => s.id === c.memo.subId)
      if (c.memo.subId && sub && (sub.status === 'at_branch' || sub.status === 'in_transit')) {
        if (sub.status === 'in_transit') await api.logistics.btsArrivedAtBranch(c.memo.subId)
        await api.logistics.btsDelivered(c.memo.subId)
      }
      await c.wait(1200)
    },
  },
  {
    id: 'finance-payday', pane: 'desktop', duration: 5,
    title: 'Moliya: juma to’lovi',
    caption: 'To’lovlar bo’limi: rejalashtirilgan to’lovlar bir tugma bilan. Sotuvchi hamyonida 6 014 000 so’m «To’landi».',
    async run(c) {
      c.role('finance'); c.nav('admin', '/payments')
      await c.wait(1500)
      await c.cursor('desktop', true)
      await api.demo.payday()
      await c.wait(800)
      c.role('seller'); c.nav('mobile', '/wallet')
      await c.wait(1500)
    },
  },
  {
    id: 'audit', pane: 'desktop', duration: 3,
    title: 'Yakun: audit log',
    caption: 'Super admin audit logda L-58213 ni qidiradi — yuborilganidan to’lovgacha har bir o’tish, kim va qachon.',
    async run(c) {
      c.role('super_admin'); c.nav('admin', `/audit?q=${GOLDEN.listingId}`)
      await c.wait(800)
    },
  },
]

// ─── runner ───────────────────────────────────────────────────────────────
export type GoldenStatus = 'idle' | 'running' | 'paused' | 'done' | 'error'
export interface CursorState { x: number; y: number; visible: boolean; clicks: number }
export interface GoldenState {
  status: GoldenStatus
  index: number
  total: number
  error: string | null
  cursor: CursorState
  /** pane the current step acts on */
  pane: StagePane
  fast: boolean
}

type PaneRects = Partial<Record<StagePane, () => DOMRect | null>>

class GoldenRunner {
  private state: GoldenState = { status: 'idle', index: 0, total: GOLDEN_STEPS.length, error: null, cursor: { x: -100, y: -100, visible: false, clicks: 0 }, pane: 'phone', fast: false }
  private listeners = new Set<() => void>()
  private skip: AbortController | null = null
  private stopped = false
  private paused = false
  private resumeFns: (() => void)[] = []
  private panes: PaneRects = {}
  private running = false

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  getState = () => this.state
  private set(patch: Partial<GoldenState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach((l) => l()) }

  registerPane(pane: StagePane, rect: () => DOMRect | null) { this.panes[pane] = rect }
  setFast(v: boolean) { this.set({ fast: v }) }

  // controls
  pause() { if (this.state.status === 'running') { this.paused = true; this.set({ status: 'paused' }) } }
  resume() {
    if (this.state.status !== 'paused') return
    this.paused = false; this.set({ status: 'running' })
    const fns = this.resumeFns; this.resumeFns = []; fns.forEach((f) => f())
  }
  /** «Keyingi»: drop the remaining waits of the current step (its actions still run, instantly). */
  next() { if (this.paused) this.resume(); this.skip?.abort() }
  stop(status: GoldenStatus = 'idle') {
    this.stopped = true
    this.skip?.abort()
    if (this.paused) this.resume()
    this.set({ status, cursor: { ...this.state.cursor, visible: false } })
  }
  dismiss() { if (!this.running) this.set({ status: 'idle', error: null }) }

  private gate(): Promise<void> {
    if (!this.paused) return Promise.resolve()
    return new Promise((r) => this.resumeFns.push(r))
  }

  private async wait(ms: number, signal: AbortSignal) {
    if (this.stopped) throw new GoldenStopped()
    await sleep(this.state.fast ? Math.min(ms, 150) : ms, signal)
    await this.gate()
    if (this.stopped) throw new GoldenStopped()
  }

  private async cursor(pane: StagePane, click: boolean, signal: AbortSignal) {
    const r = this.panes[pane]?.()
    if (r) {
      // aim a little below centre so the cursor lands on content, not the frame edge
      const x = r.left + r.width * (pane === 'phone' ? 0.5 : 0.55)
      const y = r.top + r.height * (pane === 'phone' ? 0.62 : 0.5)
      this.set({ cursor: { ...this.state.cursor, x, y, visible: true } })
    }
    await this.wait(600, signal)
    if (click) {
      this.set({ cursor: { ...this.state.cursor, clicks: this.state.cursor.clicks + 1 } })
      await this.wait(300, signal)
    }
  }

  async start(fromIndex = 0) {
    if (this.running) return
    this.running = true; this.stopped = false; this.paused = false
    const memo: StepCtx['memo'] = {}
    this.set({ status: 'running', index: fromIndex, error: null })
    try {
      for (let i = fromIndex; i < GOLDEN_STEPS.length; i++) {
        const step = GOLDEN_STEPS[i]
        const skip = new AbortController(); this.skip = skip
        this.set({ index: i, pane: step.pane, cursor: { ...this.state.cursor, visible: false } })
        // hold before the step if paused
        await this.gate()
        if (this.stopped) throw new GoldenStopped()
        const ctx: StepCtx = {
          wait: (ms) => this.wait(ms, skip.signal),
          cursor: (pane, click = false) => this.cursor(pane, click, skip.signal),
          nav: stageNav.go, role: applyRole, fast: this.state.fast, signal: skip.signal, memo,
        }
        await step.run(ctx)
        this.set({ cursor: { ...this.state.cursor, visible: false } })
      }
      this.set({ status: 'done', index: GOLDEN_STEPS.length - 1 })
    } catch (e) {
      if (e instanceof GoldenStopped) { /* user stopped */ }
      else {
        console.error(e)
        this.set({ status: 'error', error: e instanceof Error ? e.message : String(e), cursor: { ...this.state.cursor, visible: false } })
      }
    } finally {
      this.running = false; this.skip = null
    }
  }
}

export const goldenRunner = new GoldenRunner()

export function useGolden(): GoldenState {
  return useSyncExternalStore(goldenRunner.subscribe, goldenRunner.getState, goldenRunner.getState)
}

/** Is the golden listing still untouched? (else we offer a reset first) */
export function goldenIsFresh(): boolean {
  return golden()?.status === 'draft'
}
