/**
 * Demo-clock helpers. All functions work in the browser's local time and
 * return ISO strings WITHOUT a timezone suffix ("2026-09-27T14:32:00"),
 * so the same string reads the same on every screen of the demo.
 */
import { format } from 'date-fns'
import { uz } from 'date-fns/locale'
import type { ISODate } from './types'

export const DAY_MS = 86_400_000
export const HOUR_MS = 3_600_000

const pad = (n: number) => String(n).padStart(2, '0')

export function parseIso(iso: ISODate): Date {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) throw new Error(`Noto'g'ri sana: ${iso}`)
  return d
}

/** Local-time ISO without offset: 2026-09-27T14:32:00 */
export function toIso(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseIso(iso)
  d.setDate(d.getDate() + n)
  return toIso(d)
}

export function addHours(iso: ISODate, h: number): ISODate {
  return toIso(new Date(parseIso(iso).getTime() + h * HOUR_MS))
}

export function addMinutes(iso: ISODate, m: number): ISODate {
  return toIso(new Date(parseIso(iso).getTime() + m * 60_000))
}

export function setHour(iso: ISODate, h: number, m = 0): ISODate {
  const d = parseIso(iso)
  d.setHours(h, m, 0, 0)
  return toIso(d)
}

export function isFriday(iso: ISODate): boolean {
  return parseIso(iso).getDay() === 5
}

/** "27 sen, 14:32" */
export function formatDemoTime(iso: ISODate): string {
  const d = parseIso(iso)
  const day = format(d, 'd', { locale: uz })
  const month = format(d, 'MMM', { locale: uz }).toLowerCase().replace(/\.$/, '')
  return `${day}-${month}, ${format(d, 'HH:mm')}`
}

/** Kechki partiya identifikatori odam tilida: M-20260924 → «24-sen partiyasi» (ID o'zgarmaydi, faqat ko'rinish) */
export function manifestLabel(id: string): string {
  const m = /^M-(\d{4})(\d{2})(\d{2})$/.exec(id)
  if (!m) return id
  return `${formatDemoTime(`${m[1]}-${m[2]}-${m[3]}T00:00:00`).replace(/, 00:00$/, '')} partiyasi`
}

/** "27 sentabr" */
export function formatDemoDate(iso: ISODate): string {
  const d = parseIso(iso)
  return `${format(d, 'd')} ${format(d, 'MMMM', { locale: uz }).toLowerCase()}`
}

/** YYYY-MM-DD (local) */
export function dateKey(iso: ISODate): string {
  const d = parseIso(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Signed hours (1 decimal) from `iso` until `hour`:00 of the same local day. Negative when already past. */
export function hoursUntil(iso: ISODate, hour: number, minute = 0): number {
  const from = parseIso(iso)
  const target = parseIso(setHour(iso, hour, minute))
  return Math.round(((target.getTime() - from.getTime()) / HOUR_MS) * 10) / 10
}

/** The upcoming Friday (today if `iso` is already a Friday), same time of day. */
export function nextFriday(iso: ISODate): ISODate {
  const d = parseIso(iso)
  const diff = (5 - d.getDay() + 7) % 7
  return addDays(iso, diff)
}

/** Whole days from a to b (floor). Negative if b is before a. */
export function daysBetween(a: ISODate, b: ISODate): number {
  const ms = parseIso(b).getTime() - parseIso(a).getTime()
  return Math.floor(ms / DAY_MS)
}

/** Fractional age in days of `iso` relative to `now`. */
export function ageDays(iso: ISODate, now: ISODate): number {
  return (parseIso(now).getTime() - parseIso(iso).getTime()) / DAY_MS
}

export function startOfDay(iso: ISODate): ISODate {
  return setHour(iso, 0, 0)
}

export function isSameDay(a: ISODate, b: ISODate): boolean {
  return dateKey(a) === dateKey(b)
}
