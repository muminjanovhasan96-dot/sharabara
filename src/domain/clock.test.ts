import { describe, it, expect } from 'vitest'
import {
  addDays, addHours, addMinutes, setHour, isFriday, formatDemoTime, formatDemoDate, dateKey,
  hoursUntil, nextFriday, daysBetween, ageDays, startOfDay, isSameDay, parseIso, toIso,
} from './clock'

const NOW = '2026-09-27T14:32:00' // Sunday

describe('clock', () => {
  it('toIso/parseIso round-trip in local time', () => {
    expect(toIso(parseIso(NOW))).toBe(NOW)
    expect(() => parseIso('bu sana emas')).toThrow(/Noto'g'ri sana/)
  })
  it('addDays / addHours / addMinutes', () => {
    expect(addDays(NOW, 1)).toBe('2026-09-28T14:32:00')
    expect(addDays(NOW, -27)).toBe('2026-08-31T14:32:00')
    expect(addHours(NOW, 3)).toBe('2026-09-27T17:32:00')
    expect(addMinutes(NOW, 30)).toBe('2026-09-27T15:02:00')
  })
  it('setHour', () => {
    expect(setHour(NOW, 17)).toBe('2026-09-27T17:00:00')
    expect(setHour(NOW, 9, 15)).toBe('2026-09-27T09:15:00')
  })
  it('isFriday / nextFriday', () => {
    expect(isFriday(NOW)).toBe(false)
    expect(isFriday('2026-09-25T10:00:00')).toBe(true)
    expect(nextFriday(NOW)).toBe('2026-10-02T14:32:00')
    expect(nextFriday('2026-09-25T10:00:00')).toBe('2026-09-25T10:00:00')
  })
  it('formatDemoTime uses uz locale lowercase month', () => {
    expect(formatDemoTime(NOW)).toBe('27-sen, 14:32')
    expect(formatDemoDate(NOW)).toBe('27 sentabr')
  })
  it('dateKey', () => {
    expect(dateKey(NOW)).toBe('2026-09-27')
    expect(dateKey('2026-01-05T00:10:00')).toBe('2026-01-05')
  })
  it('hoursUntil is signed', () => {
    expect(hoursUntil(NOW, 17)).toBeCloseTo(2.5, 1)
    expect(hoursUntil(NOW, 12)).toBeLessThan(0)
    expect(hoursUntil(NOW, 14, 32)).toBe(0)
  })
  it('daysBetween / ageDays', () => {
    expect(daysBetween('2026-09-01T00:00:00', NOW)).toBe(26)
    expect(daysBetween(NOW, '2026-09-01T00:00:00')).toBe(-27)
    expect(ageDays(addDays(NOW, -7), NOW)).toBeCloseTo(7, 5)
  })
  it('startOfDay / isSameDay', () => {
    expect(startOfDay(NOW)).toBe('2026-09-27T00:00:00')
    expect(isSameDay(NOW, startOfDay(NOW))).toBe(true)
    expect(isSameDay(NOW, addDays(NOW, 1))).toBe(false)
  })
})
