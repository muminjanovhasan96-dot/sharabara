/** Ombor: kirimlar (kompaniyadan), zaxira darajalari, harakatlar. Deterministik. */
import type { Company, ISODate, Order, Product, SalesChannel, StockLevel, StockMovement, StockReceipt, Warehouse } from '../domain/types'
import type { Rng } from './rng'
import { addDays, addHours, dateKey } from '../domain/clock'

export const WAREHOUSES: Warehouse[] = [
  { id: 'wh-tosh', name: 'Toshkent markaziy ombor', regionId: 'toshkent_sh', address: 'Yashnobod, Parkent ko’chasi 2 (namuna)', capacity: 12_000 },
  { id: 'wh-namangan', name: 'Namangan ombor', regionId: 'namangan', address: 'Namangan, Islom Karimov ko’chasi 15 (namuna)', capacity: 4_000 },
]

/** Buyurtma kanali: id hash bo'yicha barqaror taqsimot (60% ilova, 20% Telegram, 12% Instagram, 8% oflayn) */
export function channelFor(orderId: string): SalesChannel {
  let h = 0
  for (const ch of orderId) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const r = h % 100
  return r < 60 ? 'app' : r < 80 ? 'telegram' : r < 92 ? 'instagram' : 'offline'
}

export function makeWarehouse(r: Rng, now: ISODate, companies: Company[], products: Product[], orders: Order[]) {
  const receipts: StockReceipt[] = []
  const movements: StockMovement[] = []
  const levels = new Map<string, StockLevel>()
  const key = (p: string, w: string) => `${p}|${w}`
  const level = (p: string, w: string) => {
    let l = levels.get(key(p, w))
    if (!l) { l = { productId: p, warehouseId: w, qty: 0, reserved: 0, minQty: 5 }; levels.set(key(p, w), l) }
    return l
  }
  let seq = 1200
  // 30 kun ichida har kompaniyadan 4–7 ta kirim
  for (const c of companies) {
    const own = products.filter((p) => p.companyId === c.id)
    const n = r.int(4, 7)
    for (let i = 0; i < n; i++) {
      const daysAgo = r.int(0, 29)
      const at = addHours(addDays(now, -daysAgo), -r.int(1, 9))
      const wh = r.chance(0.8) ? 'wh-tosh' : 'wh-namangan'
      const picks = r.shuffle(own).slice(0, r.int(3, 8))
      const lines = picks.map((p) => {
        const qty = r.int(5, 40)
        const unitCost = Math.round((p.priceTiyin * r.int(70, 85)) / 100 / 100_000) * 100_000
        return { productId: p.id, qty, unitCostTiyin: unitCost, acceptedQty: qty }
      })
      const total = lines.reduce((a, l) => a + l.qty * l.unitCostTiyin, 0)
      const status = daysAgo === 0 && i === n - 1 ? 'expected' : daysAgo <= 1 && r.chance(0.5) ? 'received' : 'checked'
      seq += r.int(1, 4)
      const rec: StockReceipt = {
        id: `RC-${seq}`, companyId: c.id, warehouseId: wh, status, lines, totalTiyin: total,
        expectedAt: status === 'expected' ? addHours(now, r.int(2, 6)) : at,
        receivedAt: status === 'expected' ? undefined : at, checkedBy: status === 'checked' ? 's-log' : undefined,
        invoiceNo: `INV-${c.inn.slice(-4)}-${String(seq).padStart(4, '0')}`,
      }
      receipts.push(rec)
      if (status !== 'expected') for (const l of lines) {
        level(l.productId, wh).qty += l.qty
        movements.push({ id: `MV-${movements.length + 1}`, at, productId: l.productId, warehouseId: wh, kind: 'in', qty: l.qty, refId: rec.id, by: 's-log', note: `Kirim ${c.name}` })
      }
    }
  }
  // sotuvlar: mall buyurtmalari zaxiradan chiqadi (kanal bilan)
  for (const o of orders) {
    for (const so of o.subOrders) {
      if (!so.sellerKey.startsWith('c:')) continue
      if (['cancelled'].includes(so.status)) continue
      for (const it of so.items) {
        if (it.source !== 'product') continue
        const l = level(it.refId, 'wh-tosh')
        l.qty = Math.max(0, l.qty - it.qty)
        movements.push({ id: `MV-${movements.length + 1}`, at: o.createdAt, productId: it.refId, warehouseId: 'wh-tosh', kind: 'out', qty: -it.qty, refId: o.id, channel: o.channel, by: 'system', note: `Buyurtma ${o.id}` })
      }
    }
  }
  // ba'zi tuzatishlar (inventarizatsiya)
  for (let i = 0; i < 6; i++) {
    const p = r.pick(products)
    const l = level(p.id, 'wh-tosh')
    const q = r.int(-2, 3)
    if (!q) continue
    l.qty = Math.max(0, l.qty + q)
    movements.push({ id: `MV-${movements.length + 1}`, at: addDays(now, -r.int(1, 20)), productId: p.id, warehouseId: 'wh-tosh', kind: 'adjust', qty: q, by: 's-log', note: q > 0 ? 'Inventarizatsiya: ortiqcha topildi' : 'Inventarizatsiya: kamomad' })
  }
  // mahsulot zaxirasini ombor bilan sinxronlash (product.stock = jami)
  for (const p of products) {
    const total = [...levels.values()].filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty, 0)
    if (total > 0) p.stock = total
    else { level(p.id, 'wh-tosh').qty = p.stock }
  }
  movements.sort((a, b) => (a.at < b.at ? 1 : -1))
  receipts.sort((a, b) => ((a.receivedAt ?? a.expectedAt) < (b.receivedAt ?? b.expectedAt) ? 1 : -1))
  return { warehouses: WAREHOUSES.map((w) => ({ ...w })), receipts, movements, stockLevels: [...levels.values()] }
}

export function receiptDateKey(rc: StockReceipt) { return dateKey(rc.receivedAt ?? rc.expectedAt) }
