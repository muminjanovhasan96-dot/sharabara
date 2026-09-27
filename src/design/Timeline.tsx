import type { HTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TimelineStep {
  label: ReactNode
  /** formatted time string */
  at?: string
  done?: boolean
  active?: boolean
  note?: ReactNode
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  steps: TimelineStep[]
  compact?: boolean
}

/** Vertical order timeline: green check = done, gold dot = active, hollow = pending. */
export function Timeline({ steps, compact = false, className, ...rest }: TimelineProps) {
  return (
    <ol className={cn('relative m-0 list-none p-0', className)} {...rest}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1
        return (
          <li key={i} className={cn('relative flex gap-3', compact ? 'pb-3' : 'pb-5', last && 'pb-0')} aria-current={s.active ? 'step' : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={cn('absolute left-[9px] top-5 bottom-0 w-px', s.done ? 'bg-green/60' : 'bg-line-strong')}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'relative mt-0.5 inline-flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px] bg-card',
                s.done ? 'border-green bg-green text-paper' : s.active ? 'border-gold' : 'border-line-strong',
              )}
            >
              {s.done ? (
                <Check size={11} strokeWidth={2.25} />
              ) : s.active ? (
                <span className="h-2 w-2 rounded-full bg-gold-fill ring-1 ring-gold" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className={cn(compact ? 'text-[13px]' : 'text-[14px]', s.active ? 'font-semibold text-ink' : s.done ? 'text-ink' : 'text-ink-3')}>
                  {s.label}
                </span>
                {s.at && <span className="tnum shrink-0 text-[12px] text-ink-3">{s.at}</span>}
              </div>
              {s.note && !compact && <div className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{s.note}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
