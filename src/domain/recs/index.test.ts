import { describe, it, expect } from 'vitest'
import {
  rankFeed, buildProfile, decay, priceFit, freshness, tokenize, priceDropTargets, matchSavedSearches, savedSearchMatches,
  interestSummary, scoreCandidate, toCandidate, reasonFor,
} from './index'
import type { Listing, Product, UserEvent } from '../types'
import { addDays, addHours } from '../clock'

const NOW = '2026-09-27T14:32:00'
const S = 100

function listing(id: string, title: string, price: number, opts: Partial<Listing> = {}): Listing {
  return {
    id, sellerId: 'u-x', categoryId: 'telefonlar', title, description: '', images: ['ill-phone-1'], attributes: {},
    regionId: 'toshkent_sh', condition: 'B', askingTiyin: price * S, priceTiyin: price * S, status: 'published',
    priceVerified: true, createdAt: addDays(NOW, -3), publishedAt: addDays(NOW, -3),
    stats: { views: 50, saves: 1, chats: 0, viewsByDay: [] }, ...opts,
  }
}
function product(id: string, title: string, price: number, opts: Partial<Product> = {}): Product {
  return {
    id, companyId: 'c-namuna', sku: `SKU-${id}`, categoryId: 'telefonlar', title, description: '', images: ['ill-phone-2'],
    priceTiyin: price * S, marketMedianTiyin: price * S, stock: 5, warrantyMonths: 12, returnDays: 14, check: 'passed',
    checkDelta: 0, attributes: {}, stats: { views: 20, saves: 0, chats: 0, viewsByDay: [] }, createdAt: addDays(NOW, -10), ...opts,
  }
}

const listings: Listing[] = [
  listing('L-ip1', 'iPhone 13 128 GB, ideal', 5_200_000),
  listing('L-ip2', 'iPhone 13 256 GB, Midnight', 5_900_000),
  listing('L-ip3', 'iPhone 13 Pro 256 GB, Graphite', 6_400_000),
  listing('L-ip4', 'iPhone 13, 128 GB, oq', 5_000_000, { regionId: 'namangan' }),
  listing('L-ss', 'Samsung Galaxy S23 256 GB', 5_800_000, { publishedAt: addDays(NOW, -0.5), createdAt: addDays(NOW, -0.5) }),
  listing('L-tv', 'Samsung 55 dyuym 4K televizor', 4_500_000, { categoryId: 'televizorlar', stats: { views: 900, saves: 5, chats: 1, viewsByDay: [] } }),
  listing('L-sofa', 'Divan 3 kishilik', 2_100_000, { categoryId: 'mebel', publishedAt: addDays(NOW, -20), createdAt: addDays(NOW, -20) }),
  listing('L-draft', 'iPhone 13 Pro qoralama', 6_000_000, { status: 'draft' }),
  listing('L-hist', 'iPhone 13 Pro 256 GB tarixiy', 6_000_000, { historical: true }),
  listing('L-old', 'Redmi Note 12 128 GB', 1_800_000, { publishedAt: addDays(NOW, -40), createdAt: addDays(NOW, -40), stats: { views: 3000, saves: 1, chats: 0, viewsByDay: [] } }),
]
const products: Product[] = [
  product('P-1', 'iPhone 13 128 GB yangi', 7_200_000, { promo: { label: '-10%', until: addDays(NOW, 5) } }),
  product('P-2', 'Samsung 55 4K Smart TV', 7_500_000, { categoryId: 'televizorlar' }),
  product('P-3', 'Kir yuvish mashinasi', 5_400_000, { categoryId: 'maishiy', stock: 0 }),
  product('P-4', 'Bolalar aravachasi', 1_200_000, { categoryId: 'bolalar' }),
]
const events: UserEvent[] = [
  { userId: 'u-buyer', kind: 'view_long', at: addDays(NOW, -1), itemId: 'L-ip1', source: 'listing' },
  { userId: 'u-buyer', kind: 'view_long', at: addDays(NOW, -1), itemId: 'L-ip2', source: 'listing' },
  { userId: 'u-buyer', kind: 'view_long', at: addDays(NOW, -1), itemId: 'L-ip4', source: 'listing' },
  { userId: 'u-buyer', kind: 'search', at: addDays(NOW, -1), query: 'iphone 13' },
  { userId: 'u-buyer', kind: 'save', at: addDays(NOW, -1), itemId: 'L-ip2', source: 'listing' },
  { userId: 'u-buyer', kind: 'purchase', at: addDays(NOW, -2), itemId: 'L-old', source: 'listing', priceTiyin: 1_800_000 * S, categoryId: 'telefonlar' },
  { userId: 'u-other', kind: 'view', at: NOW, itemId: 'L-sofa', source: 'listing' },
]

describe('helpers', () => {
  it('decay half-life 7 days', () => {
    expect(decay(0)).toBe(1)
    expect(decay(7)).toBeCloseTo(0.5)
    expect(decay(14)).toBeCloseTo(0.25)
    expect(decay(-3)).toBe(1)
  })
  it('freshness', () => {
    expect(freshness(NOW, NOW)).toBe(1)
    expect(freshness(addDays(NOW, -14), NOW)).toBe(0)
    expect(freshness(addDays(NOW, -30), NOW)).toBe(0)
    expect(freshness(addHours(NOW, -180), NOW)).toBeCloseTo(0.5)
  })
  it('tokenize', () => {
    expect(tokenize('iPhone 13 Pro, 256 GB')).toEqual(['iphone', '13', 'pro', '256', 'gb'])
    expect(tokenize('a')).toEqual([])
  })
  it('priceFit', () => {
    const p = buildProfile([], [], [], NOW)
    expect(priceFit(p, 100)).toBe(0.5)
    p.priceP25 = 100; p.priceP75 = 200
    expect(priceFit(p, 150)).toBe(1)
    expect(priceFit(p, 250)).toBeCloseTo(0.5)
    expect(priceFit(p, 50)).toBeCloseTo(0.5)
    expect(priceFit(p, 10_000)).toBe(0)
  })
})

describe('buildProfile', () => {
  const p = buildProfile(events.filter((e) => e.userId === 'u-buyer'), listings, products, NOW)
  it('aggregates categories, models, sets and price range', () => {
    expect(p.categories.telefonlar).toBeGreaterThan(0)
    expect(p.models['iPhone 13']).toBeGreaterThan(p.models['Redmi Note 12'] ?? 0)
    expect(p.brands.Apple).toBeGreaterThan(0)
    expect(p.viewed.has('L-ip1')).toBe(true)
    expect(p.saved.has('L-ip2')).toBe(true)
    expect(p.purchased.has('L-old')).toBe(true)
    expect(p.queries['iphone 13']).toBeGreaterThan(0)
    expect(p.tokens.iphone).toBeGreaterThan(0)
    expect(p.regions.toshkent_sh).toBeGreaterThan(0)
    expect(p.priceP25).not.toBeNull()
    expect(p.priceP75).toBeGreaterThanOrEqual(p.priceP25!)
    expect(p.modelKinds['iPhone 13'].search).toBeGreaterThan(0)
  })
  it('events with explicit fields but unknown items', () => {
    const q = buildProfile([{ userId: 'u', kind: 'view', at: NOW, itemId: 'ghost', model: 'iPhone 12', categoryId: 'telefonlar', regionId: 'andijon', priceTiyin: 5 }], [], [], NOW)
    expect(q.models['iPhone 12']).toBe(1)
    expect(q.brands.Apple).toBe(1)
    expect(q.regions.andijon).toBe(1)
    expect(q.priceP25).toBe(5)
    const r = buildProfile([{ userId: 'u', kind: 'search', at: NOW, query: 'divan' }], [], [], NOW)
    expect(r.models).toEqual({})
    expect(r.queries.divan).toBe(3)
  })
})

describe('rankFeed', () => {
  it('puts iPhone listings first with iPhone reasons; excludes purchased/draft/historical/out-of-stock', () => {
    const feed = rankFeed({ userId: 'u-buyer', events, listings, products, now: NOW, limit: 10 })
    expect(feed.length).toBeGreaterThan(0)
    expect(feed.length).toBeLessThanOrEqual(10)
    const first = feed[0]
    expect(first.bucket).toBe('personal')
    expect(first.reason).toMatch(/iPhone|iphone/)
    const top4 = feed.slice(0, 4).map((f) => (listings.find((l) => l.id === f.id) ?? products.find((p) => p.id === f.id))!.title.toLowerCase())
    expect(top4[0]).toContain('iphone')
    expect(top4.filter((t) => t.includes('iphone')).length).toBeGreaterThanOrEqual(3)
    const ids = feed.map((f) => f.id)
    expect(ids).not.toContain('L-old')
    expect(ids).not.toContain('L-draft')
    expect(ids).not.toContain('L-hist')
    expect(ids).not.toContain('P-3')
    expect(new Set(ids).size).toBe(ids.length)
    expect(feed.filter((f) => f.bucket === 'mall').every((f) => f.reason === 'Mall · kafolat bilan')).toBe(true)
    expect(feed.some((f) => f.bucket === 'fresh')).toBe(true)
    expect(feed.find((f) => f.id === 'P-1')?.bucket).toBe('personal') // iPhone product is personal, not mall
    expect(feed.find((f) => f.bucket === 'mall')).toBeDefined()
  })
  it('viewed items are pushed down vs unseen equivalent', () => {
    const feed = rankFeed({ userId: 'u-buyer', events, listings, products, now: NOW, limit: 10 })
    const pos = (id: string) => feed.findIndex((f) => f.id === id)
    expect(pos('L-ip3')).toBeGreaterThanOrEqual(0)
    expect(pos('L-ip3')).toBeLessThan(pos('L-ip1'))
  })
  it('no events → no personal, fresh/popular/mall mix', () => {
    const feed = rankFeed({ userId: 'u-nobody', events, listings, products, now: NOW, limit: 10 })
    expect(feed.every((f) => f.bucket !== 'personal')).toBe(true)
    expect(feed.filter((f) => f.bucket === 'fresh').length).toBeGreaterThanOrEqual(5)
    expect(feed.filter((f) => f.bucket === 'mall').length).toBe(2)
    expect(feed[0].reason).toBe("Yangi e'lon")
    expect(feed.some((f) => f.reason === "Ko'p ko'rilgan")).toBe(true)
    expect(feed.find((f) => f.bucket === 'mall')?.id).toBe('P-1') // promo first
  })
  it('default limit and backfill never exceeds available items', () => {
    const feed = rankFeed({ userId: 'u-nobody', events: [], listings, products, now: NOW })
    expect(feed.length).toBe(listings.filter((l) => l.status === 'published' && !l.historical).length + products.filter((p) => p.stock > 0).length)
  })
  it('personal items respect min score threshold', () => {
    const weak: UserEvent[] = [{ userId: 'u-w', kind: 'view', at: addDays(NOW, -60), itemId: 'L-sofa', source: 'listing' }]
    const feed = rankFeed({ userId: 'u-w', events: weak, listings, products, now: NOW, limit: 10 })
    expect(feed.filter((f) => f.bucket === 'personal').every((f) => f.score > 0.15)).toBe(true)
  })
})

describe('reasons', () => {
  const p = buildProfile(events.filter((e) => e.userId === 'u-buyer'), listings, products, NOW)
  it('view / search / save / category variants', () => {
    expect(reasonFor(scoreCandidate(toCandidate('listing', listings[0]), p, NOW), p)).toBe("Siz iPhone 13 ko'rgansiz")
    const searchOnly = buildProfile([{ userId: 'u', kind: 'search', at: NOW, query: 'galaxy s23' }], [], [], NOW)
    expect(reasonFor(scoreCandidate(toCandidate('listing', listings[4]), searchOnly, NOW), searchOnly)).toBe('Siz «galaxy s23» qidirgansiz')
    const saveOnly = buildProfile([{ userId: 'u', kind: 'save', at: NOW, itemId: 'L-ss', source: 'listing' }], listings, [], NOW)
    expect(reasonFor(scoreCandidate(toCandidate('listing', listings[4]), saveOnly, NOW), saveOnly)).toBe('Siz Samsung Galaxy S23 saqlagansiz')
    // token match without model in profile
    const tok = buildProfile([{ userId: 'u', kind: 'search', at: NOW, query: 'televizor dyuym' }], [], [], NOW)
    expect(reasonFor(scoreCandidate(toCandidate('listing', listings[5]), tok, NOW), tok)).toBe('Siz «televizor dyuym» qidirgansiz')
    // category with saves
    const catSave = buildProfile([{ userId: 'u', kind: 'save', at: NOW, itemId: 'L-sofa', source: 'listing' }], listings, [], NOW)
    const sofa2 = listing('L-sofa2', 'Kreslo yumshoq', 900_000, { categoryId: 'mebel' })
    expect(reasonFor(scoreCandidate(toCandidate('listing', sofa2), catSave, NOW), catSave)).toBe("Siz shunga o'xshashini saqlagansiz")
    const catView = buildProfile([{ userId: 'u', kind: 'view', at: NOW, itemId: 'L-sofa', source: 'listing' }], listings, [], NOW)
    expect(reasonFor(scoreCandidate(toCandidate('listing', sofa2), catView, NOW), catView)).toBe("Siz shunga o'xshashini ko'rgansiz")
    const none = buildProfile([{ userId: 'u', kind: 'view', at: NOW, itemId: 'L-sofa', source: 'listing' }], listings, [], NOW)
    expect(reasonFor(scoreCandidate(toCandidate('product', products[3]), none, NOW), none)).toBe('Sizga yoqishi mumkin')
  })
})

describe('priceDropTargets / saved searches / summary', () => {
  it('priceDropTargets', () => {
    const l = listings[1]
    const evs: UserEvent[] = [
      ...events,
      { userId: 'u-x', kind: 'view', at: NOW, itemId: 'L-ip2', source: 'listing' }, // seller
      { userId: 'u-z', kind: 'cart', at: NOW, itemId: 'L-ip2', source: 'listing' },
      { userId: 'u-p', kind: 'view', at: NOW, itemId: 'L-ip2', source: 'product' },
      { userId: 'u-a', kind: 'view', at: NOW, itemId: 'L-ip2' },
    ]
    expect(priceDropTargets(l, evs)).toEqual(['u-a', 'u-buyer'])
  })
  it('matchSavedSearches', () => {
    const ss = [
      { id: 'ss1', userId: 'u-buyer', query: 'iphone 13 pro', maxPriceTiyin: 7_000_000 * S, createdAt: NOW },
      { id: 'ss2', userId: 'u-buyer', query: 'iphone 13 pro', maxPriceTiyin: 6_000_000 * S, createdAt: NOW },
      { id: 'ss3', userId: 'u-buyer', query: 'iphone', categoryId: 'noutbuklar', createdAt: NOW },
      { id: 'ss4', userId: 'u-buyer', query: 'iphone', categoryId: 'telefonlar', createdAt: NOW },
      { id: 'ss5', userId: 'u-buyer', query: '', createdAt: NOW },
    ]
    expect(matchSavedSearches(listings[2], ss).map((s) => s.id)).toEqual(['ss1', 'ss4'])
    expect(savedSearchMatches(listings[6], ss[0])).toBe(false)
  })
  it('interestSummary', () => {
    const s = interestSummary(events.filter((e) => e.userId === 'u-buyer'), NOW)
    expect(s.topQueries[0].query).toBe('iphone 13')
    expect(s.topModels[0].model).toBe('iPhone 13')
    expect(s.topCategories[0].id).toBe('telefonlar')
    expect(s.priceRange).toEqual({ p25: 180_000_000, p75: 180_000_000 })
    expect(s.totalWeight).toBeGreaterThan(0)
    const empty = interestSummary([])
    expect(empty).toEqual({ totalWeight: 0, topCategories: [], topModels: [], topQueries: [], priceRange: null, regions: [] })
    const noNow = interestSummary([{ userId: 'u', kind: 'view', at: NOW, regionId: 'andijon' }])
    expect(noNow.regions).toEqual([{ id: 'andijon', weight: 1 }])
  })
})
