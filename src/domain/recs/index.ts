/**
 * Feed ranking. Interest profile from decayed user events, scored against
 * published listings and in-stock products, mixed 60/20/20 (personal/fresh/mall).
 */
import type { FeedItem, ISODate, Id, ItemSource, Listing, Product, RegionId, SavedSearch, Tiyin, UserEvent, UserEventKind } from '../types'
import { quantile } from '../money'
import { ageDays } from '../clock'
import { findModel, MODEL_DICTIONARY } from '../checks/models'

export const EVENT_WEIGHT: Record<UserEventKind, number> = {
  view: 1, view_long: 2, search: 3, save: 4, chat: 5, cart: 6, purchase: 6,
}
export const HALF_LIFE_DAYS = 7
export const PERSONAL_MIN_SCORE = 0.15
export const VIEWED_PENALTY = 0.6
export const SCORE_WEIGHTS = { model: 0.35, category: 0.25, price: 0.2, region: 0.1, freshness: 0.1 } as const

export function decay(ageInDays: number): number {
  return Math.pow(0.5, Math.max(0, ageInDays) / HALF_LIFE_DAYS)
}

export interface InterestProfile {
  total: number
  categories: Record<string, number>
  models: Record<string, number>
  /** which event kinds contributed to a model (for reasons) */
  modelKinds: Record<string, Partial<Record<UserEventKind, number>>>
  brands: Record<string, number>
  regions: Partial<Record<RegionId, number>>
  queries: Record<string, number>
  tokens: Record<string, number>
  priceP25: Tiyin | null
  priceP75: Tiyin | null
  viewed: Set<Id>
  saved: Set<Id>
  purchased: Set<Id>
}

export interface Candidate {
  source: ItemSource
  id: Id
  title: string
  categoryId: Id
  model?: string
  brand?: string
  priceTiyin: Tiyin
  regionId?: RegionId
  createdAt: ISODate
  views: number
  promo: boolean
}

export function toCandidate(source: ItemSource, x: Listing | Product): Candidate {
  const m = ('specs' in x && x.specs?.model) ? MODEL_DICTIONARY.find((d) => d.model === x.specs?.model) ?? findModel(x.title) : findModel(x.title)
  const c: Candidate = {
    source, id: x.id, title: x.title, categoryId: x.categoryId, priceTiyin: x.priceTiyin,
    createdAt: ('publishedAt' in x && x.publishedAt) ? x.publishedAt : x.createdAt,
    views: x.stats.views, promo: 'promo' in x && !!x.promo,
  }
  if (m) { c.model = m.model; c.brand = m.brand }
  if ('regionId' in x) c.regionId = x.regionId
  return c
}

export function tokenize(q: string): string[] {
  return q.toLowerCase().split(/[^a-z0-9а-яʼ"''']+/i).map((t) => t.trim()).filter((t) => t.length >= 2)
}

function bump<K extends string>(map: Partial<Record<K, number>>, key: K, w: number) {
  map[key] = (map[key] ?? 0) + w
}

export function buildProfile(events: UserEvent[], listings: Listing[], products: Product[], now: ISODate): InterestProfile {
  const byId = new Map<string, Candidate>()
  for (const l of listings) byId.set(`listing:${l.id}`, toCandidate('listing', l))
  for (const p of products) byId.set(`product:${p.id}`, toCandidate('product', p))

  const profile: InterestProfile = {
    total: 0, categories: {}, models: {}, modelKinds: {}, brands: {}, regions: {}, queries: {}, tokens: {},
    priceP25: null, priceP75: null, viewed: new Set(), saved: new Set(), purchased: new Set(),
  }
  const prices: Tiyin[] = []

  for (const ev of events) {
    const w = EVENT_WEIGHT[ev.kind] * decay(ageDays(ev.at, now))
    profile.total += w
    const item = ev.itemId ? byId.get(`${ev.source ?? 'listing'}:${ev.itemId}`) : undefined
    if (ev.itemId) {
      if (ev.kind === 'purchase') profile.purchased.add(ev.itemId)
      else if (ev.kind === 'save' || ev.kind === 'cart') profile.saved.add(ev.itemId)
      else profile.viewed.add(ev.itemId)
    }
    const categoryId = ev.categoryId ?? item?.categoryId
    const model = ev.model ?? item?.model
    const brand = item?.brand ?? (model ? findModel(model)?.brand : undefined)
    const price = ev.priceTiyin ?? item?.priceTiyin
    const region = ev.regionId ?? item?.regionId
    if (categoryId) bump(profile.categories, categoryId, w)
    if (model) {
      bump(profile.models, model, w)
      profile.modelKinds[model] ??= {}
      bump(profile.modelKinds[model], ev.kind, w)
    }
    if (brand) bump(profile.brands, brand, w)
    if (region) bump(profile.regions, region, w)
    if (price !== undefined) prices.push(price)
    if (ev.query) {
      const q = ev.query.trim().toLowerCase()
      bump(profile.queries, q, w)
      for (const t of tokenize(q)) bump(profile.tokens, t, w)
      const qm = findModel(q)
      if (qm) {
        bump(profile.models, qm.model, w * 0.8)
        profile.modelKinds[qm.model] ??= {}
        bump(profile.modelKinds[qm.model], 'search', w * 0.8)
        bump(profile.brands, qm.brand, w * 0.5)
      }
    }
  }
  if (prices.length) {
    profile.priceP25 = Math.round(quantile(prices, 0.25))
    profile.priceP75 = Math.round(quantile(prices, 0.75))
  }
  return profile
}

function ratio(map: Record<string, number>, key: string | undefined): number {
  if (!key) return 0
  const max = Math.max(0, ...Object.values(map))
  if (max <= 0) return 0
  return (map[key] ?? 0) / max
}

/** Share of query tokens that appear in the title, weighted by token importance. */
function tokenMatch(profile: InterestProfile, title: string): number {
  const entries = Object.entries(profile.tokens)
  if (!entries.length) return 0
  const t = title.toLowerCase()
  const total = entries.reduce((a, [, w]) => a + w, 0)
  const hit = entries.filter(([tok]) => t.includes(tok)).reduce((a, [, w]) => a + w, 0)
  return hit / total
}

export function priceFit(profile: InterestProfile, price: Tiyin): number {
  if (profile.priceP25 === null || profile.priceP75 === null) return 0.5
  const lo = profile.priceP25
  const hi = profile.priceP75
  if (price >= lo && price <= hi) return 1
  const mid = (lo + hi) / 2
  const span = Math.max(hi - lo, mid * 0.25, 1)
  const dist = price < lo ? lo - price : price - hi
  return Math.max(0, 1 - dist / span)
}

export function freshness(createdAt: ISODate, now: ISODate): number {
  const age = ageDays(createdAt, now)
  if (age < 1) return 1
  if (age >= 14) return 0
  return 1 - (age - 1) / 13
}

export interface Scored { candidate: Candidate; score: number; parts: { model: number; category: number; price: number; region: number; freshness: number }; viewed: boolean }

export function scoreCandidate(c: Candidate, profile: InterestProfile, now: ISODate): Scored {
  const exact = ratio(profile.models, c.model)
  const brand = ratio(profile.brands, c.brand)
  const tokens = tokenMatch(profile, c.title)
  const model = Math.max(exact, 0.7 * tokens, 0.4 * brand)
  const category = ratio(profile.categories, c.categoryId)
  const price = priceFit(profile, c.priceTiyin)
  const region = c.regionId ? ratio(profile.regions as Record<string, number>, c.regionId) : 0
  const fresh = freshness(c.createdAt, now)
  let score = SCORE_WEIGHTS.model * model + SCORE_WEIGHTS.category * category + SCORE_WEIGHTS.price * price
    + SCORE_WEIGHTS.region * region + SCORE_WEIGHTS.freshness * fresh
  const viewed = profile.viewed.has(c.id)
  if (viewed) score *= VIEWED_PENALTY
  return { candidate: c, score: Math.round(score * 1000) / 1000, parts: { model, category, price, region, freshness: fresh }, viewed }
}

function topQuery(profile: InterestProfile): string | undefined {
  return Object.entries(profile.queries).sort((a, b) => b[1] - a[1])[0]?.[0]
}

export function reasonFor(s: Scored, profile: InterestProfile): string {
  const c = s.candidate
  const kinds = c.model ? profile.modelKinds[c.model] : undefined
  if (c.model && kinds) {
    const viewedW = (kinds.view ?? 0) + (kinds.view_long ?? 0) + (kinds.chat ?? 0)
    const searchW = kinds.search ?? 0
    const savedW = (kinds.save ?? 0) + (kinds.cart ?? 0)
    if (viewedW > 0 && viewedW >= searchW) return `Siz ${c.model} ko'rgansiz`
    if (searchW > 0) {
      const q = topQuery(profile)
      return q ? `Siz «${q}» qidirgansiz` : `Siz ${c.model} ko'rgansiz`
    }
    if (savedW > 0) return `Siz ${c.model} saqlagansiz`
  }
  if (s.parts.model >= 0.5 && Object.keys(profile.queries).length) return `Siz «${topQuery(profile)}» qidirgansiz`
  if (s.parts.category >= 0.5 && profile.saved.size) return "Siz shunga o'xshashini saqlagansiz"
  if (s.parts.category >= 0.5) return "Siz shunga o'xshashini ko'rgansiz"
  return 'Sizga yoqishi mumkin'
}

export interface RankInput {
  userId: Id
  events: UserEvent[]
  listings: Listing[]
  products: Product[]
  now: ISODate
  limit?: number
}

export function rankFeed(input: RankInput): FeedItem[] {
  const limit = input.limit ?? 30
  const now = input.now
  const events = input.events.filter((e) => e.userId === input.userId)
  const listings = input.listings.filter((l) => l.status === 'published' && !l.historical)
  const products = input.products.filter((p) => p.stock > 0)
  const profile = buildProfile(events, listings, products, now)
  const hasEvents = events.length > 0

  const candidates: Candidate[] = [
    ...listings.map((l) => toCandidate('listing', l)),
    ...products.map((p) => toCandidate('product', p)),
  ].filter((c) => !profile.purchased.has(c.id))

  const taken = new Set<string>()
  const out: FeedItem[] = []
  const push = (c: Candidate, score: number, bucket: FeedItem['bucket'], reason: string) => {
    const key = `${c.source}:${c.id}`
    if (taken.has(key)) return false
    taken.add(key)
    out.push({ source: c.source, id: c.id, score: Math.round(score * 1000) / 1000, bucket, reason })
    return true
  }

  // 1. personal
  const personalN = hasEvents ? Math.round(limit * 0.6) : 0
  if (personalN > 0) {
    const scored = candidates.map((c) => scoreCandidate(c, profile, now))
      .filter((s) => s.score > PERSONAL_MIN_SCORE)
      .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    for (const s of scored) {
      if (out.length >= personalN) break
      push(s.candidate, s.score, 'personal', reasonFor(s, profile))
    }
  }

  // 2. fresh + popular (listings only)
  const freshN = hasEvents ? Math.round(limit * 0.2) : Math.round(limit * 0.5)
  const popularN = hasEvents ? 0 : Math.round(limit * 0.3)
  const listingCands = candidates.filter((c) => c.source === 'listing')
  const newest = [...listingCands].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
  const popular = [...listingCands].sort((a, b) => b.views - a.views || a.id.localeCompare(b.id))
  const freshTarget = out.length + freshN
  const newestShare = hasEvents ? Math.ceil(freshN / 2) : freshN
  let added = 0
  for (const c of newest) {
    if (added >= newestShare) break
    if (push(c, freshness(c.createdAt, now), 'fresh', "Yangi e'lon")) added += 1
  }
  for (const c of popular) {
    if (out.length >= freshTarget) break
    push(c, Math.min(1, c.views / 1000), 'fresh', "Ko'p ko'rilgan")
  }
  if (popularN > 0) {
    const popTarget = out.length + popularN
    for (const c of popular) {
      if (out.length >= popTarget) break
      push(c, Math.min(1, c.views / 1000), 'fresh', "Ko'p ko'rilgan")
    }
  }

  // 3. mall (promo first)
  const mallN = Math.round(limit * 0.2)
  const mallTarget = out.length + mallN
  const mall = candidates.filter((c) => c.source === 'product')
    .sort((a, b) => Number(b.promo) - Number(a.promo) || b.views - a.views || a.id.localeCompare(b.id))
  for (const c of mall) {
    if (out.length >= mallTarget) break
    push(c, c.promo ? 0.9 : 0.5, 'mall', 'Mall · kafolat bilan')
  }

  // 4. backfill with remaining fresh listings so the feed is never short
  for (const c of newest) {
    if (out.length >= limit) break
    push(c, freshness(c.createdAt, now), 'fresh', "Yangi e'lon")
  }
  return out.slice(0, limit)
}

/** Users who viewed or saved the listing (excluding the seller) — recipients of a "Narx tushdi" push. */
export function priceDropTargets(listing: Listing, events: UserEvent[]): Id[] {
  const ids = new Set<Id>()
  for (const e of events) {
    if (e.itemId !== listing.id) continue
    if (e.source && e.source !== 'listing') continue
    if (e.kind !== 'view' && e.kind !== 'view_long' && e.kind !== 'save') continue
    if (e.userId === listing.sellerId) continue
    ids.add(e.userId)
  }
  return [...ids].sort()
}

export function savedSearchMatches(listing: Listing, s: SavedSearch): boolean {
  const title = listing.title.toLowerCase()
  const tokens = tokenize(s.query)
  if (!tokens.length) return false
  if (!tokens.every((t) => title.includes(t))) return false
  if (s.categoryId && s.categoryId !== listing.categoryId) return false
  if (s.maxPriceTiyin !== undefined && listing.priceTiyin > s.maxPriceTiyin) return false
  return true
}

export function matchSavedSearches(listing: Listing, savedSearches: SavedSearch[]): SavedSearch[] {
  return savedSearches.filter((s) => savedSearchMatches(listing, s))
}

export interface InterestSummary {
  totalWeight: number
  topCategories: { id: string; weight: number }[]
  topModels: { model: string; weight: number }[]
  topQueries: { query: string; weight: number }[]
  priceRange: { p25: Tiyin; p75: Tiyin } | null
  regions: { id: RegionId; weight: number }[]
}

function top<T extends string>(map: Partial<Record<T, number>>, n = 5): { key: T; weight: number }[] {
  return (Object.entries(map) as [T, number][])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([key, weight]) => ({ key, weight: Math.round(weight * 100) / 100 }))
}

/** Debug view of the interest profile (no item catalogue needed). */
export function interestSummary(events: UserEvent[], now?: ISODate): InterestSummary {
  const ref = now ?? events.map((e) => e.at).sort().at(-1) ?? '1970-01-01T00:00:00'
  const p = buildProfile(events, [], [], ref)
  return {
    totalWeight: Math.round(p.total * 100) / 100,
    topCategories: top(p.categories).map(({ key, weight }) => ({ id: key, weight })),
    topModels: top(p.models).map(({ key, weight }) => ({ model: key, weight })),
    topQueries: top(p.queries).map(({ key, weight }) => ({ query: key, weight })),
    priceRange: p.priceP25 !== null && p.priceP75 !== null ? { p25: p.priceP25, p75: p.priceP75 } : null,
    regions: top(p.regions).map(({ key, weight }) => ({ id: key, weight })),
  }
}
