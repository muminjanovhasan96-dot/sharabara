import { useId } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn, SPRING, haptic } from '@/lib/utils'

export interface SegmentedOption<V extends string = string> {
  value: V
  label?: ReactNode
  icon?: ReactNode
  /** required when only an icon is given */
  ariaLabel?: string
  disabled?: boolean
}

export interface SegmentedProps<V extends string = string> {
  options: SegmentedOption<V>[]
  value: V
  onChange: (v: V) => void
  size?: 'sm' | 'md'
  fullWidth?: boolean
  className?: string
  'aria-label'?: string
}

/** Small segmented control (grid/list toggle etc.). */
export function Segmented<V extends string = string>({ options, value, onChange, size = 'sm', fullWidth = false, className, ...rest }: SegmentedProps<V>) {
  const id = useId()
  const reduce = useReducedMotion()
  return (
    <div
      role="radiogroup"
      aria-label={rest['aria-label']}
      className={cn('inline-flex items-stretch gap-0.5 rounded-[10px] border border-line bg-paper-2 p-0.5', fullWidth && 'flex w-full', className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel}
            disabled={o.disabled}
            onClick={() => { if (!active) { haptic(6); onChange(o.value) } }}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 rounded-[8px] px-2.5 font-medium outline-none transition-colors',
              'focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50',
              size === 'sm' ? 'h-8 min-w-8 text-[13px]' : 'h-10 min-h-[40px] min-w-10 text-[14px]',
              active ? 'text-ink' : 'text-ink-2 hover:text-ink',
              fullWidth && 'flex-1',
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-thumb`}
                className="absolute inset-0 rounded-[8px] bg-card shadow-soft"
                transition={reduce ? { duration: 0 } : SPRING}
                aria-hidden="true"
              />
            )}
            <span className="relative inline-flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4">
              {o.icon}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
