/**
 * Platform fee engine. Category rule beats default rule; first rule whose
 * [minTiyin, maxTiyin) contains the price wins. Integer tiyin only.
 */
import type { FeeOverride, FeeResult, FeeRule, FeeRuleSet, Id, Tiyin } from '../types'
import { assertTiyin, mulRate } from '../money'

const S = 100

export function defaultFeeRules(): FeeRule[] {
  return [
    { id: 'fr-1', minTiyin: 0, maxTiyin: 500_000 * S, type: 'fixed', fixedTiyin: 15_000 * S, categoryId: null },
    { id: 'fr-2', minTiyin: 500_000 * S, maxTiyin: 3_000_000 * S, type: 'percent', rate: 0.04, categoryId: null },
    { id: 'fr-3', minTiyin: 3_000_000 * S, maxTiyin: 10_000_000 * S, type: 'percent', rate: 0.03, categoryId: null },
    { id: 'fr-4', minTiyin: 10_000_000 * S, maxTiyin: null, type: 'percent_capped', rate: 0.02, capTiyin: 500_000 * S, categoryId: null },
  ]
}

function inRange(rule: FeeRule, price: Tiyin): boolean {
  return price >= rule.minTiyin && (rule.maxTiyin === null || price < rule.maxTiyin)
}

export function findRule(priceTiyin: Tiyin, categoryId: Id | null | undefined, rules: FeeRule[]): FeeRule | null {
  const candidates = rules.filter((r) => inRange(r, priceTiyin))
  if (categoryId) {
    const specific = candidates.find((r) => r.categoryId === categoryId)
    if (specific) return specific
  }
  return candidates.find((r) => r.categoryId === null || r.categoryId === undefined) ?? null
}

export function feeFromRule(priceTiyin: Tiyin, rule: FeeRule): Tiyin {
  switch (rule.type) {
    case 'fixed':
      return rule.fixedTiyin ?? 0
    case 'percent':
      return mulRate(priceTiyin, rule.rate ?? 0)
    case 'percent_capped': {
      const raw = mulRate(priceTiyin, rule.rate ?? 0)
      return rule.capTiyin !== undefined ? Math.min(raw, rule.capTiyin) : raw
    }
  }
}

export function calcFee(priceTiyin: Tiyin, categoryId: Id | null | undefined, ruleSet: FeeRuleSet | FeeRule[]): FeeResult {
  assertTiyin(priceTiyin, 'priceTiyin')
  const rules = Array.isArray(ruleSet) ? ruleSet : ruleSet.rules
  const rule = findRule(priceTiyin, categoryId, rules)
  if (!rule) throw new Error(`Komissiya qoidasi topilmadi: ${priceTiyin} tiyin, kategoriya ${categoryId ?? '—'}`)
  const feeTiyin = feeFromRule(priceTiyin, rule)
  const result: FeeResult = { feeTiyin, ruleId: rule.id, sellerGetsTiyin: priceTiyin - feeTiyin }
  if (rule.rate !== undefined) result.rate = rule.rate
  return result
}

/** Replace the automatic fee by a manual override; seller gets price − override. */
export function applyOverride(result: FeeResult, override: FeeOverride): FeeResult {
  assertTiyin(override.amountTiyin, 'override.amountTiyin')
  const price = result.feeTiyin + result.sellerGetsTiyin
  return { feeTiyin: override.amountTiyin, ruleId: `${result.ruleId}:override`, sellerGetsTiyin: price - override.amountTiyin }
}

export function makeOverride(result: FeeResult, amountTiyin: Tiyin, reason: string, by: Id, at: string): FeeOverride {
  return { amountTiyin, reason, by, at, originalTiyin: result.feeTiyin }
}

export function publishedRuleSet(sets: FeeRuleSet[]): FeeRuleSet | null {
  return [...sets].filter((s) => s.status === 'published').sort((a, b) => b.version - a.version)[0] ?? null
}

/** Compute a fee with a specific rule-set version (for historical orders / comparisons). */
export function feeForRuleSetVersion(sets: FeeRuleSet[], version: number, priceTiyin: Tiyin, categoryId?: Id | null): FeeResult {
  const set = sets.find((s) => s.version === version)
  if (!set) throw new Error(`Komissiya to'plami v${version} topilmadi`)
  return calcFee(priceTiyin, categoryId, set)
}

export interface FeeSimulation extends FeeResult {
  priceTiyin: Tiyin
  effectiveRate: number // 0.03
  rule: FeeRule
}

/** For the fee calculator screen: result + the rule that fired + effective rate. */
export function simulateFee(priceTiyin: Tiyin, ruleSet: FeeRuleSet | FeeRule[], categoryId?: Id | null): FeeSimulation {
  const rules = Array.isArray(ruleSet) ? ruleSet : ruleSet.rules
  const res = calcFee(priceTiyin, categoryId, rules)
  const rule = rules.find((r) => r.id === res.ruleId)!
  const effectiveRate = priceTiyin > 0 ? Math.round((res.feeTiyin / priceTiyin) * 10_000) / 10_000 : 0
  return { ...res, priceTiyin, effectiveRate, rule }
}

/** Compare two rule sets across a price ladder (for the v1 → v2 draft diff view). */
export function compareRuleSets(a: FeeRuleSet, b: FeeRuleSet, pricesTiyin: Tiyin[], categoryId?: Id | null): { priceTiyin: Tiyin; feeA: Tiyin; feeB: Tiyin; deltaTiyin: Tiyin }[] {
  return pricesTiyin.map((p) => {
    const feeA = calcFee(p, categoryId, a).feeTiyin
    const feeB = calcFee(p, categoryId, b).feeTiyin
    return { priceTiyin: p, feeA, feeB, deltaTiyin: feeB - feeA }
  })
}
