import type { DataSnapshot, RegionId, Tiyin } from '@/domain/types'
import { formatDemoTime, parseIso } from '@/domain/clock'
import { A, tt } from '../strings'

export function ago(iso: string, now: string): string {
  const ms = parseIso(now).getTime() - parseIso(iso).getTime()
  const m = Math.round(ms / 60000)
  if (m < 1) return A.common.justNow
  if (m < 60) return tt(A.common.ago, { t: `${m} ${A.common.minutes}` })
  const h = Math.floor(m / 60)
  if (h < 48) return tt(A.common.ago, { t: `${h} ${A.common.hours}` })
  return tt(A.common.ago, { t: `${Math.floor(h / 24)} ${A.common.days}` })
}
/** "2 soat", "35 daqiqa", "hozirgina", "3 kun" — navbatda kutish (qisqartmasiz) */
export function waitFor(iso: string | undefined, now: string): string {
  if (!iso) return '—'
  const m = Math.max(0, Math.round((parseIso(now).getTime() - parseIso(iso).getTime()) / 60000))
  if (m < 1) return A.common.justNow
  if (m < 60) return `${m} ${A.common.minutes}`
  const h = Math.floor(m / 60)
  if (h >= 48) return `${Math.floor(h / 24)} ${A.common.days}`
  return `${h} ${A.common.hours}`
}
/** ISO sana (yyyy-mm-dd yoki to'liq) → "25-sen, 11:00" / "25-sen" */
export function fmtDate(iso: string | undefined): string {
  if (!iso) return '—'
  return iso.length <= 10 ? formatDemoTime(`${iso}T00:00:00`).replace(/, 00:00$/, '') : formatDemoTime(iso)
}
export function fmtTime(iso: string | undefined): string { return iso ? formatDemoTime(iso) : '—' }
export function pctStr(v: number, digits = 0): string { return `${(v * 100).toFixed(digits).replace('.', ',')}%` }
export function signedPct(v: number, digits = 1): string { const s = (v * 100).toFixed(digits).replace('.', ','); return `${v > 0 ? '+' : v < 0 ? '−' : ''}${s.replace('-', '')}%` }
export function regionName(d: Pick<DataSnapshot, 'regions'>, id: RegionId | string | undefined): string { return d.regions.find((r) => r.id === id)?.name ?? '—' }
export function branchOf(d: Pick<DataSnapshot, 'branches'>, id: string | undefined) { return d.branches.find((b) => b.id === id) }
export function categoryName(d: Pick<DataSnapshot, 'categories'>, id: string | undefined): string { return d.categories.find((c) => c.id === id)?.name ?? '—' }
export function userName(d: Pick<DataSnapshot, 'users'>, id: string | undefined): string { return d.users.find((u) => u.id === id)?.name ?? id ?? '—' }
export function staffName(d: Pick<DataSnapshot, 'staff'>, id: string | undefined): string { return d.staff.find((u) => u.id === id)?.name ?? id ?? '—' }
export function sum(xs: number[]): Tiyin { return xs.reduce((a, b) => a + b, 0) }
export function mean(xs: number[]): number { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0 }
export function sellerLabel(d: Pick<DataSnapshot, 'users' | 'companies'>, key: string): string {
  if (key.startsWith('c:')) return d.companies.find((c) => c.id === key.slice(2))?.name ?? key
  return userName(d, key.slice(2))
}
export function csvDate(iso: string): string { return iso.slice(0, 16).replace('T', ' ') }
