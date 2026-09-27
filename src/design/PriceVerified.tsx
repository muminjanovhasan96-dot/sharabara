import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { cn, SPRING } from '@/lib/utils'
import { uz } from '@/i18n/uz'

export interface PriceVerifiedProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  label?: string
  /** e.g. "· bozordan 10% arzon" */
  suffix?: ReactNode
  size?: 'sm' | 'md'
}

/** Green shield-check chip "Narx tekshirilgan" — tappable (opens the price explanation). */
export const PriceVerified = forwardRef<HTMLButtonElement, PriceVerifiedProps>(function PriceVerified(
  { label = uz.listing.priceVerified, suffix, size = 'md', className, onClick, ...rest },
  ref,
) {
  const reduce = useReducedMotion()
  const clickable = Boolean(onClick)
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={!clickable}
      whileTap={clickable && !reduce ? { scale: 0.97 } : undefined}
      transition={SPRING}
      className={cn(
        'inline-flex max-w-full items-center rounded-full border border-green/30 bg-green/10 text-green',
        'font-medium leading-none disabled:cursor-default',
        size === 'sm' ? 'h-6 gap-1 px-2 text-[11px]' : 'h-8 gap-1.5 px-3 text-[12.5px]',
        clickable && 'cursor-pointer hover:bg-green/15',
        className,
      )}
      {...rest}
    >
      <ShieldCheck size={size === 'sm' ? 12 : 15} strokeWidth={1.75} aria-hidden="true" />
      <span className="truncate">{label}</span>
      {suffix && <span className="truncate text-green/80">{suffix}</span>}
    </motion.button>
  )
})
