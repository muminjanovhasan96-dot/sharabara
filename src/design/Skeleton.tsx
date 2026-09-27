import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string
  height?: number | string
  round?: boolean
}

export function Skeleton({ width, height = 14, round = false, className, style, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton', round && 'rounded-full', className)}
      style={{ width, height, ...style }}
      {...rest}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}

/** Product card shape: image block + title + price. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-card border border-line bg-card p-2', className)} aria-hidden="true">
      <Skeleton height="auto" className="aspect-square w-full rounded-[10px]" />
      <div className="mt-2 flex flex-col gap-1.5 px-1 pb-1">
        <Skeleton height={12} width="85%" />
        <Skeleton height={12} width="55%" />
        <Skeleton height={16} width="45%" className="mt-1" />
      </div>
    </div>
  )
}

/** Table rows skeleton (matches DataTable dense 40px rows). */
export function SkeletonRows({ rows = 6, cols = 5, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('divide-y divide-line', className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex h-10 items-center gap-4 px-3">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} height={10} style={{ flex: c === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  )
}
