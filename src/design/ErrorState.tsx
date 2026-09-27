import type { HTMLAttributes, ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { Button } from './Button'

export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  hint?: ReactNode
  retryLabel?: string
  onRetry?: () => void
  compact?: boolean
}

export function ErrorState({
  title = uz.app.error, hint = uz.app.errorHint, retryLabel = uz.app.retry, onRetry, compact = false, className, ...rest
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-brick/25 bg-brick/6 text-center',
        compact ? 'gap-2 px-4 py-5' : 'gap-3 px-6 py-10',
        className,
      )}
      {...rest}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-brick/60 text-brick">
        <TriangleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="font-display text-[16px] text-brick">{title}</div>
      {hint && <p className="max-w-[34ch] text-[13px] leading-snug text-ink-2">{hint}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leading={<RefreshCw strokeWidth={1.75} />} className="mt-1">
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
