import type { HTMLAttributes } from 'react'
import { cn, pad } from '@/lib/utils'

export type ProgressTone = 'gold' | 'ink' | 'green' | 'brick' | 'blue'
const TONE: Record<ProgressTone, string> = {
  gold: 'bg-gold', ink: 'bg-ink', green: 'bg-green', brick: 'bg-brick', blue: 'bg-blue',
}

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  tone?: ProgressTone
  size?: 'xs' | 'sm' | 'md'
  label?: string
}

export function Progress({ value, max = 100, tone = 'gold', size = 'sm', label, className, ...rest }: ProgressProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-paper-2', size === 'xs' ? 'h-1' : size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
      {...rest}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', TONE[tone])} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Remaining time between two ISO dates → { totalMs, text: "1:42" | "1:02:05" } */
export function remaining(targetIso: string, nowIso: string): { totalMs: number; text: string } {
  const ms = Math.max(0, new Date(targetIso).getTime() - new Date(nowIso).getTime())
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const text = h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
  return { totalMs: ms, text }
}

export interface CountdownProps extends HTMLAttributes<HTMLSpanElement> {
  /** ISO target */
  target: string
  /** ISO "now" (pure component: pass the clock from the store) */
  now: string
  /** word after the time, e.g. "qoldi" */
  suffix?: string
  /** text when expired */
  expiredText?: string
  /** turn brick when under this many ms; default 60s */
  urgentMs?: number
}

/** "1:42 qoldi" — purely presentational. */
export function Countdown({ target, now, suffix, expiredText, urgentMs = 60_000, className, ...rest }: CountdownProps) {
  const { totalMs, text } = remaining(target, now)
  const expired = totalMs <= 0
  return (
    <span
      className={cn('tnum inline-flex items-baseline gap-1 font-medium', expired ? 'text-ink-3' : totalMs < urgentMs ? 'text-brick' : 'text-ink', className)}
      aria-live="polite"
      {...rest}
    >
      {expired && expiredText ? (
        expiredText
      ) : (
        <>
          <span>{text}</span>
          {suffix && <span className="font-normal text-ink-2">{suffix}</span>}
        </>
      )}
    </span>
  )
}
