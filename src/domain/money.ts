import type { Tiyin } from './types'

const NBSP_THIN = ' ' // narrow no-break space

export const TIYIN_PER_SUM = 100

export function assertTiyin(v: number, label = 'amount'): asserts v is Tiyin {
  if (!Number.isInteger(v)) throw new Error(`${label} must be an integer tiyin value, got ${v}`)
}

export function sumToTiyin(sum: number): Tiyin {
  const t = Math.round(sum * TIYIN_PER_SUM)
  return t
}

export function tiyinToSum(t: Tiyin): number {
  assertTiyin(t)
  return t / TIYIN_PER_SUM
}

/** Integer percentage math: returns round(t * rate) as tiyin. rate is a plain number like 0.03 */
export function mulRate(t: Tiyin, rate: number): Tiyin {
  assertTiyin(t)
  // rate expressed in basis points (1/10000) to keep integer math exact
  const bps = Math.round(rate * 10_000)
  return Math.round((t * bps) / 10_000)
}

/** Round to nearest step (in tiyin), e.g. 50 000 so'm = 5 000 000 tiyin */
export function roundToStep(t: Tiyin, stepTiyin: Tiyin): Tiyin {
  assertTiyin(t); assertTiyin(stepTiyin)
  if (stepTiyin <= 0) return t
  return Math.round(t / stepTiyin) * stepTiyin
}

export function groupDigits(n: number, sep = NBSP_THIN): string {
  const s = Math.abs(Math.trunc(n)).toString()
  const out = s.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
  return n < 0 ? `−${out}` : out
}

export interface FormatOpts { withCurrency?: boolean; sign?: boolean; compact?: boolean }

/** 620000000 tiyin -> "6 200 000 so'm" */
export function formatMoney(t: Tiyin, opts: FormatOpts = {}): string {
  const { withCurrency = true, sign = false, compact = false } = opts
  assertTiyin(t)
  const sums = Math.trunc(t / TIYIN_PER_SUM)
  let body: string
  if (compact && Math.abs(sums) >= 1_000_000) {
    const m = sums / 1_000_000
    body = `${m.toFixed(m >= 100 ? 0 : 1).replace(/\.0$/, '').replace('.', ',')}${NBSP_THIN}mln`
  } else if (compact && Math.abs(sums) >= 10_000) {
    body = `${groupDigits(Math.round(sums / 1000))}${NBSP_THIN}ming`
  } else {
    body = groupDigits(sums)
  }
  const prefix = sign && t > 0 ? '+' : ''
  return `${prefix}${body}${withCurrency ? `${NBSP_THIN}so'm` : ''}`
}

/** Short money used in tight UI: "6,2 mln" */
export function formatMoneyCompact(t: Tiyin): string {
  return formatMoney(t, { compact: true, withCurrency: false })
}

/** Parse user input like "6 200 000" or "6200000" (so'm) into tiyin */
export function parseSumInput(s: string): Tiyin | null {
  const digits = s.replace(/[^\d]/g, '')
  if (!digits) return null
  return Number(digits) * TIYIN_PER_SUM
}

export function percent(delta: number, digits = 0): string {
  const v = Math.round(delta * 100 * 10 ** digits) / 10 ** digits
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}%`
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

/** Weighted median: values with weights; returns integer */
export function weightedMedian(items: { value: number; weight: number }[]): number {
  if (!items.length) return 0
  const s = [...items].sort((a, b) => a.value - b.value)
  const total = s.reduce((a, b) => a + b.weight, 0)
  let acc = 0
  for (const it of s) {
    acc += it.weight
    if (acc >= total / 2) return Math.round(it.value)
  }
  return Math.round(s[s.length - 1].value)
}

export function quantile(values: number[], q: number): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const pos = (s.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  return s[base + 1] !== undefined ? s[base] + rest * (s[base + 1] - s[base]) : s[base]
}
