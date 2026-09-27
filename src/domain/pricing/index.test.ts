import { describe, it, expect } from 'vitest'
import {
  suggestPrice, buildComparables, normalizeToA, fromA, confidenceFor, classifyQueue, priceHistogram,
  breakdownIsConsistent, clamp, modelOf, PRICE_STEP,
} from './index'
import type { Category, Comparable, Listing } from '../types'
import { addDays } from '../clock'

const NOW = '2026-09-27T14:32:00'
const cat: Category = {
  id: 'telefonlar', parentId: null, name: 'Telefonlar', icon: 'smartphone', attributes: [],
  discountRate: 0.05, maxNewRatio: 0.85,
  conditionNotes: { A: 'Yangidek', B: 'Yaxshi', C: 'Qoniqarli', D: 'Nuqsonli' },
}
const golden: Listing = {
  id: 'L-58213', sellerId: 'u-seller', categoryId: 'telefonlar', title: 'iPhone 13 Pro, 256 GB, Sierra Blue',
  description: 'Orqa qopqoqda mayda tirnalish', images: ['ill-phone-1'], attributes: {}, imei: '356789104123457',
  regionId: 'toshkent_sh', condition: 'B', askingTiyin: 660_000_000, priceTiyin: 660_000_000, status: 'draft',
  priceVerified: false, createdAt: NOW, stats: { views: 0, saves: 0, chats: 0, viewsByDay: [] },
}

let seq = 0
function comp(priceA: number, cond: 'A' | 'B' | 'C', status: 'sold' | 'published' | 'expired', daysAgo: number, extra: Partial<Listing> = {}): Listing {
  seq += 1
  const published = addDays(NOW, -daysAgo)
  return {
    id: `H-${seq}`, sellerId: `u-${seq}`, categoryId: 'telefonlar', title: `iPhone 13 Pro 256 GB, ${cond} holat`,
    description: '', images: ['ill-phone-2'], attributes: {}, regionId: 'toshkent_sh', condition: cond,
    askingTiyin: fromA(priceA, cond), priceTiyin: fromA(priceA, cond), status, priceVerified: true,
    createdAt: published, submittedAt: published, publishedAt: published,
    soldAt: status === 'sold' ? addDays(published, Math.min(daysAgo, 3)) : undefined,
    stats: { views: 10, saves: 1, chats: 0, viewsByDay: [] },
    ...extra,
  }
}

/** Symmetric weights around 4 sold units at exactly 6 900 000 so'm (A-normalised). */
function goldenHistory(): Listing[] {
  const below = [6_600_000, 6_650_000, 6_700_000, 6_700_000, 6_720_000, 6_750_000, 6_750_000, 6_780_000, 6_800_000, 6_800_000, 6_850_000, 6_850_000, 6_880_000]
  const above = [6_920_000, 6_950_000, 6_950_000, 7_000_000, 7_000_000, 7_050_000, 7_050_000, 7_100_000, 7_100_000, 7_150_000, 7_200_000, 7_200_000, 7_250_000]
  const pattern: ('sold' | 'active' | 'stale')[] = ['sold', 'sold', 'active', 'sold', 'stale', 'sold', 'active', 'sold', 'sold', 'stale', 'sold', 'active', 'sold']
  const conds: ('A' | 'B' | 'C')[] = ['B', 'A', 'B', 'B', 'C', 'A', 'B', 'B', 'A', 'B', 'B', 'A', 'B']
  const mk = (v: number, i: number) => {
    const kind = pattern[i]
    if (kind === 'sold') return comp(v * 100, conds[i], 'sold', 5 + i)
    if (kind === 'active') return comp(v * 100, conds[i], 'published', 3 + (i % 5))
    return comp(v * 100, conds[i], i % 2 ? 'expired' : 'published', 20 + (i % 8))
  }
  return [
    ...below.map(mk),
    comp(690_000_000, 'A', 'sold', 4), comp(690_000_000, 'A', 'sold', 9), comp(690_000_000, 'B', 'sold', 12), comp(690_000_000, 'A', 'sold', 15),
    ...above.map(mk),
  ]
}

describe('normalizeToA / fromA', () => {
  it('round-trips for step-aligned prices', () => {
    expect(normalizeToA(655_500_000, 'B')).toBe(690_000_000)
    expect(fromA(690_000_000, 'B')).toBe(655_500_000)
    expect(normalizeToA(100, 'A')).toBe(100)
    expect(normalizeToA(fromA(700_000_000, 'C'), 'C')).toBe(700_000_000)
    expect(normalizeToA(fromA(700_000_000, 'D'), 'D')).toBe(700_000_000)
  })
})

describe('suggestPrice — golden path', () => {
  const history = goldenHistory()
  const s = suggestPrice({ listing: golden, category: cat, history, newRetailTiyin: 950_000_000, now: NOW })

  it('produces the exact demo numbers', () => {
    expect(s.marketMedianTiyin).toBe(690_000_000)
    expect(s.suggestedTiyin).toBe(620_000_000)
    const rows = s.breakdown
    expect(rows.map((r) => r.kind)).toEqual(['base', 'adjust', 'adjust', 'total'])
    expect(rows[0].amountTiyin).toBe(690_000_000)
    expect(rows[1]).toMatchObject({ label: 'Holat tuzatmasi (B)', amountTiyin: -35_000_000 })
    expect(rows[2]).toMatchObject({ label: 'Sharabara qoidasi (−5%)', amountTiyin: -35_000_000 })
    expect(rows[3]).toMatchObject({ label: 'Tavsiya etilgan narx', amountTiyin: 620_000_000 })
    expect(breakdownIsConsistent(s)).toBe(true)
  })
  it('confidence 0.85–0.89, n ≥ 10, fair flag', () => {
    expect(s.comparables.length).toBeGreaterThanOrEqual(10)
    expect(s.confidence).toBeGreaterThanOrEqual(0.85)
    expect(s.confidence).toBeLessThanOrEqual(0.89)
    expect(s.flags).toEqual(['fair'])
    expect(s.newRetailTiyin).toBe(950_000_000)
    expect(s.computedAt).toBe(NOW)
  })
  it('comparables carry outcome/weights', () => {
    const sold = s.comparables.filter((c) => c.outcome === 'sold')
    expect(sold.every((c) => c.weight === 1 && typeof c.daysToSell === 'number')).toBe(true)
    expect(s.comparables.some((c) => c.outcome === 'active' && c.weight === 0.6)).toBe(true)
    expect(s.comparables.some((c) => c.outcome === 'stale' && c.weight === 0.3)).toBe(true)
    expect(s.comparables.every((c) => c.daysListed >= 0)).toBe(true)
  })
  it('the invariant holds for every condition and rounding', () => {
    for (const condition of ['A', 'B', 'C', 'D'] as const) {
      const r = suggestPrice({ listing: { ...golden, condition }, category: cat, history, newRetailTiyin: 950_000_000, now: NOW })
      expect(breakdownIsConsistent(r)).toBe(true)
      expect(r.suggestedTiyin % PRICE_STEP).toBe(0)
    }
  })
  it('uses listing.specs when present and reports on the model', () => {
    const withSpecs: Listing = { ...golden, specs: { model: 'iPhone 13 Pro', storage: '256 GB', condition: 'B', conditionNote: '', imagesOriginal: true, confidence: 1 } }
    const r = suggestPrice({ listing: withSpecs, category: cat, history, newRetailTiyin: null, now: NOW })
    expect(r.suggestedTiyin).toBe(620_000_000)
    expect(r.newRetailTiyin).toBeNull()
    expect(modelOf(withSpecs)).toBe('iPhone 13 Pro')
  })
})

describe('suggestPrice — edge cases', () => {
  it('cap binds when new retail is low', () => {
    const history = goldenHistory()
    const r = suggestPrice({ listing: golden, category: cat, history, newRetailTiyin: 600_000_000, now: NOW })
    const capRow = r.breakdown.find((b) => b.label.startsWith('Yangi narx chegarasi'))
    expect(capRow).toBeDefined()
    expect(capRow!.amountTiyin).toBeLessThan(0)
    // 600 000 × 0.85 = 510 000 → × 0.95 = 484 500 → 484 500 (already 50k step? 484 500 -> 500 000 step rounding)
    expect(r.suggestedTiyin).toBe(roundTo(510_000_000 * 0.95))
    expect(breakdownIsConsistent(r)).toBe(true)
    expect(r.flags).toContain('overpriced')
  })
  it('no comparables → fallback from asking price, low_data', () => {
    const r = suggestPrice({ listing: golden, category: cat, history: [], newRetailTiyin: 950_000_000, now: NOW })
    expect(r.comparables).toEqual([])
    expect(r.flags).toContain('low_data')
    expect(r.confidence).toBeLessThanOrEqual(0.4)
    expect(r.suggestedTiyin).toBe(625_000_000) // 6 600 000 × 0.95 = 6 270 000 → 6 250 000
    expect(r.marketMedianTiyin).toBe(660_000_000)
    expect(breakdownIsConsistent(r)).toBe(true)
  })
  it('1–2 comparables → low_data but computed from comparables', () => {
    const history = [comp(700_000_000, 'A', 'sold', 3), comp(700_000_000, 'B', 'published', 2)]
    const r = suggestPrice({ listing: golden, category: cat, history, newRetailTiyin: null, now: NOW })
    expect(r.comparables).toHaveLength(2)
    expect(r.marketMedianTiyin).toBe(700_000_000)
    expect(r.flags).toContain('low_data')
    expect(r.confidence).toBeLessThanOrEqual(0.4)
  })
  it('imei/images flags', () => {
    const r = suggestPrice({ listing: { ...golden, imei: '123', images: ['stock-1'] }, category: cat, history: [], newRetailTiyin: null, now: NOW })
    expect(r.flags).toEqual(expect.arrayContaining(['imei_issue', 'images_suspicious', 'low_data']))
  })
  it('unknown model → no comparables', () => {
    const r = suggestPrice({ listing: { ...golden, title: 'Telefon sotiladi' }, category: cat, history: goldenHistory(), newRetailTiyin: null, now: NOW })
    expect(r.comparables).toEqual([])
  })
  it('underpriced asking gets no fair/overpriced flag', () => {
    const r = suggestPrice({ listing: { ...golden, askingTiyin: 400_000_000 }, category: cat, history: goldenHistory(), newRetailTiyin: null, now: NOW })
    expect(r.flags).toEqual([])
  })
})

describe('buildComparables filters', () => {
  const specs = { model: 'iPhone 13 Pro', storage: '256 GB', condition: 'B' as const, conditionNote: '', imagesOriginal: true, confidence: 1 }
  it('excludes self, wrong status, out-of-window, other storage/model', () => {
    const history = [
      comp(690_000_000, 'A', 'sold', 3, { id: golden.id }),
      comp(690_000_000, 'A', 'sold', 3, { status: 'in_review' }),
      comp(690_000_000, 'A', 'sold', 45),
      comp(690_000_000, 'A', 'sold', -2),
      comp(690_000_000, 'A', 'sold', 3, { title: 'iPhone 13 Pro 128 GB' }),
      comp(690_000_000, 'A', 'sold', 3, { title: 'iPhone 13 128 GB' }),
      comp(690_000_000, 'A', 'sold', 3),
      comp(690_000_000, 'A', 'published', 3, { priceVerified: false }),
      comp(690_000_000, 'A', 'published', 20),
      comp(690_000_000, 'A', 'expired', 10),
      comp(690_000_000, 'A', 'sold', 3, { publishedAt: undefined, submittedAt: undefined }),
    ]
    const out = buildComparables(golden, specs, history, NOW)
    expect(out).toHaveLength(5)
    expect(out.map((c) => c.outcome)).toEqual(['sold', 'active', 'stale', 'stale', 'sold'])
    expect(out[1].weight).toBe(0.45)
  })
  it('no storage in specs → storage not required; no model → nothing', () => {
    const out = buildComparables(golden, { ...specs, storage: undefined }, [comp(1, 'A', 'sold', 3, { title: 'iPhone 13 Pro 128 GB' })], NOW)
    expect(out).toHaveLength(1)
    expect(buildComparables(golden, { ...specs, model: undefined }, [comp(1, 'A', 'sold', 3)], NOW)).toEqual([])
  })
  it('sold without soldAt uses now', () => {
    const out = buildComparables(golden, specs, [comp(1, 'A', 'sold', 6, { soldAt: undefined })], NOW)
    expect(out[0].daysToSell).toBe(6)
  })
})

describe('confidenceFor / clamp', () => {
  it('clamps and handles empty', () => {
    expect(confidenceFor([], 0)).toBe(0.2)
    expect(confidenceFor([100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100], 100)).toBe(0.91)
    expect(confidenceFor([10, 1000, 2000, 5000], 1000)).toBe(0.2)
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
  })
})

describe('classifyQueue', () => {
  const s = suggestPrice({ listing: golden, category: cat, history: [], newRetailTiyin: null, now: NOW })
  it('priority order', () => {
    expect(classifyQueue(golden)).toBe('low_data')
    expect(classifyQueue({ ...golden, suggestion: { ...s, flags: ['imei_issue', 'overpriced'] } })).toBe('imei_issue')
    expect(classifyQueue({ ...golden, suggestion: { ...s, flags: ['low_data', 'overpriced'] } })).toBe('low_data')
    expect(classifyQueue({ ...golden, suggestion: { ...s, flags: ['overpriced'] } })).toBe('overpriced')
    expect(classifyQueue({ ...golden, suggestion: { ...s, flags: ['fair'] } })).toBe('fair')
    expect(classifyQueue({ ...golden, suggestion: { ...s, flags: [] } })).toBe('fair')
  })
})

describe('priceHistogram', () => {
  const mk = (p: number, w = 1): Comparable => ({ listingId: 'x', title: '', condition: 'A', regionId: 'andijon', priceTiyin: p, outcome: 'sold', daysListed: 1, weight: w })
  it('bins prices', () => {
    expect(priceHistogram([])).toEqual([])
    expect(priceHistogram([mk(5)], 0)).toEqual([])
    expect(priceHistogram([mk(5), mk(5, 0.5)])).toEqual([{ fromTiyin: 5, toTiyin: 5, count: 2, weight: 1.5 }])
    const h = priceHistogram([mk(0), mk(10), mk(20), mk(30), mk(40), mk(50), mk(60), mk(70), mk(80)], 4)
    expect(h).toHaveLength(4)
    expect(h.reduce((a, b) => a + b.count, 0)).toBe(9)
    expect(h[3].toTiyin).toBe(80)
    expect(h[0].fromTiyin).toBe(0)
  })
})

function roundTo(v: number): number {
  return Math.round(v / PRICE_STEP) * PRICE_STEP
}
