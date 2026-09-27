/**
 * BTS paneli uchun api'da yo'q yupqa yordamchi. Faqat store.update orqali yozadi.
 * Hisobotda qayd etilgan: ensureWaybills — seed'dagi «qadoqlangan» yuklarda yuk xati
 * bo'lmaydi (api.logistics.pack orqali o'tmagan); skanerlash ishlashi uchun manifestdagi
 * yuk xati yo'q yuklarga api.logistics.pack formatidagi raqam beriladi.
 */
import { useStore } from '@/store'
import { dateKey } from '@/domain/clock'

export function ensureWaybills(manifestId: string): void {
  const s = useStore.getState()
  const m = s.data.manifests.find((x) => x.id === manifestId)
  if (!m) return
  const missing = new Set<string>()
  for (const o of s.data.orders) for (const so of o.subOrders) if (m.subOrderIds.includes(so.id) && !so.waybill) missing.add(so.id)
  if (missing.size === 0) return
  const day = dateKey(s.clock.now).slice(5).replace('-', '')
  s.update((d) => {
    for (const o of d.orders) for (const so of o.subOrders) if (missing.has(so.id)) so.waybill = `BTS-${day}-${Math.floor(10000 + Math.random() * 89999)}`
  })
}
