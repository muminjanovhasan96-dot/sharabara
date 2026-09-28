/**
 * Sharabara price engine. Pure, deterministic, integer tiyin.
 *
 *  1. recognize specs (or reuse listing.specs)
 *  2. pick comparables (same model [+storage], last 30 days, sold/published/expired)
 *  3. normalise every comparable to condition A, weighted median  -> marketMedianTiyin
 *  4. bring back to the listing's condition (exact; A → 0)          -> holat tuzatmasi
 *  5. cap at newRetail × maxNewRatio (row shown only when it binds)
 *  6. Sharabara rule: exactly −discountRate of the previous line     -> qoida
 *  7. floor to 50 000 so'm; the difference is its own row            -> yaxlitlash
 *  Invariant: base + adjust rows === total === suggestedTiyin.
 */
import type {
  Category, Comparable, Condition, ISODate, Listing, PriceBreakdownRow, PriceFlag, PriceSuggestion,
  RecognizedSpecs, Tiyin,
} from '../types'
import { floorToStep, mulRate, quantile, weightedMedian } from '../money'
import { ageDays, daysBetween } from '../clock'
import { recognize } from '../checks/recognize'
import { MODEL_DICTIONARY, findModel } from '../checks/models'

export const CONDITION_K: Record<Condition, number> = { A: 1, B: 0.95, C: 0.85, D: 0.7 }
/** 50 000 so'm */
export const PRICE_STEP: Tiyin = 5_000_000
export const COMPARABLE_WINDOW_DAYS = 30
export const STALE_DAYS = 14
export const WEIGHTS = { sold: 1, active: 0.6, activeUnverified: 0.45, stale: 0.3 } as const
/** So'ralgan narx tavsiyadan shuncha foizdan ko'p bo'lsa — «Qimmat»; ± shu oraliqda — «Mos». */
export const FAIR_BAND = 0.03
/** Mall tovari bozor medianidan shuncha foizdan qimmat bo'lsa — narx qoidasidan o'tmaydi. */
export const MALL_MAX_OVER = 0.03
export function mallCheck(priceTiyin: Tiyin, marketMedianTiyin: Tiyin): 'passed' | 'overpriced' {
  if (marketMedianTiyin <= 0) return 'passed'
  return priceTiyin * 1000 > marketMedianTiyin * Math.round((1 + MALL_MAX_OVER) * 1000) ? 'overpriced' : 'passed'
}
/** Narx tahlili navbati: sotuvchi yuborgan, hali taklif yuborilmagan e'lonlar (sidebar va sahifa bitta manba). */
export function isPricingQueue(l: Pick<Listing, 'status' | 'historical'>): boolean {
  return (l.status === 'in_review' || l.status === 'submitted' || l.status === 'ai_checked') && !l.historical
}
export const FALLBACK_DISCOUNT = 0.05

export interface SuggestInput {
  listing: Listing
  category: Category
  history: Listing[]
  newRetailTiyin: Tiyin | null
  now: ISODate
}

/** round(p / k(cond)) with integer arithmetic (k expressed in basis points). */
export function normalizeToA(priceTiyin: Tiyin, condition: Condition): Tiyin {
  const bps = Math.round(CONDITION_K[condition] * 10_000)
  return Math.round((priceTiyin * 10_000) / bps)
}

/** Inverse of normalizeToA for a given condition (used by the seed to craft exact comparables). */
export function fromA(priceA: Tiyin, condition: Condition): Tiyin {
  return mulRate(priceA, CONDITION_K[condition])
}

export function modelOf(l: Listing): string | undefined {
  return l.specs?.model ?? findModel(l.title, MODEL_DICTIONARY)?.model ?? (typeof l.attributes.model === 'string' ? l.attributes.model : undefined)
}

function storageOf(l: Listing, specs?: RecognizedSpecs): string | undefined {
  if (specs?.storage) return specs.storage
  const m = /\b(\d{1,4})\s?(gb|tb)\b/i.exec(l.title)
  if (m) return `${m[1]} ${m[2].toUpperCase()}`
  return typeof l.attributes.xotira === 'string' ? l.attributes.xotira : undefined
}

export function buildComparables(listing: Listing, specs: RecognizedSpecs, history: Listing[], now: ISODate): Comparable[] {
  if (!specs.model) return []
  const out: Comparable[] = []
  for (const h of history) {
    if (h.id === listing.id) continue
    if (h.status !== 'sold' && h.status !== 'published' && h.status !== 'expired') continue
    if (modelOf(h) !== specs.model) continue
    if (specs.storage && storageOf(h, h.specs) !== specs.storage) continue
    const ref = h.publishedAt ?? h.submittedAt ?? h.createdAt
    const age = ageDays(ref, now)
    if (age < 0 || age > COMPARABLE_WINDOW_DAYS) continue

    let outcome: Comparable['outcome']
    let weight: number
    let daysListed: number
    let daysToSell: number | undefined
    if (h.status === 'sold') {
      daysListed = Math.max(0, daysBetween(ref, h.soldAt ?? now))
      daysToSell = daysListed
      outcome = 'sold'
      weight = WEIGHTS.sold
    } else {
      daysListed = Math.max(0, daysBetween(ref, now))
      if (h.status === 'expired' || daysListed >= STALE_DAYS) {
        outcome = 'stale'
        weight = WEIGHTS.stale
      } else {
        outcome = 'active'
        weight = h.priceVerified ? WEIGHTS.active : WEIGHTS.activeUnverified
      }
    }
    const c: Comparable = {
      listingId: h.id, title: h.title, condition: h.condition, regionId: h.regionId,
      priceTiyin: h.priceTiyin, outcome, daysListed, weight,
    }
    if (daysToSell !== undefined) c.daysToSell = daysToSell
    out.push(c)
  }
  return out
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/** conf = clamp(0.55 + 0.03·min(n,12) − 0.8·(IQR/median), 0.2, 0.97) */
export function confidenceFor(normalizedPrices: Tiyin[], medianA: Tiyin): number {
  const n = normalizedPrices.length
  if (n === 0 || medianA <= 0) return 0.2
  const iqr = quantile(normalizedPrices, 0.75) - quantile(normalizedPrices, 0.25)
  const dispersion = iqr / medianA
  const conf = 0.55 + 0.03 * Math.min(n, 12) - 0.8 * dispersion
  return Math.round(clamp(conf, 0.2, 0.97) * 1000) / 1000
}

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

export function suggestPrice(input: SuggestInput): PriceSuggestion {
  const { listing, category, history, now } = input
  const specs = listing.specs ?? recognize(listing, category, MODEL_DICTIONARY)
  const comparables = buildComparables(listing, specs, history, now)
  const flags: PriceFlag[] = []
  const breakdown: PriceBreakdownRow[] = []
  const k = CONDITION_K[listing.condition]
  const newRetail = input.newRetailTiyin

  let suggested: Tiyin
  let marketMedian: Tiyin
  let confidence: number

  /** qoida va yaxlitlash qatorlari — ikkala tarmoq uchun bir xil */
  const applyRuleAndRound = (from: Tiyin, rate: number): Tiyin => {
    const rule = mulRate(from, rate)
    breakdown.push({ label: `Sharabara qoidasi (−${pct(rate)})`, amountTiyin: -rule, kind: 'adjust' })
    const exact = from - rule
    const rounded = floorToStep(exact, PRICE_STEP)
    if (rounded !== exact) breakdown.push({ label: 'Yaxlitlash (50 000 so’mgacha)', amountTiyin: rounded - exact, kind: 'adjust' })
    return rounded
  }

  if (comparables.length === 0) {
    // Fallback: seller's asking price minus the Sharabara rule.
    marketMedian = listing.askingTiyin
    breakdown.push({ label: "Sotuvchi narxi (o'xshashlar topilmadi)", amountTiyin: listing.askingTiyin, kind: 'base' })
    suggested = applyRuleAndRound(listing.askingTiyin, FALLBACK_DISCOUNT)
    confidence = 0.2
  } else {
    const normalized = comparables.map((c) => normalizeToA(c.priceTiyin, c.condition))
    marketMedian = weightedMedian(comparables.map((c, i) => ({ value: normalized[i], weight: c.weight })))
    // holat tuzatmasi aniq: A → 0, B → −5%, C → −15%, D → −30%
    const afterCondition = mulRate(marketMedian, k)
    breakdown.push({ label: "O'xshashlar o'rtachasi (A holatga keltirilgan)", amountTiyin: marketMedian, kind: 'base' })
    breakdown.push({ label: `Holat tuzatmasi (${listing.condition})`, amountTiyin: afterCondition - marketMedian, kind: 'adjust' })

    let afterCap = afterCondition
    if (newRetail !== null && newRetail > 0) {
      const cap = mulRate(newRetail, category.maxNewRatio)
      if (cap < afterCondition) {
        afterCap = cap
        breakdown.push({ label: `Yangi narx chegarasi (${pct(category.maxNewRatio)})`, amountTiyin: cap - afterCondition, kind: 'adjust' })
      }
    }
    suggested = applyRuleAndRound(afterCap, category.discountRate)
    confidence = confidenceFor(normalized, marketMedian)
  }
  breakdown.push({ label: 'Tavsiya etilgan narx', amountTiyin: suggested, kind: 'total' })

  if (comparables.length < 3) {
    flags.push('low_data')
    confidence = Math.min(confidence, 0.4)
  }
  if (listing.askingTiyin * 100 > suggested * Math.round((1 + FAIR_BAND) * 100)) flags.push('overpriced')
  else if (Math.abs(listing.askingTiyin - suggested) * 100 <= suggested * Math.round(FAIR_BAND * 100)) flags.push('fair')
  if (specs.imeiStatus === 'suspicious') flags.push('imei_issue')
  if (!specs.imagesOriginal) flags.push('images_suspicious')

  return {
    suggestedTiyin: suggested,
    confidence,
    breakdown,
    comparables,
    flags,
    marketMedianTiyin: marketMedian,
    newRetailTiyin: newRetail,
    computedAt: now,
  }
}

/** Check the breakdown invariant: base + adjust rows === total === suggestedTiyin */
export function breakdownIsConsistent(s: PriceSuggestion): boolean {
  const total = s.breakdown.find((r) => r.kind === 'total')
  if (!total) return false
  const sum = s.breakdown.filter((r) => r.kind !== 'total').reduce((a, r) => a + r.amountTiyin, 0)
  return sum === total.amountTiyin && total.amountTiyin === s.suggestedTiyin
}

export type QueueChip = 'overpriced' | 'fair' | 'low_data' | 'imei_issue'

/** Admin moderation queue chip, most severe first. */
export function classifyQueue(listing: Listing): QueueChip {
  const flags = listing.suggestion?.flags
  if (!flags) return 'low_data'
  if (flags.includes('imei_issue')) return 'imei_issue'
  if (flags.includes('low_data')) return 'low_data'
  if (flags.includes('overpriced')) return 'overpriced'
  return 'fair'
}

export interface HistogramBin { fromTiyin: Tiyin; toTiyin: Tiyin; count: number; weight: number }

export function priceHistogram(comparables: Comparable[], bins = 8): HistogramBin[] {
  if (!comparables.length || bins <= 0) return []
  const prices = comparables.map((c) => c.priceTiyin)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return [{ fromTiyin: min, toTiyin: max, count: comparables.length, weight: comparables.reduce((a, c) => a + c.weight, 0) }]
  const width = Math.ceil((max - min) / bins)
  const out: HistogramBin[] = Array.from({ length: bins }, (_, i) => ({
    fromTiyin: min + i * width, toTiyin: i === bins - 1 ? max : min + (i + 1) * width, count: 0, weight: 0,
  }))
  for (const c of comparables) {
    const idx = Math.min(bins - 1, Math.floor((c.priceTiyin - min) / width))
    out[idx].count += 1
    out[idx].weight += c.weight
  }
  return out
}
