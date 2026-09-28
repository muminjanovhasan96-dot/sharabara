import type { AppNotification, Campaign, ChatThread, ISODate, Listing, Order, Product, SavedSearch, User, UserEvent } from '../domain/types'
import { addDays, addHours, addMinutes, setHour } from '../domain/clock'
import { modelOf } from '../domain/pricing'
import type { Rng } from './rng'
import { GOLDEN } from './golden'
import { CHAT_LINES } from './static'

const S = 100

export function makeEvents(r: Rng, now: ISODate, users: User[], listings: Listing[], products: Product[]): UserEvent[] {
  const events: UserEvent[] = []
  const published = listings.filter((l) => l.status === 'published' && !l.historical)
  const iphones = published.filter((l) => modelOf(l) === 'iPhone 13')
  const yesterday = setHour(addDays(now, -1), 19, 10)

  // Golden buyer: yesterday viewed 3 iPhone 13 listings, searched, saved one
  iphones.slice(0, 3).forEach((l, i) => {
    events.push({ userId: GOLDEN.buyerId, kind: 'view_long', at: addMinutes(yesterday, i * 6), itemId: l.id, source: 'listing', categoryId: l.categoryId, model: 'iPhone 13', priceTiyin: l.priceTiyin, regionId: l.regionId })
  })
  events.push({ userId: GOLDEN.buyerId, kind: 'search', at: addMinutes(yesterday, -3), query: 'iphone 13' })
  if (iphones[1]) events.push({ userId: GOLDEN.buyerId, kind: 'save', at: addMinutes(yesterday, 20), itemId: iphones[1].id, source: 'listing', categoryId: 'telefonlar', model: 'iPhone 13', priceTiyin: iphones[1].priceTiyin })
  // ...va bir MacBook Air M1 ni saqlagan — lentada «Siz MacBook Air M1 saqlagansiz» sababi 2 qatorda ko'rinadi
  const macs = listings.filter((l) => l.status === 'published' && !l.historical && /MacBook Air M1/.test(l.title)).slice(0, 2)
  macs.forEach((mac, i) => events.push({ userId: GOLDEN.buyerId, kind: 'save', at: addMinutes(yesterday, 35 + i * 4), itemId: mac.id, source: 'listing', categoryId: 'noutbuklar', model: 'MacBook Air M1', priceTiyin: mac.priceTiyin }))
  const tv = published.find((l) => l.categoryId === 'televizorlar')
  if (tv) events.push({ userId: GOLDEN.buyerId, kind: 'view', at: addDays(now, -9), itemId: tv.id, source: 'listing', categoryId: 'televizorlar', priceTiyin: tv.priceTiyin })

  // Background traffic from other users (drives "popular")
  const others = users.filter((u) => u.id !== GOLDEN.buyerId)
  for (let i = 0; i < 260; i++) {
    const u = r.pick(others)
    const useProduct = r.chance(0.3)
    const at = setHour(addDays(now, -r.int(0, 13)), r.int(7, 23), r.int(0, 59))
    if (useProduct) {
      const p = r.pick(products)
      events.push({ userId: u.id, kind: r.chance(0.8) ? 'view' : 'cart', at, itemId: p.id, source: 'product', categoryId: p.categoryId, priceTiyin: p.priceTiyin })
    } else {
      // bias toward the first listings so a few become "popular"
      const l = r.chance(0.4) ? published[r.int(0, Math.min(9, published.length - 1))] : r.pick(published)
      const kind = r.chance(0.7) ? 'view' : r.chance(0.6) ? 'view_long' : r.chance(0.5) ? 'save' : 'chat'
      events.push({ userId: u.id, kind, at, itemId: l.id, source: 'listing', categoryId: l.categoryId, priceTiyin: l.priceTiyin, regionId: l.regionId })
    }
  }
  return events
}

export function makeSavedSearches(now: ISODate): SavedSearch[] {
  return [
    { id: 'ss-1', userId: GOLDEN.buyerId, query: 'iphone 13 pro', categoryId: 'telefonlar', maxPriceTiyin: 7_000_000 * S, createdAt: addDays(now, -5) },
    { id: 'ss-2', userId: 'u-003', query: 'macbook air m2', categoryId: 'noutbuklar', createdAt: addDays(now, -12), lastMatchAt: addDays(now, -2) },
    { id: 'ss-3', userId: 'u-007', query: 'divan', categoryId: 'mebel', maxPriceTiyin: 2_500_000 * S, createdAt: addDays(now, -20) },
    { id: 'ss-4', userId: 'u-011', query: 'velosiped', createdAt: addDays(now, -3) },
  ]
}

export function makeChats(r: Rng, now: ISODate, users: User[], listings: Listing[]): ChatThread[] {
  const published = listings.filter((l) => l.status === 'published' && !l.historical)
  const iphone = published.find((l) => modelOf(l) === 'iPhone 13' && l.sellerId !== GOLDEN.buyerId) ?? published[0]
  const threads: ChatThread[] = []
  let mid = 0
  const msg = (from: string, text: string, at: ISODate, read = true) => { mid += 1; return { id: `msg-${mid}`, from, text, at, read } }

  const start = setHour(addDays(now, -1), 19, 24)
  const golden: ChatThread = {
    id: 'ch-1', listingId: iphone.id, buyerId: GOLDEN.buyerId, sellerId: iphone.sellerId,
    messages: CHAT_LINES.map((t, i) => msg(i % 2 === 0 ? GOLDEN.buyerId : iphone.sellerId, t, addMinutes(start, i * 4), i < CHAT_LINES.length - 1)),
    updatedAt: addMinutes(start, (CHAT_LINES.length - 1) * 4),
  }
  threads.push(golden)

  const buyers = users.filter((u) => !u.blocked && u.id !== GOLDEN.buyerId)
  const shortLines = [
    ['Salom, hali bormi?', 'Ha, bor.', "Ertaga ko'rsam bo'ladimi?", "Bo'ladi, BTS orqali ham yuboraman."],
    ['Kafolat bormi?', "Sharabara tekshiruvidan o'tgan, IMEI toza.", 'Rahmat!'],
    ['Narx oxirgimi?', 'Ha, narx tekshirilgan.', "Yaxshi, savatga qo'shdim."],
    ["Qaysi filialdan olsam bo'ladi?", 'Istalgan BTS filialidan, 2–3 kun.'],
    ['Rasm yuborasizmi yana?', "E'londa 4 ta rasm bor, qo'shimcha yuboraman.", 'Kutaman.'],
  ]
  for (let i = 0; i < 5; i++) {
    const l = published[(i * 7 + 3) % published.length]
    const buyer = r.pick(buyers.filter((u) => u.id !== l.sellerId))
    const s = setHour(addDays(now, -r.int(0, 6)), r.int(9, 21), r.int(0, 59))
    const lines = shortLines[i]
    threads.push({
      id: `ch-${i + 2}`, listingId: l.id, buyerId: buyer.id, sellerId: l.sellerId,
      messages: lines.map((t, j) => msg(j % 2 === 0 ? buyer.id : l.sellerId, t, addMinutes(s, j * 3), j < lines.length - 1 || r.chance(0.5))),
      updatedAt: addMinutes(s, (lines.length - 1) * 3),
    })
  }
  return threads
}

export function makeNotifications(now: ISODate, orders: Order[], listings: Listing[]): AppNotification[] {
  const buyerOrders = orders.filter((o) => o.buyerId === GOLDEN.buyerId)
  const iphone = listings.find((l) => l.status === 'published' && !l.historical && modelOf(l) === 'iPhone 13')
  const sellerListing = listings.find((l) => l.sellerId === GOLDEN.sellerId && l.status === 'published') ?? listings.find((l) => l.status === 'published')!
  const out: AppNotification[] = []
  let n = 0
  const add = (userId: string, kind: AppNotification['kind'], title: string, body: string, at: ISODate, read: boolean, link?: string) => {
    n += 1
    out.push({ id: `N-${String(n).padStart(3, '0')}`, userId, kind, title, body, at, read, ...(link ? { link } : {}) })
  }
  const atBranch = buyerOrders.find((o) => o.subOrders[0].status === 'at_branch')
  const inTransit = buyerOrders.find((o) => o.subOrders[0].status === 'in_transit')
  add(GOLDEN.buyerId, 'order_status', 'Buyurtma filialga keldi', `Buyurtma ${atBranch?.id ?? ''} BTS Namangan Markaz filialida. Olib ketish uchun SMS-kodni ko'rsating.`, addHours(now, -4), false, atBranch ? `/m/orders/${atBranch.id}` : undefined)
  add(GOLDEN.buyerId, 'order_status', "Buyurtma yo'lda", `Buyurtma ${inTransit?.id ?? ''} BTS orqali Namanganga yo'l oldi.`, addDays(now, -1), true, inTransit ? `/m/orders/${inTransit.id}` : undefined)
  add(GOLDEN.buyerId, 'price_drop', 'Narx tushdi', `${iphone?.title ?? 'iPhone 13'} — sotuvchi narxni pasaytirdi.`, addHours(now, -26), true, iphone ? `/m/listing/${iphone.id}` : undefined)
  add(GOLDEN.buyerId, 'saved_search', 'Saqlangan qidiruv: iphone 13 pro', "Sizning qidiruvingizga mos 2 ta yangi e'lon bor.", addHours(now, -30), true, '/m/search?q=iphone%2013%20pro')
  add(GOLDEN.buyerId, 'chat', 'Yangi xabar', 'Sotuvchi: «Rahmat, kutaman!»', addHours(now, -19), false, '/m/chat/ch-1')
  add(GOLDEN.buyerId, 'campaign', 'Payshanba — telefonlar kuni', "Mall bo'limida smartfonlarga 10% gacha chegirma.", addDays(now, -3), true, '/m/mall')

  add(GOLDEN.sellerId, 'listing_status', "E'lon nashr etildi", `«${sellerListing.title.slice(0, 40)}» e'loni bozorga chiqdi.`, addDays(now, -2), true, `/m/listing/${sellerListing.id}`)
  add(GOLDEN.sellerId, 'payout', "To'lov rejalashtirildi", "Juma kuni kartangizga 1 240 000 so'm o'tkaziladi.", addDays(now, -1), false, '/m/profile/payouts')
  add(GOLDEN.sellerId, 'chat', 'Yangi xabar', "Xaridor: «Narxni ozgina tushirsangiz bo'ladimi?»", addHours(now, -20), true, '/m/chat/ch-2')
  add(GOLDEN.sellerId, 'rate_request', 'Xaridorni baholang', "Oxirgi savdo bo'yicha xaridorni 5 yulduzgacha baholang.", addDays(now, -4), true)
  return out
}

export function makeCampaigns(now: ISODate): Campaign[] {
  return [
    {
      id: 'cmp-1', title: 'Payshanba — telefonlar kuni', body: "Mall bo'limida smartfonlarga 10% gacha chegirma. Faqat bugun!",
      segment: { regionIds: ['toshkent_sh', 'namangan', 'andijon', 'fargona'], categoryIds: ['telefonlar'] }, kind: 'push', status: 'sent',
      sentAt: setHour(addDays(now, -3), 10, 0), reach: 12_480, createdAt: addDays(now, -4),
    },
    {
      id: 'cmp-2', title: 'Maktabga tayyorgarlik', body: 'Noutbuklar va bolalar tovarlariga aksiya — Sharabara Mall.',
      segment: { regionIds: [], categoryIds: ['noutbuklar', 'bolalar'] }, kind: 'banner', status: 'sent',
      sentAt: setHour(addDays(now, -12), 9, 0), reach: 31_200, createdAt: addDays(now, -14),
    },
    {
      id: 'cmp-3', title: 'Kuzgi mebel yarmarkasi', body: 'Baraka Mebel bilan divan va kreslolarga 15% chegirma.',
      segment: { regionIds: ['toshkent_sh', 'toshkent_v', 'samarqand'], categoryIds: ['mebel'] }, kind: 'push', status: 'draft', createdAt: addDays(now, -1),
    },
  ]
}
