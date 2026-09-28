import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { LoaderCircle } from 'lucide-react'
import { cn, SPRING } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  children?: ReactNode
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-card border border-ink font-semibold hover:opacity-95',
  gold: 'bg-gold-fill text-ink border border-transparent font-semibold shadow-[0_8px_18px_-8px_rgba(245,180,0,.75)] hover:brightness-[1.04]',
  secondary: 'bg-card text-ink border border-line font-medium hover:bg-paper-2',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-paper-2',
  danger: 'bg-brick text-paper border border-brick hover:opacity-95',
  link: 'bg-transparent text-blue border border-transparent underline-offset-4 hover:underline px-0 h-auto',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 min-h-[36px] px-3 text-[13px] gap-1.5 rounded-[10px]',
  md: 'h-11 min-h-[44px] px-4 text-[14px] gap-2 rounded-[12px]',
  lg: 'h-13 min-h-[52px] px-5 text-[15px] gap-2 rounded-[14px]',
  icon: 'h-11 w-11 min-h-[44px] p-0 rounded-[12px] justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, leading, trailing, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const reduce = useReducedMotion()
  const isDisabled = disabled || loading
  return (
    <motion.button
      ref={ref}
      type={type}
      data-size={size}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileTap={isDisabled || reduce ? undefined : { scale: 0.97 }}
      transition={SPRING}
      className={cn(
        'relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium leading-none',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT[variant],
        variant === 'link' ? 'h-auto min-h-0 px-0 text-[14px]' : SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <LoaderCircle
          className="absolute h-[1.1em] w-[1.1em] animate-spin"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      )}
      <span className={cn('inline-flex items-center gap-[inherit]', loading && 'invisible')}>
        {leading && <span className="inline-flex shrink-0 [&>svg]:h-[1.15em] [&>svg]:w-[1.15em]">{leading}</span>}
        {children}
        {trailing && <span className="inline-flex shrink-0 [&>svg]:h-[1.15em] [&>svg]:w-[1.15em]">{trailing}</span>}
      </span>
    </motion.button>
  )
})

export interface IconButtonProps extends Omit<ButtonProps, 'size' | 'leading' | 'trailing' | 'fullWidth'> {
  'aria-label': string
  /** default 44px; `sm` = 36px */
  size?: 'sm' | 'md'
}

/** Square icon-only button; aria-label is required. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', variant = 'ghost', className, children, ...rest },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      className={cn(size === 'sm' && 'h-9 w-9 min-h-[36px] rounded-[10px]', '[&_svg]:h-5 [&_svg]:w-5', className)}
      {...rest}
    >
      {children}
    </Button>
  )
})
