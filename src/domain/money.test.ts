import { describe, it, expect } from 'vitest'
import {
  assertTiyin, sumToTiyin, tiyinToSum, mulRate, roundToStep, groupDigits, formatMoney, formatMoneyCompact, parseSumInput,
  percent, median, weightedMedian, quantile,
} from './money'

const NB = '\u202f' // narrow no-break space used by money.ts

describe('money', () => {
  it('assert / conversions', () => {
    expect(() => assertTiyin(1.5)).toThrow(/integer/)
    expect(() => assertTiyin(10)).not.toThrow()
    expect(sumToTiyin(6_200_000)).toBe(620_000_000)
    expect(sumToTiyin(0.5)).toBe(50)
    expect(tiyinToSum(620_000_000)).toBe(6_200_000)
    expect(() => tiyinToSum(1.2)).toThrow()
  })
  it('mulRate is exact in basis points', () => {
    expect(mulRate(620_000_000, 0.03)).toBe(18_600_000)
    expect(mulRate(690_000_000, 0.95)).toBe(655_500_000)
    expect(mulRate(1, 0.5)).toBe(1) // rounds half up
    expect(() => mulRate(1.1, 0.1)).toThrow()
  })
  it('roundToStep', () => {
    expect(roundToStep(622_250_000, 5_000_000)).toBe(620_000_000)
    expect(roundToStep(655_500_000, 5_000_000)).toBe(655_000_000)
    expect(roundToStep(123, 0)).toBe(123)
    expect(() => roundToStep(1.5, 10)).toThrow()
  })
  it('groupDigits', () => {
    expect(groupDigits(6200000)).toBe(`6${NB}200${NB}000`)
    expect(groupDigits(-350000)).toBe(`−350${NB}000`)
    expect(groupDigits(999, ',')).toBe('999')
    expect(groupDigits(1234567, ',')).toBe('1,234,567')
  })
  it('formatMoney variants', () => {
    expect(formatMoney(620_000_000)).toBe(`6${NB}200${NB}000${NB}so'm`)
    expect(formatMoney(620_000_000, { withCurrency: false })).toBe(`6${NB}200${NB}000`)
    expect(formatMoney(1_000, { sign: true })).toBe(`+10${NB}so'm`)
    expect(formatMoney(-3_500_000, { sign: true })).toBe(`−35${NB}000${NB}so'm`)
    expect(formatMoney(620_000_000, { compact: true })).toBe(`6,2${NB}mln${NB}so'm`)
    expect(formatMoney(600_000_000, { compact: true, withCurrency: false })).toBe(`6${NB}mln`)
    expect(formatMoney(12_345_000_000, { compact: true, withCurrency: false })).toBe(`123${NB}mln`)
    expect(formatMoney(3_900_000, { compact: true, withCurrency: false })).toBe(`39${NB}ming`)
    expect(formatMoney(900_000, { compact: true, withCurrency: false })).toBe(`9${NB}000`)
    expect(formatMoneyCompact(620_000_000)).toBe(`6,2${NB}mln`)
    expect(() => formatMoney(0.5)).toThrow()
  })
  it('parseSumInput', () => {
    expect(parseSumInput('6 200 000')).toBe(620_000_000)
    expect(parseSumInput("6200000 so'm")).toBe(620_000_000)
    expect(parseSumInput('abc')).toBeNull()
    expect(parseSumInput('')).toBeNull()
  })
  it('percent', () => {
    expect(percent(0.05)).toBe('+5%')
    expect(percent(-0.0646, 1)).toBe('−6.5%')
    expect(percent(0)).toBe('0%')
  })
  it('median / weightedMedian / quantile', () => {
    expect(median([])).toBe(0)
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(3)
    expect(weightedMedian([])).toBe(0)
    expect(weightedMedian([{ value: 1, weight: 1 }, { value: 10, weight: 1 }, { value: 100, weight: 1 }])).toBe(10)
    expect(weightedMedian([{ value: 1, weight: 0.1 }, { value: 10, weight: 0.1 }, { value: 100, weight: 5 }])).toBe(100)
    expect(weightedMedian([{ value: 5.4, weight: 0 }])).toBe(5)
    expect(quantile([], 0.5)).toBe(0)
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5)
    expect(quantile([1, 2, 3, 4], 1)).toBe(4)
    expect(quantile([7], 0.25)).toBe(7)
  })
})
