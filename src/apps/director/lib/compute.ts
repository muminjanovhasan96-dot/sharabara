/**
 * Direktor paneli hisob-kitoblari. Sof funksiyalar: (snapshot, now, period) → raqamlar.
 * UI'da `useMemo` bilan chaqiriladi.
 */
import type {
  AuditEntry, DailyStat, DataSnapshot, ISODate, Order, Payout, Product, RegionId, SalesChannel, StockReceipt, SubOrder, Tiyin,
} from '@/domain/types'
import { addDays, ageDays, dateKey, parseIso, startOfDay } from '@/domain/clock'
import { formatMoney } from '@/domain/money'
import { uz } from '@/i18n/uz'
import { PAYOUT_STATUS_UZ } from '@/domain/machines'
import type { PeriodKey, ProblemKey } from '../strings'
import { D, tt } from '../strings'

export const PERIOD_DAYS: Record<PeriodKey, number> = { bugun: 1, hafta: 7, oy: 30 }
export const CHANNELS: SalesChannel[] = ['app', 'telegram', 'instagram', 'offline']

export interface Range { from: number; to: number; fromKey: string; toKey: string }
export interface PeriodRange { cur: Range; prev: Range | null; days: number }

const ms = (iso: ISODate) => parseIso(iso).getTime()
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const within = (iso: ISODate | undefined, r: Range) => { if (!iso) return false; const t = ms(iso); return t >= r.from && t <= r.to }

export function periodRange(now: ISODate, period: PeriodKey): PeriodRange {
  const days = PERIOD_DAYS[period]
  const fromIso = startOfDay(addDays(now, -(days - 1)))
  const cur: Range = { from: ms(fromIso), to: ms(now), fromKey: dateKey(fromIso), toKey: dateKey(now) }
  if (period === 'oy') return { cur, prev: null, days }
  const prevFromIso = addDays(fromIso, -days)
  const prevToIso = addDays(now, -days)
  const prev: Range = { from: ms(prevFromIso), to: ms(prevToIso), fromKey: dateKey(prevFromIso), toKey: dateKey(prevToIso) }
  return { cur, prev, days }
}

const statsIn = (stats: DailyStat[], r: Range) => stats.filter((s) => s.date >= r.fromKey && s.date <= r.toKey)
export const delta = (cur: number, prev: number | null): number | undefined => (prev === null || prev === 0 ? undefined : (cur - prev) / prev)

/** Buyurtma "sotilgan" hisoblanadimi (bekor qilinmagan, to'langan) */
export const isSale = (o: Order) => o.status !== 'cancelled' && o.status !== 'created'

// ─── Umumiy ──────────────────────────────────────────────────────────────
export interface Overview {
  revenue: Tiyin; revenueDelta: number | undefined; spark: number[]
  orders: number; ordersDelta: number | undefined
  avgCheck: Tiyin
  activeListings: number
  mall: Tiyin; listings: Tiyin
  commission: Tiyin; commissionDelta: number | undefined
  escrow: Tiyin
  paidOut: Tiyin; paidOutCount: number
}

export function computeOverview(d: DataSnapshot, now: ISODate, period: PeriodKey): Overview {
  const pr = periodRange(now, period)
  const cur = statsIn(d.dailyStats, pr.cur)
  const prev = pr.prev ? statsIn(d.dailyStats, pr.prev) : null
  const rev = (xs: DailyStat[]) => sum(xs.map((s) => s.listingsSalesTiyin + s.mallSalesTiyin))
  const revenue = rev(cur)
  const orders = sum(cur.map((s) => s.orders))
  const commission = sum(cur.map((s) => s.commissionTiyin))
  const escrow = sum(d.orders.filter((o) => o.payment.escrow === 'held' && o.status !== 'cancelled').map((o) => o.totalTiyin))
  const paid = d.payouts.filter((p) => p.status === 'paid' && within(p.paidAt, pr.cur))
  return {
    revenue,
    revenueDelta: delta(revenue, prev ? rev(prev) : null),
    spark: d.dailyStats.slice(-14).map((s) => s.listingsSalesTiyin + s.mallSalesTiyin),
    orders,
    ordersDelta: delta(orders, prev ? sum(prev.map((s) => s.orders)) : null),
    avgCheck: orders ? Math.round(revenue / orders) : 0,
    activeListings: d.listings.filter((l) => l.status === 'published' && !l.historical).length,
    mall: sum(cur.map((s) => s.mallSalesTiyin)),
    listings: sum(cur.map((s) => s.listingsSalesTiyin)),
    commission,
    commissionDelta: delta(commission, prev ? sum(prev.map((s) => s.commissionTiyin)) : null),
    escrow,
    paidOut: sum(paid.map((p) => p.amountTiyin)),
    paidOutCount: paid.length,
  }
}

// ─── Kanallar ────────────────────────────────────────────────────────────
export interface ChannelRow { channel: SalesChannel; label: string; share: number; amount: Tiyin; orders: number }

/** Davr ichidagi buyurtmalar bo'yicha kanal ulushi; davr bo'sh bo'lsa 30 kunlik ulush. Summalar davr savdosiga masshtablanadi. */
export function computeChannels(d: DataSnapshot, now: ISODate, period: PeriodKey, revenue: Tiyin): { rows: ChannelRow[]; fallback: boolean } {
  const pr = periodRange(now, period)
  let os = d.orders.filter((o) => isSale(o) && within(o.createdAt, pr.cur))
  let fallback = false
  if (os.length < 10 || new Set(os.map((o) => o.channel)).size < 2) {
    const r30 = periodRange(now, 'oy').cur
    os = d.orders.filter((o) => isSale(o) && within(o.createdAt, r30))
    fallback = period !== 'oy'
  }
  const total = sum(os.map((o) => o.totalTiyin)) || 1
  const rows = CHANNELS.map((ch) => {
    const mine = os.filter((o) => o.channel === ch)
    const share = sum(mine.map((o) => o.totalTiyin)) / total
    return { channel: ch, label: D.channel[ch], share, amount: Math.round(revenue * share / 100) * 100, orders: mine.length }
  })
  return { rows, fallback }
}

// ─── Kassa: naqd va karta ────────────────────────────────────────────────
export interface CashView { cash: Tiyin; card: Tiyin; cashOrders: number; cardOrders: number; fallback: boolean }

/** Davr buyurtmalari bo'yicha to'lov usuli ulushi (naqd / Click·Payme); davr bo'sh bo'lsa 30 kun. Summalar davr savdosiga masshtablanadi. */
export function computeCash(d: DataSnapshot, now: ISODate, period: PeriodKey, revenue: Tiyin): CashView {
  const pr = periodRange(now, period)
  let os = d.orders.filter((o) => isSale(o) && within(o.payment.paidAt ?? o.createdAt, pr.cur))
  let fallback = false
  if (os.length < 3) {
    const r30 = periodRange(now, 'oy').cur
    os = d.orders.filter((o) => isSale(o) && within(o.payment.paidAt ?? o.createdAt, r30))
    fallback = period !== 'oy'
  }
  const total = sum(os.map((o) => o.totalTiyin)) || 1
  const cashOs = os.filter((o) => o.payment.method === 'cash')
  const cashShare = sum(cashOs.map((o) => o.totalTiyin)) / total
  const cash = Math.round(revenue * cashShare / 100) * 100
  return { cash, card: revenue - cash, cashOrders: cashOs.length, cardOrders: os.length - cashOs.length, fallback }
}

// ─── Jonli lenta ─────────────────────────────────────────────────────────
export interface FeedItem { id: string; at: ISODate; text: string; kind: AuditEntry['kind']; to: string | null }

const money = (v: string | number | null) => (typeof v === 'number' ? formatMoney(v) : String(v ?? ''))

export function feedSentence(d: DataSnapshot, a: AuditEntry): { text: string; to: string | null } | null {
  const who = a.actorName
  const id = a.entityId
  const to = String(a.to ?? '')
  switch (a.entity) {
    case 'listing': {
      const link = `/moderation?id=${id}`
      if (a.kind === 'price') return { text: `${who} ${id} uchun ${money(a.to)} taklif yubordi`, to: `/pricing?id=${id}` }
      if (a.field === 'boost') return { text: `${id} e’loni ko’tarildi (${to})`, to: link }
      if (a.field === 'moderation') return { text: `${who} ${id} e’lonini tasdiqladi`, to: link }
      switch (to) {
        case 'offer_sent': return null // narx yozuvi bilan birga keladi
        case 'rejected_by_admin': return { text: `${who} ${id} e’lonini rad etdi${a.note ? `: ${a.note}` : ''}`, to: link }
        case 'in_review': return { text: `${id} e’loni tekshiruvga tushdi`, to: `/pricing?id=${id}` }
        case 'published': return { text: `${id} e’loni saytga chiqdi`, to: link }
        case 'reserved': return { text: `${id} e’loni band qilindi — xaridor to’ladi`, to: link }
        case 'sold': return { text: `${id} e’loni sotildi`, to: link }
        case 'accepted': return { text: `Sotuvchi ${id} uchun narx taklifini qabul qildi`, to: link }
        case 'declined_by_seller': return { text: `Sotuvchi ${id} uchun taklifni rad etdi`, to: link }
        default: return { text: `${who} ${id} e’lonini «${uz.listing.status[to as keyof typeof uz.listing.status] ?? to}» holatiga o’tkazdi`, to: link }
      }
    }
    case 'payout': {
      const p = d.payouts.find((x) => x.id === id)
      const amt = p ? formatMoney(p.amountTiyin) : ''
      const name = p?.sellerName ?? a.note ?? ''
      if (to === 'paid') return { text: `${who} ${name}ga ${amt} to’lov o’tkazdi`, to: '/payments' }
      if (to === 'awaiting_second_approval') return { text: `${name} uchun ${amt} to’lov ikkinchi imzoni kutmoqda`, to: '/payments' }
      if (to === 'scheduled') return { text: `${name} uchun ${amt} to’lov jumaga rejalashtirildi`, to: '/payments' }
      return { text: `${who} ${id} to’lovini «${PAYOUT_STATUS_UZ[to as keyof typeof PAYOUT_STATUS_UZ] ?? to}» qildi`, to: '/payments' }
    }
    case 'manifest': {
      const m = d.manifests.find((x) => x.id === id)
      const n = m?.subOrderIds.length
      if (to === 'picked_up') return { text: n ? `BTS ${n} ta yukni olib ketdi` : `BTS kechki partiyani olib ketdi`, to: '/logistics' }
      if (to === 'closed') return { text: `Kunlik manifest yopildi${a.note ? ` (${a.note})` : ''}`, to: '/logistics' }
      return { text: `Manifest ${id}: ${to}`, to: '/logistics' }
    }
    case 'order': {
      const link = `/orders?id=${id}`
      if (a.kind === 'money') return { text: `${id} uchun ${money(a.to)} to’lov qabul qilindi, escrow’da`, to: link }
      if (to === 'created') return { text: `${who} ${id} buyurtma berdi`, to: link }
      if (to === 'cancelled') return { text: `${id} buyurtmasi bekor qilindi${a.note ? `: ${a.note}` : ''}`, to: link }
      return { text: `${id} buyurtmasi: ${to}`, to: link }
    }
    case 'subOrder': {
      const so = d.orders.flatMap((o) => o.subOrders).find((s) => s.id === id)
      const link = `/orders?id=${so?.orderId ?? id}`
      if (a.kind === 'fee') return { text: `${who} ${id} uchun xizmat haqini tasdiqladi (${money(a.to)})`, to: `/fees` }
      if (a.field === 'problem') return { text: `${id} yukida muammo: ${to}`, to: `/logistics` }
      return { text: `${id} yuki: ${uz.orders.status[to as keyof typeof uz.orders.status] ?? to}`, to: link }
    }
    case 'return': return { text: `${who} ${id} qaytarish so’rovi bo’yicha qaror qildi${a.note ? `: ${a.note}` : ''}`, to: `/returns?id=${id}` }
    case 'user': {
      const u = d.users.find((x) => x.id === id)
      if (a.field === 'blocked') return { text: to ? `${who} ${u?.name ?? id}ni blokladi: ${to}` : `${who} ${u?.name ?? id} blokini olib tashladi`, to: `/users?id=${id}` }
      if (a.field === 'verifiedSeller') return { text: `${who} ${u?.name ?? id}ni ${to === 'true' ? 'tekshirilgan sotuvchi qildi' : 'tekshiruvdan chiqardi'}`, to: `/users?id=${id}` }
      return { text: `${who} ${u?.name ?? id} ma’lumotini o’zgartirdi`, to: `/users?id=${id}` }
    }
    case 'feeRuleSet': return { text: `${who} xizmat haqi qoidalarini yangiladi${a.note ? `: ${a.note}` : ''}`, to: '/fees' }
    case 'staff': return { text: `${who} yangi xodim qo’shdi${a.note ? `: ${a.note}` : ''}`, to: '/roles' }
    case 'role': return { text: `${who} «${uz.admin.roles[id as keyof typeof uz.admin.roles] ?? id}» roli huquqlarini o’zgartirdi`, to: '/roles' }
    case 'category': {
      const c = d.categories.find((x) => x.id === id)
      if (a.field === 'discountRate') return { text: `${who} «${c?.name ?? id}» chegirmasini ${Math.round(Number(a.from) * 100)}% → ${Math.round(Number(a.to) * 100)}% qildi`, to: '/categories' }
      return { text: `${who} «${c?.name ?? to}» kategoriyasini o’zgartirdi`, to: '/categories' }
    }
    case 'company': {
      const c = d.companies.find((x) => x.id === id)
      if (a.field === 'created') return { text: `${who} yangi kompaniya qo’shdi: ${to}`, to: `/companies?id=${id}` }
      if (a.field === 'commissionRate') return { text: `${c?.name ?? id} komissiyasi ${Math.round(Number(a.from) * 100)}% → ${Math.round(Number(a.to) * 100)}%`, to: `/companies?id=${id}` }
      if (a.field === 'import') return { text: `${c?.name ?? who} tovarlarni Excel’dan yukladi: ${to}`, to: `/products` }
      return { text: `${c?.name ?? id}: ${to}`, to: `/companies?id=${id}` }
    }
    case 'product': {
      const p = d.products.find((x) => x.id === id)
      const t = p?.title ?? id
      if (a.field === 'check') return { text: `${who} «${t}» narxini tekshirdi: ${to === 'passed' ? 'o’tdi' : 'qimmat'}`, to: `/products?id=${id}` }
      if (a.field === 'priceTiyin') return { text: `«${t}» narxi ${money(a.from)} → ${money(a.to)}`, to: `/products?id=${id}` }
      if (a.field === 'stock') return { text: `«${t}» zaxirasi ${a.from} → ${a.to} dona`, to: `/products?id=${id}` }
      if (a.field === 'promo') return { text: `«${t}» uchun aksiya: ${to}`, to: `/products?id=${id}` }
      if (a.field === 'created') return { text: `${who} yangi tovar qo’shdi: ${to}`, to: `/products?id=${id}` }
      return { text: `«${t}»: ${a.field} ${to}`, to: `/products?id=${id}` }
    }
    case 'receipt': {
      if (a.field === 'created') return { text: `${who} yangi kirim yaratdi: ${to}`, to: '/warehouse' }
      if (to === 'received') return { text: `${id} kirimi omborga qabul qilindi${a.note ? ` (${a.note})` : ''}`, to: '/warehouse' }
      if (to === 'checked') return { text: `${id} kirimi tekshirildi`, to: '/warehouse' }
      return { text: `${id} kirimi: ${to}`, to: '/warehouse' }
    }
    case 'stock': return { text: `${who} zaxirani tuzatdi${a.note ? `: ${a.note}` : ''} (${a.from} → ${a.to})`, to: '/warehouse' }
    case 'campaign': return { text: `${who} kampaniya yubordi${a.note ? ` — ${a.note}` : ''}`, to: '/campaigns' }
    case 'apiKey': return { text: a.field === 'created' ? `API kalit yaratildi: ${to}` : `API kalit bekor qilindi`, to: '/companies' }
    case 'clock': return { text: `Demo vaqti oldinga surildi (${a.note ?? ''})`, to: null }
    default: return { text: `${who}: ${a.entity} ${id} · ${a.field} → ${to}`, to: `/audit?q=${id}` }
  }
}

export function computeFeed(d: DataSnapshot, limit = 12): FeedItem[] {
  const sorted = [...d.audit].sort((a, b) => (a.at < b.at ? 1 : -1))
  const out: FeedItem[] = []
  for (const a of sorted) {
    if (out.length >= limit) break
    const s = feedSentence(d, a)
    if (!s) continue
    out.push({ id: a.id, at: a.at, text: s.text, kind: a.kind, to: s.to })
  }
  return out
}

// ─── Muammolar ───────────────────────────────────────────────────────────
export interface ProblemItem {
  id: string
  title: string
  sub: string
  /** SLA / kechikish matni */
  meta?: string
  tone: 'brick' | 'gold' | 'neutral'
  amount?: Tiyin
  /** admin bo'limi yo'li (`/orders?id=…`) */
  to: string
}
export interface ProblemGroup { key: ProblemKey; label: string; hint: string; items: ProblemItem[] }

export const PROBLEM_KEYS: ProblemKey[] = ['secondApproval', 'disputes', 'lateShipments', 'lowStock', 'fees', 'overpriced', 'moderation']

/** 30 kunlik chiqim (dona) mahsulot bo'yicha */
export function outPerProduct(d: DataSnapshot, now: ISODate, days = 30): Map<string, number> {
  const r = periodRange(now, 'oy').cur
  const from = ms(startOfDay(addDays(now, -(days - 1))))
  const acc = new Map<string, number>()
  for (const m of d.movements) {
    if (m.kind !== 'out') continue
    const t = ms(m.at)
    if (t < from || t > r.to) continue
    acc.set(m.productId, (acc.get(m.productId) ?? 0) + Math.abs(m.qty))
  }
  return acc
}

export function daysLeftLabel(qty: number, out30: number): string {
  if (!out30) return D.stock.daysLeftNone
  const days = qty / (out30 / 30)
  if (days < 1) return D.stock.daysLeftToday
  return tt(D.stock.daysLeft, { n: Math.round(days) })
}

export function computeProblems(d: DataSnapshot, now: ISODate): ProblemGroup[] {
  const nowMs = ms(now)
  const company = (id: string) => d.companies.find((c) => c.id === id)?.name ?? '—'
  const product = (id: string) => d.products.find((p) => p.id === id)
  const out30 = outPerProduct(d, now)

  // kam zaxira: mahsulot bo'yicha jami qty ≤ minQty
  const byProduct = new Map<string, { qty: number; min: number }>()
  for (const l of d.stockLevels) { const a = byProduct.get(l.productId) ?? { qty: 0, min: 0 }; a.qty += l.qty; a.min = Math.max(a.min, l.minQty); byProduct.set(l.productId, a) }
  const lowStock: ProblemItem[] = [...byProduct.entries()].filter(([, v]) => v.qty <= v.min).map(([pid, v]) => {
    const p = product(pid)
    return { id: pid, title: p?.title ?? pid, sub: `${p ? company(p.companyId) : '—'} · ${v.qty} ${D.pcs} (${D.stock.min} ${v.min})`, meta: daysLeftLabel(v.qty, out30.get(pid) ?? 0), tone: v.qty === 0 ? 'brick' : 'gold', to: `/products?id=${pid}` } as ProblemItem
  }).sort((a, b) => a.title.localeCompare(b.title))

  // kechikkan yuklar: in_transit > 2 kun
  const late: ProblemItem[] = []
  for (const o of d.orders) for (const so of o.subOrders) {
    if (so.status !== 'in_transit') continue
    const ev = so.timeline.find((e) => e.status === 'in_transit')
    const since = ev?.at ?? o.createdAt
    const days = ageDays(since, now)
    if (days <= 2) continue
    late.push({ id: so.id, title: `${so.id} · ${so.items[0]?.title ?? ''}`, sub: `${so.sellerName}${so.waybill ? ` · ${so.waybill}` : ''}`, meta: tt(D.problems.daysInTransit, { n: Math.floor(days) }), tone: days > 4 ? 'brick' : 'gold', amount: so.subtotalTiyin, to: `/orders?id=${o.id}` })
  }

  // nizolar: requested, SLA
  const disputes: ProblemItem[] = d.returns.filter((r) => r.status === 'requested').map((r) => {
    const deadline = ms(r.createdAt) + r.slaHours * 3_600_000
    const hLeft = Math.round((deadline - nowMs) / 3_600_000)
    const so = d.orders.flatMap((o) => o.subOrders).find((s) => s.id === r.subOrderId)
    return { id: r.id, title: `${r.id} · ${r.reason}`, sub: `${so?.items[0]?.title ?? r.subOrderId} · ${so?.sellerName ?? ''}`, meta: hLeft >= 0 ? tt(D.problems.slaLeft, { h: hLeft }) : tt(D.problems.slaOver, { h: -hLeft }), tone: hLeft < 12 ? 'brick' : 'gold', amount: so?.subtotalTiyin, to: `/returns?id=${r.id}` } as ProblemItem
  })

  // tasdiqlanmagan xizmat haqlari
  const fees: ProblemItem[] = d.feeApprovals.filter((a) => a.status === 'pending').map((a) => ({
    id: a.id, title: `${a.subOrderId} · ${formatMoney(a.priceTiyin)}`, sub: `${sellerName(d, a.sellerKey)} · haq ${formatMoney(a.autoFeeTiyin)}`, tone: 'neutral', amount: a.autoFeeTiyin, to: `/fees?id=${a.id}`,
  }))

  // qo'sh imzo
  const second: ProblemItem[] = d.payouts.filter((p) => p.status === 'awaiting_second_approval').map((p) => ({
    id: p.id, title: `${p.id} · ${p.sellerName}`, sub: `${PAYOUT_STATUS_UZ[p.status]} · ${D.money.card} •••• ${p.cardLast4}`, tone: 'brick', amount: p.amountTiyin, to: `/payments?id=${p.id}`,
  }))

  // narx qoidasidan o'tmagan Mall tovarlari
  const overpriced: ProblemItem[] = d.products.filter((p) => p.check === 'overpriced').map((p) => ({
    id: p.id, title: p.title, sub: `${company(p.companyId)} · bozordan ${Math.round(Math.abs(p.checkDelta) * 100)}% qimmat`, tone: 'gold', amount: p.priceTiyin, to: `/products?id=${p.id}`,
  }))

  // moderatsiyada 24 soatdan uzoq
  const moderation: ProblemItem[] = d.listings.filter((l) => (l.status === 'in_review' || l.status === 'submitted') && !l.historical && l.submittedAt && nowMs - ms(l.submittedAt) > 24 * 3_600_000).map((l) => {
    const h = Math.floor((nowMs - ms(l.submittedAt!)) / 3_600_000)
    return { id: l.id, title: `${l.id} · ${l.title}`, sub: `${d.users.find((u) => u.id === l.sellerId)?.name ?? ''} · ${formatMoney(l.askingTiyin)}`, meta: `${h} soat navbatda`, tone: h > 48 ? 'brick' : 'gold', to: `/pricing?id=${l.id}` } as ProblemItem
  })

  const all: Record<ProblemKey, ProblemItem[]> = { lowStock, lateShipments: late, disputes, fees, secondApproval: second, overpriced, moderation }
  return PROBLEM_KEYS.map((key) => ({ key, label: D.problems.groups[key], hint: D.problems.hints[key], items: all[key] }))
}

export function sellerName(d: DataSnapshot, key: string): string {
  if (key.startsWith('c:')) return d.companies.find((c) => c.id === key.slice(2))?.name ?? key
  return d.users.find((u) => u.id === key.slice(2))?.name ?? key
}

// ─── Savdo ───────────────────────────────────────────────────────────────
export interface RankRow { id: string; label: string; value: Tiyin; count: number; hint?: string; share?: number }
export interface Sales {
  chart30: { date: string; label: string; listings: Tiyin; mall: Tiyin }[]
  regions: RankRow[]
  topProducts: RankRow[]
  topCompanies: (RankRow & { returnRate: number })[]
  topSellers: RankRow[]
  categories: RankRow[]
  recentOrders: Order[]
  /** davr bo'yicha buyurtmalar (kam bo'lsa 30 kun) */
  fallback: boolean
}

function periodOrders(d: DataSnapshot, now: ISODate, period: PeriodKey): { orders: Order[]; fallback: boolean } {
  const pr = periodRange(now, period)
  const os = d.orders.filter((o) => isSale(o) && within(o.createdAt, pr.cur))
  if (os.length >= 3) return { orders: os, fallback: false }
  const r30 = periodRange(now, 'oy').cur
  return { orders: d.orders.filter((o) => isSale(o) && within(o.createdAt, r30)), fallback: true }
}

export function computeSales(d: DataSnapshot, now: ISODate, period: PeriodKey): Sales {
  const pr = periodRange(now, period)
  const stats = statsIn(d.dailyStats, pr.cur)
  const chart30 = d.dailyStats.map((s) => ({ date: s.date, label: s.date.slice(8) + '.' + s.date.slice(5, 7), listings: s.listingsSalesTiyin, mall: s.mallSalesTiyin }))

  const regAcc = new Map<string, number>()
  for (const s of stats) for (const [r, v] of Object.entries(s.byRegion)) regAcc.set(r, (regAcc.get(r) ?? 0) + (v ?? 0))
  const regTotal = sum([...regAcc.values()]) || 1
  const regions = [...regAcc.entries()].map(([id, v]) => ({ id, label: d.regions.find((r) => r.id === (id as RegionId))?.name ?? id, value: v, count: 0, share: v / regTotal })).sort((a, b) => b.value - a.value)

  const { orders, fallback } = periodOrders(d, now, period)
  const prodAcc = new Map<string, RankRow>()
  const compAcc = new Map<string, RankRow & { returnRate: number; returns: number }>()
  const sellAcc = new Map<string, RankRow>()
  const catAcc = new Map<string, RankRow>()
  const returnedSubs = new Set(d.returns.map((r) => r.subOrderId))
  for (const o of orders) for (const so of o.subOrders) {
    if (so.status === 'cancelled') continue
    const isCompany = so.sellerKey.startsWith('c:')
    const acc = isCompany ? compAcc : sellAcc
    const cur = acc.get(so.sellerKey) ?? { id: so.sellerKey, label: so.sellerName, value: 0, count: 0, returnRate: 0, returns: 0 }
    cur.value += so.subtotalTiyin; cur.count += 1
    if (isCompany) { const c = cur as RankRow & { returnRate: number; returns: number }; if (returnedSubs.has(so.id)) c.returns += 1; compAcc.set(so.sellerKey, c) } else sellAcc.set(so.sellerKey, cur)
    for (const it of so.items) {
      const p = prodAcc.get(it.title) ?? { id: it.refId, label: it.title, value: 0, count: 0 }
      p.value += it.priceTiyin * it.qty; p.count += it.qty; prodAcc.set(it.title, p)
      const catId = it.source === 'product' ? d.products.find((x) => x.id === it.refId)?.categoryId : d.listings.find((x) => x.id === it.refId)?.categoryId
      const root = rootCategory(d, catId)
      const c = catAcc.get(root.id) ?? { id: root.id, label: root.name, value: 0, count: 0 }
      c.value += it.priceTiyin * it.qty; c.count += it.qty; catAcc.set(root.id, c)
    }
  }
  const catTotal = sum([...catAcc.values()].map((c) => c.value)) || 1
  return {
    chart30,
    regions,
    topProducts: [...prodAcc.values()].sort((a, b) => b.value - a.value).slice(0, 10),
    topCompanies: [...compAcc.values()].map((c) => ({ ...c, returnRate: c.count ? c.returns / c.count : 0 })).sort((a, b) => b.value - a.value).slice(0, 5),
    topSellers: [...sellAcc.values()].sort((a, b) => b.value - a.value).slice(0, 5),
    categories: [...catAcc.values()].map((c) => ({ ...c, share: c.value / catTotal })).sort((a, b) => b.value - a.value).slice(0, 8),
    recentOrders: [...d.orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 20),
    fallback,
  }
}

function rootCategory(d: DataSnapshot, id: string | undefined): { id: string; name: string } {
  let c = d.categories.find((x) => x.id === id)
  let guard = 0
  while (c && c.parentId && guard++ < 6) { const p = d.categories.find((x) => x.id === c!.parentId); if (!p) break; c = p }
  return c ? { id: c.id, name: c.name } : { id: 'other', name: 'Boshqa' }
}

// ─── Pul ─────────────────────────────────────────────────────────────────
export interface MoneyView {
  income: Tiyin; escrow: Tiyin; outcome: Tiyin; commission: Tiyin; refunds: Tiyin; boost: Tiyin; lostCommission: Tiyin; net: Tiyin
  cashflow: { date: string; label: string; in: Tiyin; out: Tiyin }[]
  awaiting: Payout[]
  settlement: { id: string; name: string; sales: Tiyin; commission: Tiyin; toPay: Tiyin; pending: Tiyin; rate: number }[]
}

export function computeMoney(d: DataSnapshot, now: ISODate, period: PeriodKey): MoneyView {
  const pr = periodRange(now, period)
  const tx = d.transactions.filter((t) => t.status === 'ok' && within(t.at, pr.cur))
  const kind = (k: string) => sum(tx.filter((t) => t.kind === k).map((t) => Math.abs(t.amountTiyin)))
  const stats = statsIn(d.dailyStats, pr.cur)
  const commission = sum(stats.map((s) => s.commissionTiyin))
  const refunds = kind('refund')
  const boost = kind('boost')
  const lostCommission = sum(d.orders.filter((o) => o.status === 'cancelled' && within(o.createdAt, pr.cur)).flatMap((o) => o.subOrders.map((s) => s.feeTiyin)))
    + sum(d.orders.flatMap((o) => o.subOrders).filter((s) => s.status === 'refunded' && within(s.timeline[s.timeline.length - 1]?.at, pr.cur)).map((s) => s.feeTiyin))
  const escrow = sum(d.orders.filter((o) => o.payment.escrow === 'held' && o.status !== 'cancelled').map((o) => o.totalTiyin))

  // 30 kunlik pul oqimi
  const days: { date: string; label: string; in: Tiyin; out: Tiyin }[] = []
  const idx = new Map<string, number>()
  for (let i = 29; i >= 0; i--) { const k = dateKey(addDays(now, -i)); idx.set(k, days.length); days.push({ date: k, label: k.slice(8) + '.' + k.slice(5, 7), in: 0, out: 0 }) }
  for (const t of d.transactions) {
    if (t.status !== 'ok') continue
    const i = idx.get(dateKey(t.at)); if (i === undefined) continue
    if (t.kind === 'payment_in' || t.kind === 'boost' || t.kind === 'commission') days[i].in += Math.abs(t.amountTiyin)
    else days[i].out += Math.abs(t.amountTiyin)
  }

  const awaiting = d.payouts.filter((p) => p.status !== 'paid').sort((a, b) => (a.status === 'awaiting_second_approval' ? -1 : b.status === 'awaiting_second_approval' ? 1 : b.amountTiyin - a.amountTiyin))

  const { orders } = periodOrders(d, now, period)
  const settlement = d.companies.map((c) => {
    const subs = orders.flatMap((o) => o.subOrders).filter((s) => s.sellerKey === `c:${c.id}` && s.status !== 'cancelled')
    const sales = sum(subs.map((s) => s.subtotalTiyin))
    const comm = sum(subs.map((s) => s.feeTiyin))
    const pending = sum(d.payouts.filter((p) => p.sellerKey === `c:${c.id}` && p.status !== 'paid').map((p) => p.amountTiyin))
    return { id: c.id, name: c.name, sales, commission: comm, toPay: sales - comm, pending, rate: c.commissionRate }
  }).filter((r) => r.sales > 0 || r.pending > 0).sort((a, b) => b.sales - a.sales)

  return { income: kind('payment_in'), escrow, outcome: kind('payout'), commission, refunds, boost, lostCommission, net: commission + boost - lostCommission, cashflow: days, awaiting, settlement }
}

// ─── Ombor ───────────────────────────────────────────────────────────────
export interface StockView {
  totalQty: number; totalValue: Tiyin; skus: number
  warehouses: { id: string; name: string; qty: number; value: Tiyin; skus: number; fill: number; capacity: number }[]
  low: { productId: string; title: string; company: string; qty: number; min: number; daysLeft: string; tone: 'brick' | 'gold'; waiting: number }[]
  incoming: (StockReceipt & { companyName: string; warehouseName: string })[]
  todayIn: number; todayOut: number
  topMoving: RankRow[]
  byCompany: RankRow[]
}

export function computeStock(d: DataSnapshot, now: ISODate): StockView {
  const price = new Map(d.products.map((p) => [p.id, p]))
  const company = (id: string) => d.companies.find((c) => c.id === id)?.name ?? '—'
  let totalQty = 0; let totalValue = 0
  const skuSet = new Set<string>()
  const whAcc = new Map<string, { qty: number; value: Tiyin; skus: Set<string> }>()
  const byProduct = new Map<string, { qty: number; min: number }>()
  for (const l of d.stockLevels) {
    const p = price.get(l.productId)
    const v = l.qty * (p?.priceTiyin ?? 0)
    totalQty += l.qty; totalValue += v
    if (l.qty > 0) skuSet.add(l.productId)
    const w = whAcc.get(l.warehouseId) ?? { qty: 0, value: 0, skus: new Set<string>() }
    w.qty += l.qty; w.value += v; if (l.qty > 0) w.skus.add(l.productId); whAcc.set(l.warehouseId, w)
    const bp = byProduct.get(l.productId) ?? { qty: 0, min: 0 }
    bp.qty += l.qty; bp.min = Math.max(bp.min, l.minQty); byProduct.set(l.productId, bp)
  }
  const out30 = outPerProduct(d, now)
  // yig'ilmagan buyurtmalar (packing) — mahsulot bo'yicha kutayotgan dona
  const waiting = new Map<string, number>()
  for (const o of d.orders) for (const so of o.subOrders) {
    if (so.status !== 'packing') continue
    for (const it of so.items) if (it.source === 'product') waiting.set(it.refId, (waiting.get(it.refId) ?? 0) + it.qty)
  }
  const low = [...byProduct.entries()].filter(([, v]) => v.qty <= v.min).map(([pid, v]) => {
    const p = price.get(pid)
    return { productId: pid, title: p?.title ?? pid, company: p ? company(p.companyId) : '—', qty: v.qty, min: v.min, daysLeft: daysLeftLabel(v.qty, out30.get(pid) ?? 0), tone: (v.qty === 0 ? 'brick' : 'gold') as 'brick' | 'gold', waiting: waiting.get(pid) ?? 0 }
  }).sort((a, b) => a.qty - b.qty || b.waiting - a.waiting)

  const today = dateKey(now)
  let todayIn = 0; let todayOut = 0
  for (const m of d.movements) {
    if (dateKey(m.at) !== today) continue
    if (m.kind === 'in' || m.kind === 'return') todayIn += Math.abs(m.qty)
    else if (m.kind === 'out') todayOut += Math.abs(m.qty)
  }
  const topMoving = [...out30.entries()].map(([pid, q]) => ({ id: pid, label: price.get(pid)?.title ?? pid, value: q, count: q, hint: price.get(pid) ? company(price.get(pid)!.companyId) : undefined })).sort((a, b) => b.value - a.value).slice(0, 8)

  const monthKey = today.slice(0, 7)
  const compAcc = new Map<string, RankRow>()
  for (const rc of d.receipts) {
    if (rc.status === 'expected' || !rc.receivedAt || dateKey(rc.receivedAt).slice(0, 7) !== monthKey) continue
    const c = compAcc.get(rc.companyId) ?? { id: rc.companyId, label: company(rc.companyId), value: 0, count: 0 }
    c.value += rc.totalTiyin; c.count += 1; compAcc.set(rc.companyId, c)
  }
  return {
    totalQty, totalValue, skus: skuSet.size,
    warehouses: d.warehouses.map((w) => { const a = whAcc.get(w.id); return { id: w.id, name: w.name, qty: a?.qty ?? 0, value: a?.value ?? 0, skus: a?.skus.size ?? 0, capacity: w.capacity, fill: w.capacity ? Math.min(1, (a?.qty ?? 0) / w.capacity) : 0 } }),
    low,
    incoming: d.receipts.filter((r) => r.status === 'expected').map((r) => ({ ...r, companyName: company(r.companyId), warehouseName: d.warehouses.find((w) => w.id === r.warehouseId)?.name ?? r.warehouseId })),
    todayIn, todayOut,
    topMoving,
    byCompany: [...compAcc.values()].sort((a, b) => b.value - a.value),
  }
}

// ─── Buyurtma tafsiloti ──────────────────────────────────────────────────
export function orderMoney(o: Order): { items: Tiyin; delivery: Tiyin; fee: Tiyin; sellerGets: Tiyin; total: Tiyin } {
  const fee = sum(o.subOrders.map((s) => s.feeTiyin))
  return { items: o.itemsTiyin, delivery: o.delivery.feeTiyin, fee, sellerGets: o.itemsTiyin - fee, total: o.totalTiyin }
}
export function subLabel(so: SubOrder): string { return uz.orders.status[so.status] }
export function productOf(d: DataSnapshot, id: string): Product | undefined { return d.products.find((p) => p.id === id) }
