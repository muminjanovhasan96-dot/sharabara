/**
 * Oltin yo'l — API orqali boshidan oxirigacha (UI'siz).
 * Raqamlar qulflangan: 6 200 000 / 186 000 / 6 014 000 / 6 235 000.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { api, setFastMode } from './index'
import { useStore } from '@/store'
import { GOLDEN } from '@/seed'

const d = () => useStore.getState().data
const golden = () => d().listings.find((l) => l.id === GOLDEN.listingId)!

describe('Oltin yo’l (API)', () => {
  beforeAll(() => { setFastMode(true); useStore.getState().reset(2026) })

  it('seed: golden listing draft holatida, xaridor iPhone ko’rgan', () => {
    const l = golden()
    expect(l.status).toBe('draft')
    expect(l.askingTiyin).toBe(GOLDEN.asking)
    expect(d().events.some((e) => e.userId === GOLDEN.buyerId && e.kind === 'view_long')).toBe(true)
  })

  it('sotuvchi yuboradi → AI tekshiradi → tekshiruvda', async () => {
    useStore.getState().setSession({ userId: GOLDEN.sellerId, role: 'seller' })
    const l = golden()
    await api.listings.submit({ id: l.id, categoryId: l.categoryId, title: l.title, description: l.description, images: l.images, regionId: l.regionId, condition: l.condition, askingTiyin: l.askingTiyin, imei: l.imei, attributes: l.attributes })
    expect(golden().status).toBe('submitted')
    const { suggestion } = await api.listings.aiCheck(l.id)
    expect(golden().status).toBe('in_review')
    expect(suggestion.suggestedTiyin).toBe(GOLDEN.suggested)
    expect(suggestion.marketMedianTiyin).toBe(GOLDEN.marketMedian)
    expect(suggestion.confidence).toBeGreaterThanOrEqual(0.85)
    expect(suggestion.confidence).toBeLessThanOrEqual(0.89)
    const sum = suggestion.breakdown.filter((r) => r.kind !== 'total').reduce((a, r) => a + r.amountTiyin, 0)
    expect(sum).toBe(GOLDEN.suggested)
  })

  it('narx tahlilchisi taklif yuboradi → push sotuvchiga', async () => {
    useStore.getState().setSession({ staffId: 's-price', role: 'price_analyst' })
    const before = d().notifications.filter((n) => n.userId === GOLDEN.sellerId).length
    const l = await api.listings.sendOffer(GOLDEN.listingId, GOLDEN.suggested, 'O’xshashlar o’rtachasi bo’yicha')
    expect(l.status).toBe('offer_sent')
    expect(l.offer?.feeTiyin).toBe(GOLDEN.fee)
    expect(l.offer?.sellerGetsTiyin).toBe(GOLDEN.sellerGets)
    expect(d().notifications.filter((n) => n.userId === GOLDEN.sellerId).length).toBe(before + 1)
    expect(d().audit[0].kind).toBe('status')
  })

  it('sotuvchi rozi → e’lon chiqadi, xaridorga push', async () => {
    useStore.getState().setSession({ userId: GOLDEN.sellerId, role: 'seller' })
    const before = d().notifications.filter((n) => n.userId === GOLDEN.buyerId).length
    const l = await api.listings.acceptOffer(GOLDEN.listingId)
    expect(l.status).toBe('published')
    expect(l.priceVerified).toBe(true)
    expect(l.priceTiyin).toBe(GOLDEN.suggested)
    expect(d().notifications.filter((n) => n.userId === GOLDEN.buyerId).length).toBeGreaterThan(before)
  })

  let orderId = ''
  let subId = ''
  it('xaridor savat → rasmiylashtirish: jami 6 235 000', async () => {
    useStore.getState().setSession({ userId: GOLDEN.buyerId, role: 'buyer' })
    const l = golden()
    await api.orders.addToCart({ source: 'listing', refId: l.id, sellerKey: `u:${l.sellerId}`, priceTiyin: l.priceTiyin, title: l.title, image: l.images[0] })
    const o = await api.orders.checkout({ delivery: 'bts_branch', branchId: GOLDEN.branchId, payment: 'payme' })
    orderId = o.id; subId = o.subOrders[0].id
    expect(o.totalTiyin).toBe(GOLDEN.total)
    expect(o.status).toBe('paid')
    expect(o.payment.escrow).toBe('held')
    expect(o.subOrders).toHaveLength(1)
    expect(o.subOrders[0].feeTiyin).toBe(GOLDEN.fee)
    expect(golden().status).toBe('reserved')
    expect(useStore.getState().ui.cart).toHaveLength(0)
    expect(d().feeApprovals[0].status).toBe('pending')
  })

  it('logistika: qadoqlandi → 17:00 → BTS keldi', async () => {
    useStore.getState().setSession({ staffId: 's-log', role: 'logistics' })
    const so = await api.logistics.pack(subId)
    expect(so.status).toBe('packed')
    expect(so.waybill).toMatch(/^BTS-/)
    await api.demo.to17()
    expect(new Date(useStore.getState().clock.now).getHours()).toBe(17)
    const m = d().manifests.find((x) => x.subOrderIds.includes(subId))!
    expect(m.status).toBe('closed')
    await api.demo.btsArrived()
    expect(d().orders.find((o) => o.id === orderId)!.subOrders[0].status).toBe('handed_to_bts')
  })

  it('BTS: qabul qildi → +1 kun filialda → topshirildi', async () => {
    const m = d().manifests.find((x) => x.subOrderIds.includes(subId))!
    await api.logistics.btsAcceptManifest(m.id)
    const sub = () => d().orders.find((o) => o.id === orderId)!.subOrders[0]
    expect(sub().status).toBe('in_transit')
    expect(d().manifests.find((x) => x.id === m.id)!.status).toBe('picked_up')
    await api.demo.plusDay()
    expect(sub().status).toBe('at_branch')
    await api.logistics.btsDelivered(subId)
    expect(sub().status).toBe('payout_scheduled')
    expect(golden().status).toBe('sold')
    const p = d().payouts.find((x) => x.subOrderIds.includes(subId))!
    expect(p.amountTiyin).toBe(GOLDEN.sellerGets)
    expect(d().notifications.some((n) => n.userId === GOLDEN.buyerId && n.kind === 'rate_request')).toBe(true)
  })

  it('moliya: juma to’lovi → sotuvchiga 6 014 000 to’landi', async () => {
    useStore.getState().setSession({ staffId: 's-fin', role: 'finance' })
    await api.demo.payday()
    expect(new Date(useStore.getState().clock.now).getDay()).toBe(5)
    const p = d().payouts.find((x) => x.subOrderIds.includes(subId))!
    expect(p.status).toBe('paid')
    expect(d().orders.find((o) => o.id === orderId)!.subOrders[0].status).toBe('payout_paid')
    expect(d().notifications.some((n) => n.userId === GOLDEN.sellerId && n.kind === 'payout')).toBe(true)
  })

  it('audit: shu savdoning butun izi bor', () => {
    const trail = d().audit.filter((a) => a.entityId === GOLDEN.listingId || a.entityId === orderId || a.entityId === subId)
    const statuses = trail.filter((a) => a.field === 'status').map((a) => a.to)
    for (const s of ['submitted', 'in_review', 'offer_sent', 'published', 'reserved', 'packed', 'handed_to_bts', 'in_transit', 'at_branch', 'delivered', 'payout_paid', 'sold']) expect(statuses).toContain(s)
  })

  it('noto’g’ri o’tish xato beradi', async () => {
    await expect(api.listings.acceptOffer(GOLDEN.listingId)).rejects.toThrow()
  })
})
