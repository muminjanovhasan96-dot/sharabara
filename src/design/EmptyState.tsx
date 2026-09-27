import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Seal } from './Seal'

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** lucide kebab name; default "inbox" */
  icon?: string
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ icon = 'inbox', title, hint, action, compact = false, className, ...rest }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'gap-2 py-6' : 'gap-3 py-12', className)} {...rest}>
      <Seal icon={icon} size={compact ? 40 : 56} variant="paper" ticks />
      <div className={cn('font-display text-ink', compact ? 'text-[15px]' : 'text-[17px]')}>{title}</div>
      {hint && <p className="max-w-[28ch] text-[13px] leading-snug text-ink-2">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
