import { audit, emitLater, currentActor, mutate, now, pushNotification, ApiError, genId, delay } from './core'
import { useStore } from '@/store'
import type { CartItem, DeliveryMethod, Order, PaymentMethod, SubOrder, SubOrderStatus, Tiyin, ReturnRequest } from '@/domain/types'
import { orderMachine, subOrderMachine, returnMachine } from '@/domain/machines'
import { calcFee } from '@/domain/fees'
import { formatMoney } from '@/domain/money'
import { uz } from '@/i18n/uz'

export const DELIVERY_FEE: Record<DeliveryMethod, Tiyin> = { bts_branch: 3_500_000, courier_tashkent: 2_500_000, pickup: 0 }

export function subTransition(d: { orders: Order[] }, o: Order, so: SubOrder, to: SubOrderStatus, actorKind: 'staff' | 'user' | 'bts' | 'company', note?: string) {
  subOrderMachine.assert(so.status, to)
  const from = so.status
  so.status = to
  const actor = currentActor(actorKind)
  so.timeline.push({ status: to, at: now(), by: actor.id, role: actor.role, note })
  audit(d as never, actor, 'status', 'subOrder', so.id, 'status', from, to, note)
  const label = (uz.orders.status as Record<string, string>)[to] ?? to
  const body = so.items.map((i) => i.title).join(', ')
  if (['packed', 'handed_to_bts', 'in_transit', 'at_branch', 'delivered', 'refunded'].includes(to)) {
    pushNotification(d as never, o.buyerId, 'order_status', `Buyurtma ${o.id}: ${label}`, body, `/m/orders/${o.id}`)
  }
  if (to === 'delivered') {
    pushNotification(d as never, o.buyerId, 'rate_request', 'Xaridni baholang', `${body} — sizga yetib bordimi? Sotuvchini baholang.`, `/m/orders/${o.id}`)
  }
  emitLater('order.status', { orderId: o.id, subOrderId: so.id, status: to, buyerId: o.buyerId })
}

export const orders = {
  // ─── Cart (ui state, but still goes through api) ─────────────────────
  async addToCart(item: Omit<CartItem, 'key' | 'qty'>, qty = 1) {
    await delay(60, 160)
    const s = useStore.getState()
    s.setUi((u) => {
      const existing = u.cart.find((c) => c.refId === item.refId)
      if (existing) existing.qty += item.source === 'listing' ? 0 : qty
      else u.cart.push({ ...item, key: `${item.source}:${item.refId}`, qty: item.source === 'listing' ? 1 : qty })
    })
    s.update((d) => {
      const l = d.listings.find((x) => x.id === item.refId)
      d.events.push({ userId: s.session.userId, kind: 'cart', at: now(), itemId: item.refId, source: item.source, categoryId: l?.categoryId, priceTiyin: item.priceTiyin, regionId: l?.regionId, model: l?.specs?.model })
    })
  },
  async removeFromCart(key: string) {
    await delay(40, 120)
    useStore.getState().setUi((u) => { const i = u.cart.findIndex((c) => c.key === key); if (i >= 0) u.cart.splice(i, 1) })
  },
  async setQty(key: string, qty: number) {
    useStore.getState().setUi((u) => { const c = u.cart.find((x) => x.key === key); if (c) c.qty = Math.max(1, qty) })
  },

  /** Rasmiylashtirish: created → paid (escrow held). Splits into sub-orders per seller. */
  async checkout(input: { delivery: DeliveryMethod; branchId?: string; address?: string; payment: PaymentMethod }): Promise<Order> {
    const s = useStore.getState()
    const cart = s.ui.cart
    if (!cart.length) throw new ApiError('empty_cart', 'Savat bo’sh')
    // simulate payment gateway
    await delay(1200, 1600)
    let order!: Order
    s.update((d) => {
      const buyer = currentActor('user')
      const rules = d.feeRuleSets.find((r) => r.status === 'published') ?? d.feeRuleSets[0]
      const groups = new Map<string, CartItem[]>()
      for (const c of cart) { if (!groups.has(c.sellerKey)) groups.set(c.sellerKey, []); groups.get(c.sellerKey)!.push(c) }
      const orderId = genId('O')
      const subOrders: SubOrder[] = []
      for (const [sellerKey, items] of groups) {
        const subtotal = items.reduce((a, i) => a + i.priceTiyin * i.qty, 0)
        let fee = 0
        let sellerName = ''
        if (sellerKey.startsWith('u:')) {
          const u = d.users.find((x) => x.id === sellerKey.slice(2)); sellerName = u?.name ?? 'Sotuvchi'
          for (const i of items) { const l = d.listings.find((x) => x.id === i.refId); fee += l ? calcFee(i.priceTiyin, l.categoryId, rules).feeTiyin : 0 }
        } else {
          const c = d.companies.find((x) => x.id === sellerKey.slice(2)); sellerName = c?.name ?? 'Kompaniya'
          fee = Math.round((subtotal * Math.round((c?.commissionRate ?? 0.08) * 10000)) / 10000)
        }
        const so: SubOrder = {
          id: genId('SO'), orderId, sellerKey, sellerName, items, subtotalTiyin: subtotal, feeTiyin: fee,
          status: 'packing', timeline: [], branchId: input.branchId,
        }
        subOrders.push(so)
      }
      const itemsTiyin = subOrders.reduce((a, so) => a + so.subtotalTiyin, 0)
      const deliveryFee = DELIVERY_FEE[input.delivery]
      order = {
        id: orderId, buyerId: buyer.id, createdAt: now(), status: 'created', channel: 'app',
        payment: { method: input.payment, escrow: 'none' },
        delivery: { method: input.delivery, branchId: input.branchId, address: input.address, feeTiyin: deliveryFee },
        subOrders, itemsTiyin, totalTiyin: itemsTiyin + deliveryFee,
      }
      d.orders.unshift(order)
      audit(d, buyer, 'status', 'order', order.id, 'status', null, 'created')
      // pay
      orderMachine.assert(order.status, 'paid')
      order.status = 'paid'
      order.payment.txId = input.payment === 'cash' ? undefined : genId(input.payment === 'payme' ? 'PM' : 'CL')
      order.payment.paidAt = now()
      order.payment.escrow = input.payment === 'cash' ? 'none' : 'held'
      if (input.payment !== 'cash') {
        d.transactions.unshift({ id: genId('TX'), kind: 'payment_in', provider: input.payment, amountTiyin: order.totalTiyin, at: now(), refId: order.id, status: 'ok', note: `Buyurtma ${order.id} to'lovi (escrow)` })
      }
      audit(d, buyer, 'money', 'order', order.id, 'payment', null, order.totalTiyin, `${input.payment} · escrow`)
      for (const so of subOrders) {
        so.timeline.push({ status: 'packing', at: now(), by: buyer.id, role: 'buyer', note: 'To’lov qabul qilindi' })
        // reserve listings / decrement stock
        for (const i of so.items) {
          const l = d.listings.find((x) => x.id === i.refId)
          if (l && l.status === 'published') { l.status = 'reserved'; audit(d, buyer, 'status', 'listing', l.id, 'status', 'published', 'reserved') }
          const p = d.products.find((x) => x.id === i.refId)
          if (p) {
            p.stock = Math.max(0, p.stock - i.qty)
            const lv = d.stockLevels.find((l) => l.productId === p.id && l.warehouseId === 'wh-tosh') ?? d.stockLevels.find((l) => l.productId === p.id)
            if (lv) lv.qty = Math.max(0, lv.qty - i.qty)
            d.movements.unshift({ id: genId('MV'), at: now(), productId: p.id, warehouseId: lv?.warehouseId ?? 'wh-tosh', kind: 'out', qty: -i.qty, refId: orderId, channel: 'app', by: buyer.id, note: `Buyurtma ${orderId}` })
          }
        }
        // fee approval queue
        d.feeApprovals.unshift({ id: genId('FA'), subOrderId: so.id, orderId, sellerKey: so.sellerKey, priceTiyin: so.subtotalTiyin, autoFeeTiyin: so.feeTiyin, finalFeeTiyin: so.feeTiyin, status: 'pending', createdAt: now() })
        // seller notification
        if (so.sellerKey.startsWith('u:')) pushNotification(d, so.sellerKey.slice(2), 'order_status', 'Tovaringiz sotildi!', `${so.items[0].title} — ${formatMoney(so.subtotalTiyin)}. Sharabara punktiga topshiring.`, '/m/sell/my')
        d.events.push({ userId: buyer.id, kind: 'purchase', at: now(), itemId: so.items[0].refId, source: so.items[0].source })
      }
      // open manifest gets today's sub-orders when packed (logistics)
      emitLater('order.created', { orderId, buyerId: buyer.id })
      emitLater('admin.toast', { title: `Yangi buyurtma ${orderId}`, body: `${formatMoney(order.totalTiyin)} · ${subOrders.length} ta yuk`, section: 'logistics', tone: 'success' })
    })
    s.setUi((u) => { u.cart = [] })
    return order
  },

  async rate(orderId: string, stars: number, comment: string) {
    return mutate((d) => {
      const o = d.orders.find((x) => x.id === orderId)!
      o.rating = { stars, comment, at: now() }
      for (const so of o.subOrders) if (so.sellerKey.startsWith('u:')) {
        const u = d.users.find((x) => x.id === so.sellerKey.slice(2))
        if (u) u.rating = Math.round(((u.rating * 20 + stars) / 21) * 100) / 100
      }
      if (o.subOrders.every((so) => ['delivered', 'payout_scheduled', 'payout_paid', 'refunded'].includes(so.status))) { orderMachine.assert(o.status, 'completed'); o.status = 'completed' }
      return o
    })
  },

  /** Xaridor "Muammo bor" */
  async requestReturn(orderId: string, subOrderId: string, reason: string, description: string, images: string[]): Promise<ReturnRequest> {
    return mutate((d) => {
      const o = d.orders.find((x) => x.id === orderId)!
      const so = o.subOrders.find((x) => x.id === subOrderId)!
      subTransition(d, o, so, 'return_requested', 'user', reason)
      const r: ReturnRequest = { id: genId('R'), orderId, subOrderId, buyerId: o.buyerId, reason, description, images, status: 'requested', createdAt: now(), slaHours: 24 }
      d.returns.unshift(r)
      emitLater('admin.toast', { title: 'Yangi qaytarish so’rovi', body: `${o.id} · ${reason}`, section: 'returns', tone: 'brick' })
      return r
    })
  },

  /** Operator qarori */
  async decideReturn(returnId: string, kind: 'full' | 'partial' | 'deny', amountTiyin: Tiyin, note: string) {
    return mutate((d) => {
      const r = d.returns.find((x) => x.id === returnId)!
      const o = d.orders.find((x) => x.id === r.orderId)!
      const so = o.subOrders.find((x) => x.id === r.subOrderId)!
      const staff = currentActor('staff')
      const to = kind === 'full' ? 'approved_full' : kind === 'partial' ? 'approved_partial' : 'denied'
      returnMachine.assert(r.status, to)
      r.status = to
      r.decision = { kind, amountTiyin: kind === 'deny' ? 0 : amountTiyin, note, by: staff.id, at: now() }
      audit(d, staff, 'money', 'return', r.id, 'decision', null, kind === 'deny' ? 0 : amountTiyin, note)
      if (kind === 'deny') {
        subTransition(d, o, so, 'return_denied', 'staff', note)
        subTransition(d, o, so, 'payout_scheduled', 'staff')
        pushNotification(d, o.buyerId, 'order_status', 'Qaytarish rad etildi', note, `/m/orders/${o.id}`)
      } else {
        subTransition(d, o, so, 'return_approved', 'staff', note)
        returnMachine.assert(r.status, 'refunded'); r.status = 'refunded'
        subTransition(d, o, so, 'refunded', 'staff')
        o.payment.escrow = kind === 'full' ? 'refunded' : 'partially_refunded'
        d.transactions.unshift({ id: genId('TX'), kind: 'refund', provider: o.payment.method, amountTiyin: amountTiyin, at: now(), refId: o.id, status: 'ok', note: `Qaytarish ${r.id}` })
        pushNotification(d, o.buyerId, 'payment', 'Pul qaytarildi', `${formatMoney(amountTiyin)} kartangizga qaytarildi`, `/m/orders/${o.id}`)
      }
      return r
    })
  },
  async sellerReply(returnId: string, text: string) {
    return mutate((d) => { const r = d.returns.find((x) => x.id === returnId)!; r.sellerReply = text; return r })
  },

  /** Admin: manual sub-order status change (only allowed transitions) */
  async setSubStatus(orderId: string, subOrderId: string, to: SubOrderStatus, note?: string) {
    return mutate((d) => {
      const o = d.orders.find((x) => x.id === orderId)!
      const so = o.subOrders.find((x) => x.id === subOrderId)!
      subTransition(d, o, so, to, 'staff', note)
      return so
    })
  },
  async cancel(orderId: string, reason: string) {
    return mutate((d) => {
      const o = d.orders.find((x) => x.id === orderId)!
      orderMachine.assert(o.status, 'cancelled'); o.status = 'cancelled'
      for (const so of o.subOrders) if (subOrderMachine.can(so.status, 'cancelled')) subTransition(d, o, so, 'cancelled', 'staff', reason)
      if (o.payment.escrow === 'held') { o.payment.escrow = 'refunded'; d.transactions.unshift({ id: genId('TX'), kind: 'refund', provider: o.payment.method, amountTiyin: o.totalTiyin, at: now(), refId: o.id, status: 'ok', note: `Bekor: ${reason}` }) }
      audit(d, currentActor('staff'), 'status', 'order', o.id, 'status', 'paid', 'cancelled', reason)
      return o
    })
  },
}
