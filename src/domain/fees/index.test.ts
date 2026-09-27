import { describe, it, expect } from 'vitest'
import {
  calcFee, defaultFeeRules, applyOverride, makeOverride, feeForRuleSetVersion, simulateFee, findRule, feeFromRule,
  publishedRuleSet, compareRuleSets,
} from './index'
import type { FeeRule, FeeRuleSet } from '../types'

const S = 100
const v1: FeeRuleSet = { id: 'frs-1', version: 1, status: 'published', rules: defaultFeeRules(), createdBy: 's-fin', note: 'v1', publishedAt: '2026-08-01T10:00:00' }
const v2: FeeRuleSet = {
  id: 'frs-2', version: 2, status: 'draft', createdBy: 's-fin', note: 'v2',
  rules: [...defaultFeeRules().map((r) => (r.id === 'fr-3' ? { ...r, rate: 0.035 } : r)), { id: 'fr-k', minTiyin: 0, maxTiyin: null, type: 'percent', rate: 0.08, categoryId: 'kiyim' }],
}

describe('calcFee', () => {
  it('golden: 6 200 000 so\'m → 186 000 fee, seller gets 6 014 000', () => {
    const r = calcFee(620_000_000, 'telefonlar', v1)
    expect(r).toEqual({ feeTiyin: 18_600_000, ruleId: 'fr-3', sellerGetsTiyin: 601_400_000, rate: 0.03 })
  })
  it('each tier', () => {
    expect(calcFee(200_000 * S, null, v1)).toMatchObject({ feeTiyin: 15_000 * S, ruleId: 'fr-1' })
    expect(calcFee(499_999 * S, null, v1).ruleId).toBe('fr-1')
    expect(calcFee(500_000 * S, null, v1)).toMatchObject({ feeTiyin: 20_000 * S, ruleId: 'fr-2', rate: 0.04 })
    expect(calcFee(3_000_000 * S, undefined, v1)).toMatchObject({ feeTiyin: 90_000 * S, ruleId: 'fr-3' })
    expect(calcFee(10_000_000 * S, null, v1)).toMatchObject({ feeTiyin: 200_000 * S, ruleId: 'fr-4' })
    expect(calcFee(50_000_000 * S, null, v1)).toMatchObject({ feeTiyin: 500_000 * S, ruleId: 'fr-4' })
    expect(calcFee(0, null, v1).feeTiyin).toBe(15_000 * S)
  })
  it('category rule wins over default; accepts a bare rule array', () => {
    expect(calcFee(1_000_000 * S, 'kiyim', v2)).toMatchObject({ feeTiyin: 80_000 * S, ruleId: 'fr-k' })
    expect(calcFee(1_000_000 * S, 'mebel', v2)).toMatchObject({ feeTiyin: 40_000 * S, ruleId: 'fr-2' })
    expect(calcFee(1_000_000 * S, 'kiyim', v2.rules).ruleId).toBe('fr-k')
  })
  it('throws when no rule matches or price is not integer', () => {
    const only: FeeRule[] = [{ id: 'x', minTiyin: 100, maxTiyin: 200, type: 'fixed', fixedTiyin: 5 }]
    expect(() => calcFee(50, null, only)).toThrow(/Komissiya qoidasi topilmadi/)
    expect(() => calcFee(200, null, only)).toThrow()
    expect(() => calcFee(1.5, null, v1)).toThrow(/integer/)
    expect(findRule(150, 'kiyim', only)?.id).toBe('x') // undefined category = default
    expect(findRule(150, 'kiyim', [{ ...only[0], categoryId: 'mebel' }])).toBeNull()
  })
  it('feeFromRule handles missing optional fields', () => {
    expect(feeFromRule(1000, { id: 'a', minTiyin: 0, maxTiyin: null, type: 'fixed' })).toBe(0)
    expect(feeFromRule(1000, { id: 'a', minTiyin: 0, maxTiyin: null, type: 'percent' })).toBe(0)
    expect(feeFromRule(1000, { id: 'a', minTiyin: 0, maxTiyin: null, type: 'percent_capped', rate: 0.5 })).toBe(500)
    expect(feeFromRule(1000, { id: 'a', minTiyin: 0, maxTiyin: null, type: 'percent_capped', rate: 0.5, capTiyin: 100 })).toBe(100)
  })
})

describe('overrides & helpers', () => {
  const base = calcFee(620_000_000, null, v1)
  it('applyOverride keeps price constant', () => {
    const ov = makeOverride(base, 10_000_000, 'Doimiy mijoz', 's-fin', '2026-09-27T10:00:00')
    expect(ov.originalTiyin).toBe(18_600_000)
    const r = applyOverride(base, ov)
    expect(r.feeTiyin).toBe(10_000_000)
    expect(r.sellerGetsTiyin).toBe(610_000_000)
    expect(r.feeTiyin + r.sellerGetsTiyin).toBe(620_000_000)
    expect(r.ruleId).toBe('fr-3:override')
    expect(() => applyOverride(base, { ...ov, amountTiyin: 0.5 })).toThrow()
  })
  it('feeForRuleSetVersion', () => {
    expect(feeForRuleSetVersion([v1, v2], 1, 620_000_000).feeTiyin).toBe(18_600_000)
    expect(feeForRuleSetVersion([v1, v2], 2, 620_000_000).feeTiyin).toBe(21_700_000)
    expect(() => feeForRuleSetVersion([v1], 9, 100)).toThrow(/v9/)
  })
  it('publishedRuleSet picks latest published', () => {
    expect(publishedRuleSet([v2, v1])?.id).toBe('frs-1')
    expect(publishedRuleSet([v2])).toBeNull()
  })
  it('simulateFee', () => {
    const s = simulateFee(620_000_000, v1)
    expect(s.effectiveRate).toBe(0.03)
    expect(s.rule.id).toBe('fr-3')
    expect(s.priceTiyin).toBe(620_000_000)
    expect(simulateFee(0, v1.rules).effectiveRate).toBe(0)
  })
  it('compareRuleSets', () => {
    const rows = compareRuleSets(v1, v2, [100_000 * S, 620_000_000])
    expect(rows[0].deltaTiyin).toBe(0)
    expect(rows[1].deltaTiyin).toBe(3_100_000)
  })
})
