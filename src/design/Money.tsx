import { forwardRef, useEffect, useRef, useState } from 'react'
import type { HTMLAttributes } from 'react'
import { animate, useMotionValue, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatMoney, groupDigits } from '@/domain/money'
import type { Tiyin } from '@/domain/types'

export type MoneySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'display'
const SIZE: Record<MoneySize, string> = {
  xs: 'text-[12px]',
  sm: 'text-[13px]',
  md: 'text-[15px] font-medium',
  lg: 'text-[18px] font-price font-bold',
  xl: 'text-[24px] font-price font-bold',
  display: 'text-[34px] font-price font-extrabold tracking-[-0.02em]',
}

export interface MoneyProps extends HTMLAttributes<HTMLSpanElement> {
  tiyin: Tiyin
  size?: MoneySize
  /** old price: line-through, muted */
  strike?: boolean
  /** "6,2 mln" */
  compact?: boolean
  /** prefix "+" for positive */
  sign?: boolean
  /** hide "so'm" */
  bare?: boolean
  /** render the currency suffix smaller/muted */
  softCurrency?: boolean
}

function split(formatted: string): [string, string] {
  const i = formatted.lastIndexOf(' ')
  if (i < 0) return [formatted, '']
  const tail = formatted.slice(i + 1)
  return tail.startsWith("so'm") ? [formatted.slice(0, i), formatted.slice(i)] : [formatted, '']
}

/** Formatted so'm with tabular numerals. 620_000_000 tiyin -> "6 200 000 so'm". */
export const Money = forwardRef<HTMLSpanElement, MoneyProps>(function Money(
  { tiyin, size = 'md', strike = false, compact = false, sign = false, bare = false, softCurrency = false, className, ...rest },
  ref,
) {
  const text = formatMoney(tiyin, { compact, sign, withCurrency: !bare })
  const [num, cur] = softCurrency ? split(text) : [text, '']
  return (
    <span
      ref={ref}
      data-money=""
      className={cn('tnum whitespace-nowrap', SIZE[size], strike && 'line-through text-ink-3 decoration-brick/70 decoration-[1.5px]', className)}
      {...rest}
    >
      {num}
      {cur && <span className="text-[0.7em] font-body font-normal text-ink-3">{cur}</span>}
    </span>
  )
})

export interface AnimatedNumberProps extends HTMLAttributes<HTMLSpanElement> {
  value: number
  format?: (v: number) => string
  /** ms; default 600 */
  duration?: number
}

/** Count-up number; respects reduced motion. */
export function AnimatedNumber({ value, format = (v) => groupDigits(Math.round(v)), duration = 600, className, ...rest }: AnimatedNumberProps) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const [display, setDisplay] = useState(value)
  const first = useRef(true)
  useEffect(() => {
    const instant = first.current || reduce
    first.current = false
    // framer-motion drives updates asynchronously (frame loop), so no synchronous setState here
    const controls = animate(mv, value, {
      duration: instant ? 0 : duration / 1000,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value, reduce, duration, mv])
  return (
    <span className={cn('tnum', className)} {...rest}>
      {format(display)}
    </span>
  )
}

export interface AnimatedMoneyProps extends Omit<MoneyProps, 'tiyin'> {
  tiyin: Tiyin
  duration?: number
}

/** Money that rolls to the new value over 600ms (reduced motion → instant). */
export function AnimatedMoney({ tiyin, size = 'md', compact = false, sign = false, bare = false, duration = 600, className, softCurrency: _softCurrency, strike: _strike, ...rest }: AnimatedMoneyProps) {
  return (
    <AnimatedNumber
      data-money=""
      value={tiyin}
      duration={duration}
      format={(v) => formatMoney(Math.round(v / 100) * 100, { compact, sign, withCurrency: !bare })}
      className={cn('whitespace-nowrap', SIZE[size], className)}
      {...rest}
    />
  )
}
