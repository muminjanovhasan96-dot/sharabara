import type {
  BtsBranch, CartItem, Company, DeliveryMethod, FeeApproval, FeeRuleSet, ISODate, Listing, Manifest, Order, Payout,
  PaymentMethod, Product, ReturnRequest, StatusEvent, SubOrder, SubOrderStatus, Transaction, User,
} from '../domain/types'
import { addDays, addHours, dateKey, nextFriday, setHour, daysBetween } from '../domain/clock'
import { calcFee, defaultFeeRules } from '../domain/fees'
import { mulRate } from '../domain/money'
import { SUB_ORDER_HAPPY_PATH } from '../domain/machines/order'
import { needsSecondApproval } from '../domain/machines/payout'
import type { Rng } from './rng'
import { GOLDEN } from './golden'
import { RETURN_REASONS } from './static'

const S = 100
export const DELIVERY_FEE: Record<DeliveryMethod, number> = { bts_branch: 35_000 * S, courier_tashkent: 25_000 * S, pickup: 0 }

export function makeFeeRuleSets(now: ISODate): FeeRuleSet[] {
  const v1: FeeRuleSet = {
    id: 'frs-1', version: 1, status: 'published', rules: defaultFeeRules(), publishedAt: addDays(now, -120), createdBy: 's-fin',
    note: "Boshlang'ich komissiya jadvali",
  }
  const v2: FeeRuleSet = {
    id: 'frs-2', version: 2, status: 'draft', createdBy: 's-fin', note: "Kiyim uchun alohida 8% va o'rta pog'ona 3,5%",
    rules: [
      ...defaultFeeRules().map((rule) => (rule.id === 'fr-3' ? { ...rule, rate: 0.035 } : rule)),
      { id: 'fr-kiyim', minTiyin: 0, maxTiyin: null, type: 'percent', rate: 0.08, categoryId: 'kiyim' },
    ],
  }
  return [v1, v2]
}

interface OrderSpec {
  id: string
  buyer: User
  createdAt: ISODate
  items: CartItem[]
  sellerKey: string
  sellerName: string
  categoryId: string
  commissionRate: number | null // null → C2C fee rules
  finalStatus: SubOrderStatus
  delivery: DeliveryMethod
  branch?: BtsBranch
  payment: PaymentMethod
  cancelled?: boolean
}

let waybillSeq = 48_000

function waybill(r: Rng | null, at: ISODate): string {
  const d = new Date(at)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  waybillSeq += r ? r.int(1, 9) : 7
  return `BTS-${dd}${mm}-${waybillSeq}`
}

export function buildOrder(r: Rng, spec: OrderSpec, ruleSet: FeeRuleSet): Order {
  const subtotal = spec.items.reduce((a, it) => a + it.priceTiyin * it.qty, 0)
  const fee = spec.commissionRate === null ? calcFee(subtotal, spec.categoryId, ruleSet).feeTiyin : mulRate(subtotal, spec.commissionRate)
  const paidAt = addHours(spec.createdAt, 0)
  const path = SUB_ORDER_HAPPY_PATH
  const idx = path.indexOf(spec.finalStatus)
  const timeline: StatusEvent<SubOrderStatus>[] = []
  let t = paidAt
  let handedAt: ISODate | undefined
  const sellerActor = spec.sellerKey.startsWith('c:') ? { by: spec.sellerKey.slice(2), role: 'company' as const } : { by: spec.sellerKey.slice(2), role: 'seller' as const }
  for (let i = 0; i <= idx; i++) {
    const st = path[i]
    switch (st) {
      case 'packing': t = paidAt; timeline.push({ status: st, at: t, by: 'system', role: 'buyer', note: "To'lov qabul qilindi" }); break
      case 'packed': t = addHours(t, r.int(2, 8)); timeline.push({ status: st, at: t, ...sellerActor }); break
      case 'handed_to_bts': t = setHour(addDays(t, 1), 17, r.int(0, 45)); handedAt = t; timeline.push({ status: st, at: t, by: 'bts-kuryer', role: 'bts', note: "Manifest bo'yicha qabul qilindi" }); break
      case 'in_transit': t = addHours(t, r.int(2, 5)); timeline.push({ status: st, at: t, by: 'bts-hub', role: 'bts' }); break
      case 'at_branch': t = setHour(addDays(t, r.int(1, 2)), r.int(9, 12), r.int(0, 59)); timeline.push({ status: st, at: t, by: spec.branch?.id ?? 'bts-hub', role: 'bts', note: spec.branch ? `${spec.branch.name} filialiga keldi` : undefined }); break
      case 'delivered': t = addHours(t, r.int(3, 30)); timeline.push({ status: st, at: t, by: spec.branch?.id ?? 'bts-kuryer', role: 'bts', note: 'Xaridor SMS-kod bilan oldi' }); break
      case 'payout_scheduled': t = addHours(t, 1); timeline.push({ status: st, at: t, by: 'system', role: 'finance', note: `Juma kuni to'lanadi: ${dateKey(nextFriday(t))}` }); break
      case 'payout_paid': t = setHour(nextFriday(t), 12, 0); timeline.push({ status: st, at: t, by: 's-fin', role: 'finance' }); break
      default: break
    }
  }
  if (spec.cancelled) {
    t = addHours(t, r.int(1, 5))
    timeline.push({ status: 'cancelled', at: t, by: spec.buyer.id, role: 'buyer', note: 'Xaridor bekor qildi' })
  }
  const status: SubOrderStatus = spec.cancelled ? 'cancelled' : spec.finalStatus
  const sub: SubOrder = {
    id: `${spec.id}-1`, orderId: spec.id, sellerKey: spec.sellerKey, sellerName: spec.sellerName, items: spec.items,
    subtotalTiyin: subtotal, feeTiyin: fee, status, timeline,
  }
  const packedAt = timeline.find((e) => e.status === 'packed')?.at
  if (handedAt) sub.waybill = waybill(r, handedAt)
  else if (packedAt) sub.waybill = waybill(null, packedAt) // rng'siz: tasodifiy oqim o'zgarmasin
  if (spec.branch) sub.branchId = spec.branch.id
  const finished = idx >= path.indexOf('delivered')
  const escrow = spec.cancelled ? 'refunded' : status === 'payout_paid' ? 'released' : 'held'
  const deliveryFee = DELIVERY_FEE[spec.delivery]
  const order: Order = {
    channel: 'app', id: spec.id, buyerId: spec.buyer.id, createdAt: spec.createdAt,
    status: spec.cancelled ? 'cancelled' : finished ? 'completed' : 'paid',
    payment: { method: spec.payment, txId: `${spec.payment.toUpperCase()}-${spec.id.slice(2)}`, paidAt, escrow },
    delivery: { method: spec.delivery, feeTiyin: deliveryFee, ...(spec.branch ? { branchId: spec.branch.id } : {}), ...(spec.delivery === 'courier_tashkent' ? { address: 'Toshkent, Yunusobod 4-kvartal, 12-uy' } : {}) },
    subOrders: [sub], itemsTiyin: subtotal, totalTiyin: subtotal + deliveryFee,
  }
  if (finished && !spec.cancelled && r.chance(0.6)) {
    order.rating = { stars: r.int(4, 5), comment: r.pick(['Tez yetkazildi, rahmat!', 'Tavsifga mos, hammasi joyida.', "Sotuvchi bilan muloqot yaxshi bo'ldi.", 'Narx haqiqatan ham bozordan arzon.']), at: addHours(timeline.at(-1)!.at, 5) }
  }
  return order
}

export interface CommerceOut {
  orders: Order[]
  manifests: Manifest[]
  payouts: Payout[]
  transactions: Transaction[]
  returns: ReturnRequest[]
  feeApprovals: FeeApproval[]
}

function listingItem(l: Listing): CartItem {
  return { key: `listing:${l.id}`, source: 'listing', refId: l.id, sellerKey: `u:${l.sellerId}`, qty: 1, priceTiyin: l.priceTiyin, title: l.title, image: l.images[0] }
}
function productItem(p: Product, qty: number): CartItem {
  return { key: `product:${p.id}`, source: 'product', refId: p.id, sellerKey: `c:${p.companyId}`, qty, priceTiyin: p.priceTiyin, title: p.title, image: p.images[0] }
}

export function makeCommerce(
  r: Rng, now: ISODate, users: User[], listings: Listing[], products: Product[], companies: Company[], branches: BtsBranch[], ruleSet: FeeRuleSet,
): CommerceOut {
  waybillSeq = 48_000
  const buyers = users.filter((u) => !u.blocked && u.id !== GOLDEN.sellerId)
  const userById = new Map(users.map((u) => [u.id, u]))
  const companyById = new Map(companies.map((c) => [c.id, c]))
  const branchByRegion = (regionId: string) => branches.filter((b) => b.regionId === regionId)
  const namanganMarkaz = branches.find((b) => b.id === GOLDEN.branchId)!
  const soldListings = listings.filter((l) => l.status === 'sold' && !l.historical)
  const reservedListings = listings.filter((l) => l.status === 'reserved')
  const stocked = products.filter((p) => p.stock > 0)
  const orders: Order[] = []
  let seq = 4100

  const nextId = () => { seq += r.int(1, 4); return `O-${seq}` }
  const pickBranch = (u: User) => { const bs = branchByRegion(u.regionId); return bs.length ? r.pick(bs) : r.pick(branches) }
  const payment = () => r.pick<PaymentMethod>(['payme', 'payme', 'click', 'click', 'cash'])

  const specFor = (buyer: User, createdAt: ISODate, item: CartItem, finalStatus: SubOrderStatus, branch?: BtsBranch, cancelled = false): OrderSpec => {
    const isProduct = item.source === 'product'
    const company = isProduct ? companyById.get(item.sellerKey.slice(2))! : null
    const seller = !isProduct ? userById.get(item.sellerKey.slice(2))! : null
    const categoryId = isProduct ? products.find((p) => p.id === item.refId)!.categoryId : listings.find((l) => l.id === item.refId)!.categoryId
    const delivery: DeliveryMethod = branch ? 'bts_branch' : buyer.regionId === 'toshkent_sh' && r.chance(0.5) ? 'courier_tashkent' : 'pickup'
    return {
      id: nextId(), buyer, createdAt, items: [item], sellerKey: item.sellerKey,
      sellerName: company ? company.name : seller!.name, categoryId,
      commissionRate: company ? company.commissionRate : null, finalStatus, delivery, branch, payment: payment(), cancelled,
    }
  }

  // ── 30-day history: 20 listing orders + 100 product orders
  for (let i = 0; i < 120; i++) {
    const buyer = r.pick(buyers)
    const daysAgo = r.int(4, 30)
    const createdAt = setHour(addDays(now, -daysAgo), r.int(8, 22), r.int(0, 59))
    const item = i < soldListings.length ? listingItem(soldListings[i]) : productItem(r.pick(stocked), r.chance(0.2) ? 2 : 1)
    if (i < soldListings.length) {
      const l = soldListings[i]
      // keep the listing's soldAt consistent with the order
      l.soldAt = addHours(createdAt, 1)
    }
    const finalStatus: SubOrderStatus = daysAgo >= 9 ? 'payout_paid' : daysAgo >= 6 ? 'payout_scheduled' : 'delivered'
    const cancelled = i % 29 === 7
    const branch = r.chance(0.85) ? pickBranch(buyer) : undefined
    orders.push(buildOrder(r, specFor(buyer, createdAt, item, cancelled ? 'packed' : finalStatus, branch, cancelled), ruleSet))
  }

  // ── active orders (20), including the golden buyer's three
  const buyer = userById.get(GOLDEN.buyerId)!
  const namunaProducts = stocked.filter((p) => p.companyId === 'c-namuna')
  orders.push(buildOrder(r, specFor(buyer, setHour(addDays(now, -6), 11, 20), productItem(namunaProducts[3], 1), 'delivered', namanganMarkaz), ruleSet))
  orders.push(buildOrder(r, specFor(buyer, setHour(addDays(now, -2), 9, 5), productItem(namunaProducts[7], 1), 'in_transit', namanganMarkaz), ruleSet))
  orders.push(buildOrder(r, specFor(buyer, setHour(addDays(now, -3), 18, 40), productItem(namunaProducts[11], 1), 'at_branch', namanganMarkaz), ruleSet))

  const activePlan: [SubOrderStatus, number][] = [['packing', 4], ['packed', 4], ['handed_to_bts', 3], ['in_transit', 3], ['at_branch', 2], ['delivered', 1]]
  let reservedIdx = 0
  for (const [st, count] of activePlan) {
    for (let k = 0; k < count; k++) {
      const b = r.pick(buyers.filter((u) => u.id !== GOLDEN.buyerId))
      const daysAgo = st === 'packing' || st === 'packed' ? 0 : st === 'handed_to_bts' ? 1 : r.int(2, 4)
      const createdAt = setHour(addDays(now, -daysAgo), st === 'packed' ? r.int(6, 9) : r.int(8, 13), r.int(0, 59))
      const useListing = (st === 'packing' || st === 'packed') && reservedIdx < reservedListings.length
      const item = useListing ? listingItem(reservedListings[reservedIdx++]) : productItem(r.pick(stocked), 1)
      orders.push(buildOrder(r, specFor(b, createdAt, item, st, pickBranch(b)), ruleSet))
    }
  }

  const allSubs = orders.flatMap((o) => o.subOrders)

  // ── returns: 4 requested on delivered historical sub-orders
  const returns: ReturnRequest[] = []
  const deliveredSubs = allSubs.filter((s) => s.status === 'delivered' && s.orderId !== orders[120].id)
  for (let i = 0; i < 4 && i < deliveredSubs.length; i++) {
    const sub = deliveredSubs[i]
    const order = orders.find((o) => o.id === sub.orderId)!
    sub.status = 'return_requested'
    const at = addHours(sub.timeline.at(-1)!.at, r.int(3, 20))
    sub.timeline.push({ status: 'return_requested', at, by: order.buyerId, role: 'buyer' })
    sub.problem = RETURN_REASONS[i % RETURN_REASONS.length]
    returns.push({
      id: `R-${String(i + 1).padStart(3, '0')}`, orderId: order.id, subOrderId: sub.id, buyerId: order.buyerId,
      reason: RETURN_REASONS[i % RETURN_REASONS.length],
      description: r.pick(["Qutini ochganda ekranda dog' bor edi.", 'Rasmda boshqa rang, kelgani boshqa.', "Yoqilganda o'chib qoladi, video bor.", 'Qadoq yirtilgan, korpusda yoriq.']),
      images: [`ill-return-${i + 1}`], status: 'requested', createdAt: at, slaHours: 48,
      ...(i % 2 ? { sellerReply: 'Yuborishdan oldin tekshirganmiz, video bor.' } : {}),
    })
  }

  // ── manifests: one per day for handed_to_bts events (picked_up), plus today's open one
  const byDay = new Map<string, SubOrder[]>()
  for (const s of allSubs) {
    const handed = s.timeline.find((e) => e.status === 'handed_to_bts')
    if (!handed) continue
    // BTS picks up in the evening, so anything already handed over "today" belongs to yesterday's batch
    const todayK = dateKey(now)
    const key = dateKey(handed.at) === todayK ? dateKey(addDays(now, -1)) : dateKey(handed.at)
    if (daysBetween(handed.at, now) > 7) continue
    byDay.set(key, [...(byDay.get(key) ?? []), s])
  }
  const regionOf = (s: SubOrder) => branches.find((b) => b.id === s.branchId)?.regionId ?? 'toshkent_sh'
  const manifests: Manifest[] = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, subs]) => {
    const byRegion: Record<string, number> = {}
    for (const s of subs) byRegion[regionOf(s)] = (byRegion[regionOf(s)] ?? 0) + 1
    const id = `M-${date.replace(/-/g, '')}`
    for (const s of subs) s.manifestId = id
    return { id, date, status: 'picked_up' as const, subOrderIds: subs.map((s) => s.id), closedAt: `${date}T17:00:00`, pickedUpAt: `${date}T17:${String(20 + subs.length).padStart(2, '0')}:00`, byRegion }
  })
  const yesterdayKey = dateKey(addDays(now, -1))
  if (!manifests.some((m) => m.date === yesterdayKey)) {
    manifests.push({ id: `M-${yesterdayKey.replace(/-/g, '')}`, date: yesterdayKey, status: 'picked_up', subOrderIds: [], closedAt: `${yesterdayKey}T17:00:00`, pickedUpAt: `${yesterdayKey}T17:25:00`, byRegion: {} })
  }
  const todayKey = dateKey(now)
  const packedToday = allSubs.filter((s) => s.status === 'packed' && dateKey(s.timeline.at(-1)!.at) === todayKey)
  const todayByRegion: Record<string, number> = {}
  for (const s of packedToday) todayByRegion[regionOf(s)] = (todayByRegion[regionOf(s)] ?? 0) + 1
  const todayId = `M-${todayKey.replace(/-/g, '')}`
  for (const s of packedToday) s.manifestId = todayId
  manifests.push({ id: todayId, date: todayKey, status: 'open', subOrderIds: packedToday.map((s) => s.id), byRegion: todayByRegion })

  // ── payouts (8)
  const payouts: Payout[] = []
  const paidSubs = allSubs.filter((s) => s.status === 'payout_paid')
  const scheduledSubs = allSubs.filter((s) => s.status === 'payout_scheduled')
  const deliveredOnly = allSubs.filter((s) => s.status === 'delivered')
  const groupBySeller = (subs: SubOrder[]) => {
    const m = new Map<string, SubOrder[]>()
    for (const s of subs) m.set(s.sellerKey, [...(m.get(s.sellerKey) ?? []), s])
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }
  const net = (subs: SubOrder[]) => subs.reduce((a, s) => a + s.subtotalTiyin - s.feeTiyin, 0)
  const card = () => String(r.int(1000, 9999))
  let pn = 0
  const pushPayout = (subs: SubOrder[], status: Payout['status'], extra: Partial<Payout> = {}) => {
    pn += 1
    payouts.push({ id: `PO-${String(pn).padStart(3, '0')}`, sellerKey: subs[0].sellerKey, sellerName: subs[0].sellerName, subOrderIds: subs.map((s) => s.id), amountTiyin: net(subs), status, approvals: [], cardLast4: card(), ...extra })
  }
  // big company payout awaiting second approval (aggregate every c-namuna paid sub-order)
  const namunaPaid = paidSubs.filter((s) => s.sellerKey === 'c:c-namuna')
  pushPayout(namunaPaid, 'awaiting_second_approval', { scheduledFor: dateKey(nextFriday(now)), approvals: [{ by: 's-fin', at: addHours(now, -3) }] })
  const paidGroups = groupBySeller(paidSubs.filter((s) => s.sellerKey !== 'c:c-namuna'))
  for (const [, subs] of paidGroups.slice(0, 3)) pushPayout(subs.slice(0, 4), 'paid', { paidAt: setHour(nextFriday(addDays(now, -9)), 12, 0), scheduledFor: dateKey(nextFriday(addDays(now, -9))), approvals: [{ by: 's-fin', at: setHour(addDays(now, -8), 15, 0) }] })
  for (const [, subs] of groupBySeller(scheduledSubs).slice(0, 2)) pushPayout(subs, 'scheduled', { scheduledFor: dateKey(nextFriday(now)), approvals: [{ by: 's-fin', at: addHours(now, -20) }] })
  for (const [, subs] of groupBySeller(deliveredOnly).slice(0, 2)) pushPayout(subs, 'pending')
  while (payouts.length < 8 && paidGroups.length) pushPayout(paidGroups[payouts.length % paidGroups.length][1].slice(0, 2), 'pending')

  // ── transactions (~150)
  const transactions: Transaction[] = []
  let tn = 0
  const tx = (t: Omit<Transaction, 'id'>) => { tn += 1; transactions.push({ id: `T-${String(tn).padStart(4, '0')}`, ...t }) }
  for (const o of orders) {
    tx({ kind: 'payment_in', provider: o.payment.method, amountTiyin: o.totalTiyin, at: o.payment.paidAt!, refId: o.id, status: 'ok', note: `Buyurtma ${o.id} to'lovi` })
  }
  for (const p of payouts.filter((x) => x.status === 'paid')) {
    tx({ kind: 'payout', amountTiyin: -p.amountTiyin, at: p.paidAt!, refId: p.id, status: 'ok', note: `${p.sellerName} — haftalik to'lov` })
  }
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled')
  for (const o of cancelledOrders) {
    tx({ kind: 'refund', provider: o.payment.method, amountTiyin: -o.totalTiyin, at: addHours(o.createdAt, 6), refId: o.id, status: 'ok', note: 'Bekor qilingan buyurtma qaytarildi' })
  }
  const boosted = listings.filter((l) => l.boosted)
  for (const l of boosted.slice(0, 6)) {
    const price = l.boosted!.packageId === 'boost-kun' ? 9_000 * S : l.boosted!.packageId === 'boost-hafta' ? 39_000 * S : 69_000 * S
    tx({ kind: 'boost', provider: 'payme', amountTiyin: price, at: addDays(l.boosted!.until, -(l.boosted!.packageId === 'boost-kun' ? 1 : l.boosted!.packageId === 'boost-hafta' ? 7 : 14)), refId: l.id, status: 'ok', note: `E'lonni ko'tarish: ${l.title.slice(0, 30)}` })
  }
  tx({ kind: 'payment_in', provider: 'click', amountTiyin: 245_000 * S, at: addHours(now, -2), refId: 'O-pending', status: 'pending', note: 'Click tasdiqlashni kutmoqda' })
  tx({ kind: 'payment_in', provider: 'payme', amountTiyin: 1_200_000 * S, at: addHours(now, -30), refId: 'O-failed', status: 'failed', note: "Kartada mablag' yetarli emas" })

  // ── fee approvals: 6 pending on C2C sub-orders
  const feeApprovals: FeeApproval[] = []
  const c2c = allSubs.filter((s) => s.sellerKey.startsWith('u:')).slice(0, 6)
  c2c.forEach((s, i) => {
    feeApprovals.push({
      id: `FA-${String(i + 1).padStart(3, '0')}`, subOrderId: s.id, orderId: s.orderId, sellerKey: s.sellerKey, priceTiyin: s.subtotalTiyin,
      autoFeeTiyin: s.feeTiyin, finalFeeTiyin: s.feeTiyin, status: 'pending', createdAt: addHours(s.timeline[0].at, 2),
    })
  })

  void needsSecondApproval
  return { orders, manifests, payouts, transactions, returns, feeApprovals }
}
