import { audit, currentActor, mutate, now, genId, ApiError, emitLater } from './core'
import type { Product, StockLevel, StockReceipt, StockReceiptLine, Tiyin } from '@/domain/types'
import { formatMoney } from '@/domain/money'

function level(d: { stockLevels: StockLevel[] }, productId: string, warehouseId: string): StockLevel {
  let l = d.stockLevels.find((x) => x.productId === productId && x.warehouseId === warehouseId)
  if (!l) { l = { productId, warehouseId, qty: 0, reserved: 0, minQty: 5 }; d.stockLevels.push(l) }
  return l
}
function syncProduct(d: { products: Product[]; stockLevels: StockLevel[] }, productId: string) {
  const p = d.products.find((x) => x.id === productId)
  if (p) p.stock = d.stockLevels.filter((l) => l.productId === productId).reduce((a, l) => a + l.qty, 0)
}

export const warehouse = {
  /** Kompaniyadan kutilayotgan kirim yaratish */
  async createReceipt(input: { companyId: string; warehouseId: string; lines: StockReceiptLine[]; note?: string }): Promise<StockReceipt> {
    if (!input.lines.length) throw new ApiError('empty', 'Kamida bitta qator kerak')
    return mutate((d) => {
      const c = d.companies.find((x) => x.id === input.companyId)!
      const rc: StockReceipt = {
        id: genId('RC'), companyId: c.id, warehouseId: input.warehouseId, status: 'expected', lines: input.lines,
        totalTiyin: input.lines.reduce((a, l) => a + l.qty * l.unitCostTiyin, 0), expectedAt: now(),
        invoiceNo: `INV-${c.inn.slice(-4)}-${Math.floor(1000 + Math.random() * 8999)}`, note: input.note,
      }
      d.receipts.unshift(rc)
      audit(d, currentActor('staff'), 'data', 'receipt', rc.id, 'created', null, `${c.name} · ${input.lines.length} qator`)
      return rc
    })
  },
  /** Yuk keldi: qabul qilish (acceptedQty bilan) → zaxira oshadi */
  async receive(receiptId: string, accepted?: Record<string, number>) {
    return mutate((d) => {
      const rc = d.receipts.find((x) => x.id === receiptId)!
      if (rc.status !== 'expected') throw new ApiError('state', 'Bu kirim allaqachon qabul qilingan')
      const actor = currentActor('staff')
      for (const l of rc.lines) {
        l.acceptedQty = accepted?.[l.productId] ?? l.qty
        const lv = level(d, l.productId, rc.warehouseId)
        lv.qty += l.acceptedQty
        d.movements.unshift({ id: genId('MV'), at: now(), productId: l.productId, warehouseId: rc.warehouseId, kind: 'in', qty: l.acceptedQty, refId: rc.id, by: actor.id, note: `Kirim ${rc.invoiceNo}` })
        syncProduct(d, l.productId)
      }
      rc.status = 'received'; rc.receivedAt = now()
      audit(d, actor, 'status', 'receipt', rc.id, 'status', 'expected', 'received', formatMoney(rc.totalTiyin))
      emitLater('admin.toast', { title: 'Kirim qabul qilindi', body: `${rc.invoiceNo} · ${rc.lines.length} qator`, section: 'warehouse', tone: 'success' })
      return rc
    })
  },
  async check(receiptId: string) {
    return mutate((d) => {
      const rc = d.receipts.find((x) => x.id === receiptId)!
      if (rc.status !== 'received') throw new ApiError('state', 'Avval qabul qilinishi kerak')
      rc.status = 'checked'; rc.checkedBy = currentActor('staff').id
      audit(d, currentActor('staff'), 'status', 'receipt', rc.id, 'status', 'received', 'checked')
      return rc
    })
  },
  /** Inventarizatsiya tuzatishi — sabab majburiy */
  async adjust(productId: string, warehouseId: string, qty: number, reason: string) {
    if (!reason.trim()) throw new ApiError('reason_required', 'Sabab kiritish shart')
    return mutate((d) => {
      const lv = level(d, productId, warehouseId)
      const before = lv.qty
      lv.qty = Math.max(0, lv.qty + qty)
      d.movements.unshift({ id: genId('MV'), at: now(), productId, warehouseId, kind: 'adjust', qty: lv.qty - before, by: currentActor('staff').id, note: reason })
      syncProduct(d, productId)
      audit(d, currentActor('staff'), 'data', 'stock', `${productId}@${warehouseId}`, 'qty', before, lv.qty, reason)
      return lv
    })
  },
  /** Omborlar orasida ko'chirish */
  async transfer(productId: string, fromId: string, toId: string, qty: number) {
    return mutate((d) => {
      const a = level(d, productId, fromId)
      if (a.qty < qty) throw new ApiError('insufficient', 'Zaxira yetarli emas')
      a.qty -= qty; level(d, productId, toId).qty += qty
      const actor = currentActor('staff')
      d.movements.unshift({ id: genId('MV'), at: now(), productId, warehouseId: fromId, kind: 'transfer', qty: -qty, refId: toId, by: actor.id, note: `Ko'chirish → ${toId}` })
      d.movements.unshift({ id: genId('MV'), at: now(), productId, warehouseId: toId, kind: 'transfer', qty, refId: fromId, by: actor.id, note: `Ko'chirish ← ${fromId}` })
      audit(d, actor, 'data', 'stock', productId, 'transfer', fromId, toId, `${qty} dona`)
    })
  },
  async setMinQty(productId: string, warehouseId: string, minQty: number) {
    return mutate((d) => { level(d, productId, warehouseId).minQty = minQty }, { latency: [60, 150] })
  },
  /** Ombor xodimi yangi tovar qo'shadi (kompaniya nomidan) */
  async addProduct(input: { companyId: string; sku: string; title: string; categoryId: string; priceTiyin: Tiyin; qty: number; warehouseId: string; unitCostTiyin: Tiyin; warrantyMonths?: number; description?: string }): Promise<Product> {
    return mutate((d) => {
      if (d.products.some((p) => p.companyId === input.companyId && p.sku === input.sku)) throw new ApiError('dup', 'Bu SKU allaqachon mavjud')
      const market = Math.round(input.priceTiyin * 1.04 / 100000) * 100000
      const p: Product = {
        id: genId('P'), companyId: input.companyId, sku: input.sku, categoryId: input.categoryId, title: input.title, description: input.description ?? '',
        images: [`ill-${input.categoryId.replace('cat-', '')}-1`], priceTiyin: input.priceTiyin, marketMedianTiyin: market, stock: 0,
        warrantyMonths: input.warrantyMonths ?? 12, returnDays: 14, check: 'pending', checkDelta: Math.round(((input.priceTiyin - market) / market) * 1000) / 1000,
        attributes: {}, stats: { views: 0, saves: 0, chats: 0, viewsByDay: Array(14).fill(0) }, createdAt: now(),
      }
      d.products.unshift(p)
      const actor = currentActor('staff')
      if (input.qty > 0) {
        level(d, p.id, input.warehouseId).qty = input.qty
        d.movements.unshift({ id: genId('MV'), at: now(), productId: p.id, warehouseId: input.warehouseId, kind: 'in', qty: input.qty, by: actor.id, note: 'Yangi tovar kirimi' })
        syncProduct(d, p.id)
      }
      audit(d, actor, 'data', 'product', p.id, 'created', null, `${p.title} · ${input.qty} dona`)
      return p
    })
  },
}
