import { forwardRef } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveIcon } from './icons'

export type SealSize = 28 | 40 | 56 | 80 | 120
export type SealVariant = 'ink' | 'gold' | 'paper' | 'avatar'

export interface SealProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** lucide kebab name, e.g. "stamp" */
  icon?: string
  /** explicit lucide component; wins over `icon` */
  Icon?: LucideIcon
  size?: SealSize
  variant?: SealVariant
  /** initials for `avatar` variant (max 2 chars shown) */
  initials?: string
  /** override the disc fill (avatar tones) */
  fill?: string
  /** subtle dashed tick ring between the two rings */
  ticks?: boolean
  /** optional caption under the seal */
  label?: string
}

/* "Toza bozor": yumshoq disk + ingichka halqa; oltin muhr — yaltiroq tanga */
const PALETTE: Record<SealVariant, { fill: string; outer: string; inner: string; fg: string }> = {
  paper: { fill: 'var(--card)', outer: 'var(--line-strong)', inner: 'var(--gold)', fg: 'var(--ink)' },
  ink: { fill: 'var(--ink)', outer: 'transparent', inner: 'var(--gold-fill)', fg: '#ffffff' },
  gold: { fill: 'url(#sealGoldGrad)', outer: '#c9930a', inner: 'rgba(255,255,255,.55)', fg: 'var(--ink)' },
  avatar: { fill: 'var(--blue-soft)', outer: 'transparent', inner: 'var(--blue)', fg: 'var(--ink)' },
}

/**
 * The signature two-ring round seal: outer ink ring (1.5px), inner thin gold ring, icon centered.
 * Rings are concentric; stroke widths stay crisp via non-scaling-stroke.
 */
export const Seal = forwardRef<HTMLSpanElement, SealProps>(function Seal(
  { icon, Icon, size = 40, variant = 'paper', initials, fill, ticks = false, label, className, style, ...rest },
  ref,
) {
  const p = PALETTE[variant]
  const Cmp = Icon ?? resolveIcon(icon ?? 'stamp')
  const iconSize = Math.round(size * 0.4)
  const disc = (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, color: p.fg }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="sealGoldGrad" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#ffd75e" />
            <stop offset="0.55" stopColor="#f5b400" />
            <stop offset="1" stopColor="#c9930a" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill={fill ?? p.fill} />
        <circle cx="50" cy="50" r="49" fill="none" stroke={p.outer} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {ticks && (
          <circle
            cx="50" cy="50" r="44" fill="none" stroke={p.inner} strokeWidth="1" strokeOpacity="0.7"
            strokeDasharray="1 3.2" vectorEffect="non-scaling-stroke"
          />
        )}
        <circle cx="50" cy="50" r={ticks ? 39 : 41} fill="none" stroke={p.inner} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {variant === 'avatar' ? (
        <span
          className="relative font-display font-bold uppercase leading-none tracking-[0.02em]"
          style={{ fontSize: Math.round(size * 0.34) }}
        >
          {(initials ?? '').slice(0, 2)}
        </span>
      ) : (
        <Cmp className="relative" size={iconSize} strokeWidth={1.75} aria-hidden="true" />
      )}
    </span>
  )
  const outerStyle: CSSProperties | undefined = style
  if (!label) {
    return (
      <span ref={ref} className={cn('inline-flex', className)} style={outerStyle} {...rest}>
        {disc}
      </span>
    )
  }
  return (
    <span ref={ref} className={cn('inline-flex flex-col items-center gap-1.5', className)} style={outerStyle} {...rest}>
      {disc}
      <span className="eyebrow text-center">{label}</span>
    </span>
  )
})
