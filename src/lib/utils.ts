import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SPRING = { type: 'spring', stiffness: 420, damping: 34 } as const
export const SPRING_SOFT = { type: 'spring', stiffness: 260, damping: 30 } as const

export function haptic(ms = 12) {
  try { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms) } catch { /* noop */ }
}

export function uid(prefix = ''): string {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase()
  return prefix ? `${prefix}-${r}` : r
}

export function pad(n: number, len = 2) { return String(n).padStart(len, '0') }

export function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)) }
