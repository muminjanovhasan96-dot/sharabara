import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { percent } from '@/domain/money'
import type { Tiyin } from '@/domain/types'
import { Card } from './Card'
import { AnimatedMoney, AnimatedNumber } from './Money'
import { Sparkline } from './Sparkline'

export interface KpiCardProps {
  /** eyebrow label */
  label: ReactNode
  /** numeric value; rendered as money when `money` is true (value is tiyin) */
  value: number
  money?: boolean
  compact?: boolean
  /** fractional delta vs target/previous, e.g. 0.12 = +12% */
  delta?: number
  /** text after the delta, e.g. "maqsadga nisbatan" */
  deltaLabel?: ReactNode
  /** invert colors (lower is better, e.g. returns) */
  invertDelta?: boolean
  spark?: number[]
  suffix?: ReactNode
  hint?: ReactNode
  onClick?: () => void
  className?: string
  format?: (v: number) => string
}

/** Admin KPI tile: eyebrow, big Bitter number, delta, sparkline. */
export function KpiCard({ label, value, money = false, compact = false, delta, deltaLabel, invertDelta = false, spark, suffix, hint, onClick, className, format }: KpiCardProps) {
  const good = delta === undefined ? null : invertDelta ? delta <= 0 : delta >= 0
  const DeltaIcon = delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <Card interactive={Boolean(onClick)} onClick={onClick} padding="md" className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="eyebrow">{label}</span>
        {spark && spark.length > 1 && <Sparkline values={spark} width={84} height={24} />}
      </div>
      <div className="flex items-baseline gap-1.5">
        {money ? (
          <AnimatedMoney tiyin={value as Tiyin} size="xl" compact={compact} softCurrency />
        ) : (
          <AnimatedNumber value={value} format={format} className="font-display text-[24px] font-bold tracking-[-0.01em] text-ink" />
        )}
        {suffix && <span className="text-[13px] text-ink-3">{suffix}</span>}
      </div>
      {(delta !== undefined || hint) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
          {delta !== undefined && (
            <span className={cn('tnum inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[12px] font-semibold', good === null ? 'bg-paper-2 text-ink-3' : good ? 'bg-green-soft text-green' : 'bg-brick-soft text-brick')}>
              <DeltaIcon size={13} strokeWidth={2} aria-hidden="true" />
              {percent(delta, 1)}
            </span>
          )}
          {deltaLabel && <span className="text-ink-3">{deltaLabel}</span>}
          {hint && <span className="text-ink-3">{hint}</span>}
        </div>
      )}
    </Card>
  )
}
