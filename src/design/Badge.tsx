import { forwardRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'neutral' | 'gold' | 'brick' | 'green' | 'blue' | 'ink' | 'outline'
export type BadgeSize = 'sm' | 'md'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-paper-2 text-ink-2 border-transparent',
  gold: 'bg-gold-soft text-[#8a6400] border-transparent',
  brick: 'bg-brick-soft text-brick border-transparent',
  green: 'bg-green-soft text-green border-transparent',
  blue: 'bg-blue-soft text-blue border-transparent',
  ink: 'bg-ink text-card border-ink',
  outline: 'bg-transparent text-ink-2 border-line-strong',
}
const DOT: Record<BadgeTone, string> = {
  neutral: 'bg-ink-3', gold: 'bg-gold', brick: 'bg-brick', green: 'bg-green', blue: 'bg-blue', ink: 'bg-paper', outline: 'bg-ink-2',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  size?: BadgeSize
  Icon?: LucideIcon
  /** leading status dot */
  dot?: boolean
  children?: ReactNode
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', size = 'md', Icon, dot = false, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-medium leading-none',
        size === 'sm' ? 'h-5 gap-1 px-1.5 text-[11px]' : 'h-6 gap-1.5 px-2.5 text-[12px]',
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT[tone])} aria-hidden="true" />}
      {Icon && <Icon size={size === 'sm' ? 11 : 13} strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </span>
  )
})

export interface StatusDescriptor { tone: BadgeTone; label: string; Icon?: LucideIcon }

export interface StatusBadgeProps extends Omit<BadgeProps, 'tone' | 'children'> {
  status: StatusDescriptor
}

/** Renders a status from a `{ tone, label }` descriptor (build maps in domain/i18n). */
export function StatusBadge({ status, dot = true, ...rest }: StatusBadgeProps) {
  return (
    <Badge tone={status.tone} Icon={status.Icon} dot={!status.Icon && dot} {...rest}>
      {status.label}
    </Badge>
  )
}
