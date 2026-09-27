import type { Category, Condition, ISODate, Listing, ListingStatus, User } from '../domain/types'
import { MODEL_DICTIONARY, type ModelEntry } from '../domain/checks/models'
import { recognize } from '../domain/checks/recognize'
import { suggestPrice, fromA, CONDITION_K } from '../domain/pricing'
import { calcFee } from '../domain/fees'
import { addDays, addHours, setHour } from '../domain/clock'
import { mulRate, roundToStep } from '../domain/money'
import type { Rng } from './rng'
import { CATEGORY_SLUG, CONDITION_PHRASE, DISTRICTS, PHONE_COLORS, TEMPLATES } from './static'
import { GOLDEN } from './golden'
import type { FeeRuleSet } from '../domain/types'

const S = 100
const STORAGES = ['64 GB', '128 GB', '256 GB', '512 GB']

/** Status plan for the 160 catalogue listings (~45% published). */
const STATUS_PLAN: [ListingStatus, number][] = [
  ['published', 72], ['sold', 20], ['in_review', 14], ['offer_sent', 10], ['submitted', 10], ['expired', 10],
  ['reserved', 6], ['rejected_by_admin', 6], ['returned_for_edit', 6], ['ai_checked', 3], ['draft', 3],
]

export function imagesFor(categoryId: string, r: Rng, n = 3): string[] {
  const slug = CATEGORY_SLUG[categoryId] ?? 'phone'
  const start = r.int(1, 4)
  return Array.from({ length: n }, (_, i) => `ill-${slug}-${((start + i - 1) % 4) + 1}`)
}

function viewsByDay(r: Rng, total: number): number[] {
  const raw = Array.from({ length: 14 }, () => r.float(0.3, 1.7))
  const sum = raw.reduce((a, b) => a + b, 0)
  const out = raw.map((v) => Math.round((v / sum) * total))
  return out
}

function stats(r: Rng, ageDays: number) {
  const views = Math.round(r.int(8, 60) * Math.min(ageDays + 1, 14))
  return { views, saves: Math.round(views * r.float(0.02, 0.08)), chats: r.int(0, 6), viewsByDay: viewsByDay(r, views) }
}

function condPick(r: Rng): Condition {
  const x = r.next()
  return x < 0.25 ? 'A' : x < 0.7 ? 'B' : x < 0.92 ? 'C' : 'D'
}

/** Used market price for a dictionary model at a condition (so'm, rounded to 50 000). */
function usedPrice(entry: ModelEntry, cond: Condition, r: Rng): number {
  const factor = r.float(0.58, 0.74) * CONDITION_K[cond]
  return Math.round((entry.newRetailTiyin / S) * factor / 50_000) * 50_000
}

interface Draft {
  categoryId: string
  title: string
  description: string
  attributes: Record<string, string | number>
  askingSum: number
  condition: Condition
  imei?: string
}

function imeiFor(r: Rng): string {
  let s = '35'
  for (let i = 0; i < 13; i++) s += String(r.int(0, 9))
  // ~8% suspicious (ending with 0), rest clean
  if (r.chance(0.08)) return `${s.slice(0, 14)}0`
  return s.endsWith('0') ? `${s.slice(0, 14)}7` : s
}

function draftFor(categoryId: string, r: Rng, forceEntry?: ModelEntry): Draft {
  const cond = condPick(r)
  const phrase = r.pick(CONDITION_PHRASE[cond])
  if (categoryId === 'telefonlar' || categoryId === 'noutbuklar' || categoryId === 'televizorlar' || categoryId === 'maishiy') {
    const pool = MODEL_DICTIONARY.filter((m) => m.categoryId === categoryId && m.id !== 'iphone-13-pro')
    const entry = forceEntry ?? r.pick(pool)
    const price = usedPrice(entry, cond, r)
    if (categoryId === 'telefonlar') {
      const storage = r.pick(STORAGES.slice(0, 3))
      const color = r.pick(PHONE_COLORS)
      return {
        categoryId, condition: cond, askingSum: price, imei: imeiFor(r),
        title: `${entry.model}, ${storage}, ${color}, ${phrase}`,
        description: `${entry.model} ${storage}. ${cond === 'A' ? 'Deyarli ishlatilmagan.' : cond === 'B' ? 'Ekran himoyada, korpusda mayda izlar.' : 'Ishlatilgan, ish holati yaxshi.'} Batareya ${r.int(78, 99)}%. Quti va kabel bor. Namuna e'lon.`,
        attributes: { model: entry.model, xotira: storage, rang: color, batareya: r.int(78, 99) },
      }
    }
    if (categoryId === 'noutbuklar') {
      const ram = r.pick(['8 GB', '16 GB'])
      const ssd = r.pick(['256 GB', '512 GB'])
      return {
        categoryId, condition: cond, askingSum: price,
        title: `${entry.model}, ${ram}/${ssd}, ${phrase}`,
        description: `${entry.model} noutbuk, ${ram} operativ, ${ssd} SSD. Batareya sikli ${r.int(60, 400)}. Zaryadlovchi bilan. Namuna e'lon.`,
        attributes: { model: entry.model, ram, ssd, sikl: r.int(60, 400) },
      }
    }
    if (categoryId === 'televizorlar') {
      const diag = /(\d\d)/.exec(entry.model)?.[1] ?? '43'
      return {
        categoryId, condition: cond, askingSum: price,
        title: `${entry.brand} ${diag} dyuym 4K televizor, ${r.int(1, 3)} yil ishlatilgan`,
        description: `${entry.model}. Smart TV, pult bilan. Ekranda dog' yo'q. Namuna e'lon.`,
        attributes: { diagonal: `${diag}"`, smart: 'Ha' },
      }
    }
    return {
      categoryId, condition: cond, askingSum: price,
      title: `${entry.model}, ${phrase}`,
      description: `${entry.model}. ${r.int(2019, 2025)}-yil. Ishlab chiqaruvchi kafolati tugagan, lekin to'liq ishlaydi. Namuna e'lon.`,
      attributes: { turi: entry.model.includes('yuvish') ? 'Kir yuvish' : entry.model.includes('muzlatgich') ? 'Muzlatgich' : entry.model.includes('konditsioner') ? 'Konditsioner' : 'Changyutgich', yil: r.int(2019, 2025) },
    }
  }
  const tpl = r.pick(TEMPLATES[categoryId as keyof typeof TEMPLATES])
  const price = Math.round(r.float(tpl.min, tpl.max) / 10_000) * 10_000
  return {
    categoryId, condition: cond, askingSum: price,
    title: `${tpl.title}, ${phrase}`,
    description: `${tpl.desc} Namuna e'lon.`,
    attributes: { ...tpl.attributes },
  }
}

export interface ListingsOut { listings: Listing[]; golden: Listing }

export function makeListings(r: Rng, now: ISODate, users: User[], categories: Category[], ruleSet: FeeRuleSet): ListingsOut {
  const catById = new Map(categories.map((c) => [c.id, c]))
  const sellers = users.filter((u) => !u.blocked)
  const statuses: ListingStatus[] = STATUS_PLAN.flatMap(([s, n]) => Array.from({ length: n }, () => s))
  const shuffledStatuses = r.shuffle(statuses)

  // Category mix: phones dominate
  const catWeights: [string, number][] = [
    ['telefonlar', 44], ['noutbuklar', 22], ['televizorlar', 16], ['maishiy', 18], ['mebel', 20], ['kiyim', 14], ['sport', 12], ['bolalar', 14],
  ]
  const catPlan = r.shuffle(catWeights.flatMap(([c, n]) => Array.from({ length: n }, () => c)))

  // Guarantee a handful of published iPhone 13 listings for the buyer's feed
  const iphone13 = MODEL_DICTIONARY.find((m) => m.id === 'iphone-13')!
  const iphone13max = MODEL_DICTIONARY.find((m) => m.id === 'iphone-13-pro-max')!

  const listings: Listing[] = []
  for (let i = 0; i < 160; i++) {
    const status = shuffledStatuses[i]
    let categoryId = catPlan[i]
    let force: ModelEntry | undefined
    if (i < 8) { categoryId = 'telefonlar'; force = i < 6 ? iphone13 : iphone13max }
    const d = draftFor(categoryId, r, force)
    const forcedStatus: ListingStatus = i < 8 ? 'published' : status
    const seller = r.pick(sellers)
    const regionId = seller.regionId
    const ageDays = r.int(0, 60)
    const createdAt = setHour(addDays(now, -ageDays), r.int(8, 22), r.int(0, 59))
    const id = `L-${String(10_000 + i * 37 + r.int(0, 30)).padStart(5, '0')}`
    const asking = d.askingSum * S
    const l: Listing = {
      id, sellerId: seller.id, categoryId, title: d.title, description: d.description,
      images: imagesFor(categoryId, r, r.int(2, 4)), attributes: d.attributes, regionId,
      condition: d.condition, askingTiyin: asking, priceTiyin: asking, status: forcedStatus, priceVerified: false,
      createdAt, stats: stats(r, Math.min(ageDays, 14)),
    }
    if (d.imei) l.imei = d.imei
    const districts = DISTRICTS[regionId]
    if (districts) l.district = r.pick(districts)
    if (forcedStatus !== 'draft') l.submittedAt = addHours(createdAt, r.int(0, 3))
    listings.push(l)
  }

  // Second pass: recognition, suggestions, offers, publication timestamps.
  for (const l of listings) {
    const cat = catById.get(l.categoryId)!
    if (l.status === 'draft' || l.status === 'submitted') continue
    l.specs = recognize(l, cat, MODEL_DICTIONARY)
    if (l.status === 'ai_checked') continue
    const entry = MODEL_DICTIONARY.find((m) => m.model === l.specs?.model)
    const suggestion = suggestPrice({ listing: l, category: cat, history: listings, newRetailTiyin: entry?.newRetailTiyin ?? null, now })
    l.suggestion = suggestion
    if (l.status === 'in_review' || l.status === 'returned_for_edit' || l.status === 'rejected_by_admin') {
      if (l.status === 'rejected_by_admin') l.rejectReason = r.pick(['Rasmlar internetdan olingan', "IMEI ro'yxatda shubhali", 'Taqiqlangan tovar'])
      if (l.status === 'returned_for_edit') l.editRequestReason = r.pick(["Haqiqiy rasm qo'shing", "Xotira hajmini ko'rsating", "Tavsifni to'ldiring"])
      continue
    }
    // offer_sent and beyond
    const offered = suggestion.suggestedTiyin
    const fee = calcFee(offered, l.categoryId, ruleSet)
    l.offer = {
      offeredTiyin: offered, feeTiyin: fee.feeTiyin, sellerGetsTiyin: fee.sellerGetsTiyin,
      note: 'Bozor tahlili asosida taklif', byStaffId: r.chance(0.6) ? 's-price' : 's-mod', at: addHours(l.submittedAt!, r.int(1, 6)),
      aiSuggestedTiyin: suggestion.suggestedTiyin,
    }
    if (l.status === 'offer_sent' || l.status === 'declined_by_seller') continue
    // accepted → published price = offered price
    l.priceTiyin = offered
    l.priceVerified = true
    l.publishedAt = addHours(l.offer.at, r.int(1, 12))
    if (l.status === 'published' && r.chance(0.18)) {
      l.previousPriceTiyin = roundToStep(mulRate(offered, 1 + r.float(0.04, 0.12)), 5_000_000)
    }
    if (l.status === 'published' && r.chance(0.1)) {
      l.boosted = { until: addDays(now, r.int(1, 7)), packageId: r.pick(['boost-kun', 'boost-hafta', 'boost-premium']) }
    }
    if (l.status === 'sold') l.soldAt = addDays(l.publishedAt, r.int(1, 12))
    if (l.status === 'expired') l.publishedAt = addDays(now, -r.int(31, 58))
  }

  const historical = makeHistoricalComparables(r, now, sellers.map((u) => u.id))
  const golden = makeGolden(now)
  return { listings: [...listings, ...historical, golden], golden }
}

/**
 * 30 iPhone 13 Pro 256 GB comparables whose A-normalised prices are symmetric
 * around 6 900 000 so'm, with 4 sold units exactly at the median so that
 * weightedMedian() lands on 690 000 000 tiyin. Q1≈6 785 000, Q3≈7 037 500 →
 * IQR/median ≈ 0.037 → confidence ≈ 0.88.
 */
export function makeHistoricalComparables(r: Rng, now: ISODate, sellerIds: string[]): Listing[] {
  const below = [6_600_000, 6_650_000, 6_700_000, 6_700_000, 6_720_000, 6_750_000, 6_750_000, 6_780_000, 6_800_000, 6_800_000, 6_850_000, 6_850_000, 6_880_000]
  const above = [6_920_000, 6_950_000, 6_950_000, 7_000_000, 7_000_000, 7_050_000, 7_050_000, 7_100_000, 7_100_000, 7_150_000, 7_200_000, 7_200_000, 7_250_000]
  const pattern: ('sold' | 'active' | 'stale')[] = ['sold', 'sold', 'active', 'sold', 'stale', 'sold', 'active', 'sold', 'sold', 'stale', 'sold', 'active', 'sold']
  const conds: Condition[] = ['B', 'A', 'B', 'B', 'C', 'A', 'B', 'B', 'A', 'B', 'B', 'A', 'B']
  const regions = ['toshkent_sh', 'toshkent_sh', 'samarqand', 'andijon', 'fargona', 'namangan', 'buxoro'] as const
  const colors = ['Sierra Blue', 'Graphite', 'Gold', 'Alpine Green', 'Silver']

  let n = 0
  const mk = (priceASum: number, cond: Condition, kind: 'sold' | 'active' | 'stale', daysAgo: number): Listing => {
    n += 1
    const priceA = priceASum * S
    const price = fromA(priceA, cond)
    const published = setHour(addDays(now, -daysAgo), r.int(9, 21), r.int(0, 59))
    const status: ListingStatus = kind === 'sold' ? 'sold' : kind === 'active' ? 'published' : n % 2 ? 'expired' : 'published'
    const color = colors[n % colors.length]
    const l: Listing = {
      id: `H-${String(n).padStart(3, '0')}`, sellerId: sellerIds[n % sellerIds.length], categoryId: 'telefonlar',
      title: `iPhone 13 Pro, 256 GB, ${color}, ${CONDITION_PHRASE[cond][n % 3]}`,
      description: `iPhone 13 Pro 256 GB, ${cond} holat. Tarixiy o'xshash e'lon (namuna).`,
      images: [`ill-phone-${(n % 4) + 1}`, `ill-phone-${((n + 1) % 4) + 1}`],
      attributes: { model: 'iPhone 13 Pro', xotira: '256 GB', rang: color, batareya: 80 + (n % 18) },
      regionId: regions[n % regions.length], condition: cond, askingTiyin: price, priceTiyin: price, status,
      priceVerified: true, createdAt: addHours(published, -5), submittedAt: addHours(published, -4), publishedAt: published,
      stats: { views: 40 + n * 3, saves: n % 5, chats: n % 3, viewsByDay: viewsByDay(r, 40 + n * 3) },
      historical: true,
    }
    if (status === 'sold') l.soldAt = addDays(published, Math.min(daysAgo, 2 + (n % 4)))
    return l
  }
  const side = (values: number[]) => values.map((v, i) => {
    const kind = pattern[i]
    if (kind === 'sold') return mk(v, conds[i], 'sold', 5 + i)
    if (kind === 'active') return mk(v, conds[i], 'active', 3 + (i % 5))
    return mk(v, conds[i], 'stale', 20 + (i % 8))
  })
  return [
    ...side(below),
    mk(6_900_000, 'A', 'sold', 4), mk(6_900_000, 'A', 'sold', 9), mk(6_900_000, 'B', 'sold', 12), mk(6_900_000, 'A', 'sold', 15),
    ...side(above),
  ]
}

export function makeGolden(now: ISODate): Listing {
  return {
    id: GOLDEN.listingId,
    sellerId: GOLDEN.sellerId,
    categoryId: 'telefonlar',
    title: 'iPhone 13 Pro, 256 GB, Sierra Blue',
    description: 'iPhone 13 Pro, 256 GB, Sierra Blue. 2 yil ishlatilgan, ekran himoya oynasi ostida, orqa qopqoqda mayda tirnalish bor. Batareya 89%. Asl quti, kabel va chek bilan. Face ID va barcha kameralar ishlaydi.',
    images: ['ill-phone-1', 'ill-phone-2', 'ill-phone-3', 'ill-phone-4'],
    attributes: { model: 'iPhone 13 Pro', xotira: '256 GB', rang: 'Sierra Blue', batareya: 89 },
    imei: '356789104123457',
    regionId: 'toshkent_sh',
    district: 'Yunusobod',
    condition: 'B',
    askingTiyin: GOLDEN.asking,
    priceTiyin: GOLDEN.asking,
    status: 'draft',
    priceVerified: false,
    createdAt: addHours(now, -1),
    stats: { views: 0, saves: 0, chats: 0, viewsByDay: Array.from({ length: 14 }, () => 0) },
  }
}
