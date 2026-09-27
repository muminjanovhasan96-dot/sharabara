import { forwardRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type LedgerTone = 'default' | 'brick' | 'green' | 'gold' | 'muted'
const TONE: Record<LedgerTone, string> = {
  default: 'text-ink', brick: 'text-brick', green: 'text-green', gold: 'text-gold', muted: 'text-ink-3',
}

export interface LedgerRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode
  value: ReactNode
  /** bold total row */
  emphasis?: boolean
  tone?: LedgerTone
  /** secondary line under the label */
  sub?: ReactNode
  /** hide the dotted leader */
  noDots?: boolean
}

/** key ··· value with dotted leader. */
export const LedgerRow = forwardRef<HTMLDivElement, LedgerRowProps>(function LedgerRow(
  { label, value, emphasis = false, tone = 'default', sub, noDots = false, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('py-2', className)} {...rest}>
      <div className={cn('flex items-baseline gap-0 text-[14px]', emphasis && 'font-display text-[16px] font-bold')}>
        <span className={cn('min-w-0 shrink leading-snug', emphasis ? 'text-ink' : 'text-ink-2')}>{label}</span>
        {noDots ? <span className="flex-1" /> : <span className="ledger-dots" aria-hidden="true" />}
        <span className={cn('tnum shrink-0 text-right', TONE[tone], emphasis && tone === 'default' && 'text-ink')} data-money="">
          {value}
        </span>
      </div>
      {sub && <div className="mt-0.5 text-[12px] text-ink-3">{sub}</div>}
    </div>
  )
})

export interface LedgerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** optional eyebrow heading */
  title?: ReactNode
  /** wrap in a card-like inset */
  inset?: boolean
}

/** Groups LedgerRows with hairline separators. */
export function Ledger({ title, inset = false, className, children, ...rest }: LedgerProps) {
  return (
    <div className={cn(inset && 'rounded-card border border-line bg-card px-4 py-1', className)} {...rest}>
      {title && <div className="eyebrow pt-2">{title}</div>}
      <div className="divide-y divide-line">{children}</div>
    </div>
  )
}
