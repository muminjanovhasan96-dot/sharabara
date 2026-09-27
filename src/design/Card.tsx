import { forwardRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { cn, SPRING } from '@/lib/utils'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
const PAD: Record<CardPadding, string> = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' }

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  padding?: CardPadding
  /** hover lift + press scale; sets role=button when onClick is provided */
  interactive?: boolean
  children?: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'md', interactive = false, className, children, onClick, ...rest },
  ref,
) {
  const reduce = useReducedMotion()
  const clickable = interactive && Boolean(onClick)
  return (
    <motion.div
      ref={ref}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                ;(e.currentTarget as HTMLDivElement).click()
              }
            }
          : undefined
      }
      whileHover={interactive && !reduce ? { y: -1 } : undefined}
      whileTap={interactive && !reduce ? { scale: 0.97 } : undefined}
      transition={SPRING}
      className={cn(
        'bg-card rounded-card border border-line shadow-soft text-ink',
        PAD[padding],
        interactive && 'cursor-pointer transition-colors hover:border-line-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  )
})

export interface InkCardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
}

/** Dark ink card with paper text — price offer, Mall banner. Theme-independent (always ink). */
export const InkCard = forwardRef<HTMLDivElement, InkCardProps>(function InkCard(
  { padding = 'md', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('rounded-card shadow-soft', PAD[padding], className)}
      style={{ background: '#1A2430', color: '#F3EDE0', ...rest.style }}
      {...rest}
    >
      {children}
    </div>
  )
})

export interface BentoGridProps extends HTMLAttributes<HTMLDivElement> {
  /** column count at md+ (mobile is always 2) */
  cols?: 2 | 3 | 4 | 6
  gap?: 'sm' | 'md'
}

/** Dense bento layout; children use `col-span-*` / `row-span-*` utilities. */
export const BentoGrid = forwardRef<HTMLDivElement, BentoGridProps>(function BentoGrid(
  { cols = 4, gap = 'md', className, children, ...rest },
  ref,
) {
  const colsClass = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 6: 'md:grid-cols-6' }[cols]
  return (
    <div
      ref={ref}
      className={cn('grid grid-cols-2 auto-rows-[minmax(120px,auto)]', colsClass, gap === 'sm' ? 'gap-2' : 'gap-3 md:gap-4', className)}
      {...rest}
    >
      {children}
    </div>
  )
})

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: ReactNode
  title?: ReactNode
  actions?: ReactNode
}

export function CardHeader({ eyebrow, title, actions, className, children, ...rest }: CardHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-start justify-between gap-3', className)} {...rest}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        {title && <h3 className="font-display text-[17px] leading-tight text-ink">{title}</h3>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  )
}
