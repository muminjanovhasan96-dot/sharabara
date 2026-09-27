import { forwardRef, useEffect } from 'react'
import type { HTMLAttributes } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn, haptic } from '@/lib/utils'
import { uz } from '@/i18n/uz'

export type StampTone = 'brick' | 'green' | 'ink'
export type StampSize = 'sm' | 'md' | 'lg'

export interface StampProps extends HTMLAttributes<HTMLSpanElement> {
  text?: string
  tone?: StampTone
  size?: StampSize
  /** degrees; default -12 */
  rotate?: number
}

const TONE: Record<StampTone, string> = { brick: 'var(--brick)', green: 'var(--green)', ink: 'var(--ink)' }
const SIZE: Record<StampSize, { font: number; pad: string }> = {
  sm: { font: 11, pad: '2px 6px' },
  md: { font: 16, pad: '4px 10px' },
  lg: { font: 26, pad: '6px 16px' },
}

/** "SOTILDI" stamp: brick, 3px double border, Bitter 800 uppercase, rotated -12deg. */
export const Stamp = forwardRef<HTMLSpanElement, StampProps>(function Stamp(
  { text = uz.listing.sold, tone = 'brick', size = 'md', rotate = -12, className, style, ...rest },
  ref,
) {
  const s = SIZE[size]
  return (
    <span
      ref={ref}
      role="img"
      aria-label={text}
      className={cn('inline-block select-none font-display uppercase leading-none tracking-[0.12em]', className)}
      style={{
        color: TONE[tone],
        border: `3px double ${TONE[tone]}`,
        borderRadius: 4,
        fontWeight: 800,
        fontSize: s.font,
        padding: s.pad,
        transform: `rotate(${rotate}deg)`,
        mixBlendMode: 'multiply',
        ...style,
      }}
      {...rest}
    >
      {text}
    </span>
  )
})

export interface StampAnimatedProps extends StampProps {
  /** vibration ms on mount; 0 disables */
  hapticMs?: number
}

/** Stamps down: scale 1.4→1 with a rotate wobble, spring; haptic on mount. */
export function StampAnimated({ rotate = -12, hapticMs = 12, className, ...rest }: StampAnimatedProps) {
  const reduce = useReducedMotion()
  useEffect(() => { if (hapticMs > 0) haptic(hapticMs) }, [hapticMs])
  return (
    <motion.span
      className={cn('inline-block', className)}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.4, rotate: rotate + 6 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: [1.4, 0.94, 1], rotate: [rotate + 6, rotate - 2, rotate] }}
      transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 420, damping: 22, duration: 0.55 }}
      style={{ transformOrigin: '50% 50%' }}
    >
      <Stamp rotate={0} {...rest} />
    </motion.span>
  )
}
