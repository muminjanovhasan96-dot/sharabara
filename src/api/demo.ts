import { bus, currentActor, audit, delay, setFastMode } from './core'
import { useStore } from '@/store'
import { logistics } from './logistics'
import { finance } from './finance'
import { setHour, addDays, dateKey } from '@/domain/clock'
import type { DailyStat, DataSnapshot } from '@/domain/types'
import { subTransition } from './orders'

/**
 * Demo soati oldinga surilganda yangi kun uchun statistika qatori bo'lmasa, oldingi 7 kun o'rtachasidan
 * «fon» qatori qo'shiladi — Direktor paneli va Boshqaruv paneli «0 so'm, −100%» ko'rsatmaydi.
 */
export function ensureDailyStat(d: DataSnapshot, now: string) {
  const key = dateKey(now)
  if (d.dailyStats.some((s) => s.date === key)) return
  const last = d.dailyStats.slice(-7)
  if (!last.length) return
  const avg = (pick: (s: DailyStat) => number) => Math.round(last.reduce((a, s) => a + pick(s), 0) / last.length)
  // kun raqamidan kichik deterministik tebranish (±6%)
  const seed = Number(key.slice(-2)) || 1
  const wob = 1 + (((seed * 37) % 13) - 6) / 100
  const byRegion: DailyStat['byRegion'] = {}
  for (const s of last) for (const [k, v] of Object.entries(s.byRegion)) byRegion[k as keyof DailyStat['byRegion']] = (byRegion[k as keyof DailyStat['byRegion']] ?? 0) + Math.round((v ?? 0) / last.length)
  d.dailyStats.push({
    date: key,
    listingsSalesTiyin: Math.round(avg((s) => s.listingsSalesTiyin) * wob / 100) * 100,
    mallSalesTiyin: Math.round(avg((s) => s.mallSalesTiyin) * wob / 100) * 100,
    orders: Math.round(avg((s) => s.orders) * wob),
    newListings: Math.round(avg((s) => s.newListings) * wob),
    commissionTiyin: Math.round(avg((s) => s.commissionTiyin) * wob / 100) * 100,
    avgReviewMinutes: avg((s) => s.avgReviewMinutes),
    byRegion,
  })
  d.dailyStats.sort((a, b) => a.date.localeCompare(b.date))
}

/** Demo vaqt boshqaruvi: haqiqiy vaqt emas, `clock.now` */
export const demo = {
  setFastMode,
  /** "Soat 17:00 ga o'tkazish" — manifest yopiladi, qadoqlanmaganlar ertaga */
  async to17() {
    const s = useStore.getState()
    const t = setHour(s.clock.now, 17, 0)
    s.setClock(t)
    bus.emit('clock', { now: t, label: 'Soat 17:00' })
    await logistics.closeManifest()
  },
  /** "Kechki BTS mashinasi keldi" — 19:00, yopilgan manifest BTS'ga topshiriladi */
  async btsArrived() {
    const s = useStore.getState()
    const t = setHour(s.clock.now, 19, 0)
    s.setClock(t)
    bus.emit('clock', { now: t, label: 'BTS mashinasi keldi' })
    await logistics.handToBts()
  },
  /** "+1 kun" — in_transit → at_branch avtomatik */
  async plusDay() {
    const s = useStore.getState()
    const t = setHour(addDays(s.clock.now, 1), 10, 0)
    s.setClock(t)
    s.update((d) => { (d as unknown as { _dayOffset?: number })._dayOffset = undefined })
    useStore.setState((st) => { st.clock.dayOffset += 1 })
    bus.emit('clock', { now: t, label: '+1 kun' })
    await delay(200, 400)
    useStore.getState().update((d) => {
      ensureDailyStat(d, t)
      for (const o of d.orders) for (const so of o.subOrders) {
        if (so.status === 'in_transit') subTransition(d, o, so, 'at_branch', 'bts', 'Filialga yetdi')
        else if (so.status === 'handed_to_bts') subTransition(d, o, so, 'in_transit', 'bts', 'Yo’lga chiqdi')
      }
      // expire boosted listings
      for (const l of d.listings) if (l.boosted && l.boosted.until < t) l.boosted = undefined
      audit(d, currentActor('staff'), 'data', 'clock', 'demo', 'now', null, t, '+1 kun')
    })
  },
  /** "Juma — to'lov kuni" */
  async payday() {
    const s = useStore.getState()
    const cur = new Date(s.clock.now)
    const daysToFri = (5 - cur.getDay() + 7) % 7
    const t = setHour(addDays(s.clock.now, daysToFri), 11, 0)
    s.setClock(t)
    s.update((d) => { for (let i = 0; i <= daysToFri; i++) ensureDailyStat(d, addDays(s.clock.now, i)) })
    bus.emit('clock', { now: t, label: 'Juma — to’lov kuni' })
    await finance.payday()
  },
  async reset(seed?: number) {
    await delay(200, 400)
    const s = useStore.getState()
    s.reset(seed)
    bus.emit('reset', { seed: seed ?? 2026 })
  },
  async reseed() {
    const seed = Math.floor(1000 + Math.random() * 9000)
    await demo.reset(seed)
    return seed
  },
}
