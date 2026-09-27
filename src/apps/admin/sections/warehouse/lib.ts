/** Ombor bo'limi uchun umumiy hisob-kitoblar (sof funksiyalar). */
import type { BadgeTone } from '@/design'
import type { DataSnapshot, MovementKind, ReceiptStatus, SalesChannel, StockLevel, StockMovement, StockReceipt, Tiyin } from '@/domain/types'
import { addDays, dateKey } from '@/domain/clock'
import { A } from '../../strings'

export type WhFilter = 'all' | string
export const CHANNELS: SalesChannel[] = ['app', 'instagram', 'telegram', 'offline']
export const CHANNEL_COLOR: Record<SalesChannel, string> = { app: 'var(--blue)', instagram: '#8b5cf6', telegram: 'var(--ink)', offline: 'var(--gold-fill)' }
export const CHANNEL_TONE: Record<SalesChannel, BadgeTone> = { app: 'blue', instagram: 'neutral', telegram: 'neutral', offline: 'gold' }
export const CHANNEL_BG: Record<SalesChannel, string> = { app: 'bg-blue', instagram: 'bg-[#8b5cf6]', telegram: 'bg-ink', offline: 'bg-gold-fill' }
export const KIND_TONE: Record<MovementKind, BadgeTone> = { in: 'green', out: 'blue', adjust: 'gold', transfer: 'neutral', return: 'brick' }
export const RECEIPT_TONE: Record<ReceiptStatus, BadgeTone> = { expected: 'gold', received: 'blue', checked: 'green' }

export function channelLabel(c: SalesChannel | undefined): string { return c ? A.warehouse.sales.channel[c] : '—' }
export function kindLabel(k: MovementKind): string { return A.warehouse.movements.kinds[k] }
export function whName(d: Pick<DataSnapshot, 'warehouses'>, id: string | undefined): string { return d.warehouses.find((w) => w.id === id)?.name ?? id ?? '—' }
/** Qisqa ombor nomi: "Toshkent markaziy" */
export function whShort(d: Pick<DataSnapshot, 'warehouses'>, id: string | undefined): string { return whName(d, id).replace(/\s*ombor$/i, '') }
export function inWh(f: WhFilter, id: string): boolean { return f === 'all' || f === id }

/** Oxirgi kirim tannarxi (product → tiyin); yo'q bo'lsa narxning 78% */
export function lastCostMap(d: Pick<DataSnapshot, 'receipts' | 'products'>): Map<string, Tiyin> {
  const m = new Map<string, { at: string; cost: Tiyin }>()
  for (const rc of d.receipts) {
    const at = rc.receivedAt ?? rc.expectedAt
    for (const l of rc.lines) { const cur = m.get(l.productId); if (!cur || cur.at < at) m.set(l.productId, { at, cost: l.unitCostTiyin }) }
  }
  const out = new Map<string, Tiyin>()
  for (const p of d.products) out.set(p.id, m.get(p.id)?.cost ?? Math.round(p.priceTiyin * 0.78))
  return out
}

/** Oxirgi N kun sanalari (eski → yangi) */
export function lastDays(now: string, n: number): string[] { return Array.from({ length: n }, (_, i) => dateKey(addDays(now, -(n - 1 - i)))) }

/** Kunlar bo'yicha yig'indi (kind filtri bilan) — sparkline uchun */
export function dailyTotals(movs: StockMovement[], days: string[], kind: MovementKind): number[] {
  const idx = new Map(days.map((d, i) => [d, i]))
  const out = days.map(() => 0)
  for (const m of movs) { if (m.kind !== kind) continue; const i = idx.get(dateKey(m.at)); if (i !== undefined) out[i] += Math.abs(m.qty) }
  return out
}

/** Kun oxiridagi jami zaxira (hozirgi qoldiqdan orqaga hisoblab) */
export function stockHistory(levels: StockLevel[], movs: StockMovement[], days: string[]): number[] {
  const current = levels.reduce((a, l) => a + l.qty, 0)
  const after = days.map(() => 0)
  for (const m of movs) { const k = dateKey(m.at); for (let i = 0; i < days.length; i++) if (k > days[i]) after[i] += m.qty }
  return after.map((a) => Math.max(0, current - a))
}

export function receiptQty(rc: StockReceipt): number { return rc.lines.reduce((a, l) => a + (l.acceptedQty ?? l.qty), 0) }
export function receiptDate(rc: StockReceipt): string { return rc.receivedAt ?? rc.expectedAt }
export function isOrderId(id: string | undefined): boolean { return !!id && id.startsWith('O-') }
export function isReceiptId(id: string | undefined): boolean { return !!id && id.startsWith('RC-') }
