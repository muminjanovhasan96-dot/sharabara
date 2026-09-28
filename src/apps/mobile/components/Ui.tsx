/**
 * "Toza bozor" (A yo’nalishi) — mobil ilovaga xos kichik bezak elementlari:
 * plitka ustidagi to’yingan yorliqlar, pastel kategoriya plitkalari, navy karta, oltin tanga, bo’sh holat.
 */
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InkCard, resolveIcon } from '@/design'
import type { InkCardProps } from '@/design'

/* ─── Plitka ustidagi yorliq ─────────────────────────────────────────── */
export type TileTone = 'green' | 'blue' | 'brick' | 'gold' | 'ink'
const TILE_TONE: Record<TileTone, string> = {
  green: 'bg-green text-white',
  blue: 'bg-blue text-white',
  brick: 'bg-brick text-white',
  gold: 'bg-gold-fill text-ink',
  ink: 'bg-ink/85 text-white',
}
/** Foto plitkasi ustidagi to’yingan yorliq: «Narx tekshirilgan», «Rasmiy», «−12%». */
export function TileBadge({ tone = 'green', className, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: TileTone }) {
  return (
    <span
      className={cn('tnum inline-flex h-[20px] items-center whitespace-nowrap rounded-[8px] px-1.5 text-[10.5px] font-bold leading-none shadow-[0_1px_2px_rgba(0,0,0,.18)]', TILE_TONE[tone], className)}
      {...rest}
    >
      {children}
    </span>
  )
}

/** −12% (eski narxdan hozirgi narxgacha) */
export function dropPct(prev: number, now: number): string {
  const pct = Math.max(1, Math.round((1 - now / prev) * 100))
  return `−${pct}%`
}

/* ─── Pastel plitkalar ───────────────────────────────────────────────── */
export interface PastelTone { bg: string; fg: string }
export const PASTEL = {
  blue: { bg: '#e8f0ff', fg: '#2f6fed' },
  green: { bg: '#e3f6ee', fg: '#1e9e6a' },
  peach: { bg: '#ffe1d1', fg: '#e07a2f' },
  lilac: { bg: '#e8defa', fg: '#7c5cd6' },
  rose: { bg: '#fde2ea', fg: '#d6455e' },
  lemon: { bg: '#fff3c4', fg: '#b8901e' },
  mint: { bg: '#d8f3e6', fg: '#12855a' },
  sky: { bg: '#d9ecfc', fg: '#1d7fa3' },
  gold: { bg: '#fff4d6', fg: '#c9930a' },
  brick: { bg: '#fde8e6', fg: '#e0443b' },
  gray: { bg: '#e8ebf1', fg: '#4a5568' },
} satisfies Record<string, PastelTone>
export type PastelKey = keyof typeof PASTEL
const CAT_TONE: Record<string, PastelKey> = {
  telefonlar: 'blue', noutbuklar: 'lilac', televizorlar: 'sky', maishiy: 'mint', mebel: 'peach', kiyim: 'rose', sport: 'green', bolalar: 'lemon',
}
const ORDER: PastelKey[] = ['blue', 'green', 'peach', 'lilac', 'rose', 'lemon', 'mint', 'sky']
export function categoryTone(id: string, i = 0): PastelTone { return PASTEL[CAT_TONE[id] ?? ORDER[i % ORDER.length]] }

export interface PastelTileProps extends HTMLAttributes<HTMLSpanElement> {
  /** lucide kebab name */
  icon?: string
  Icon?: LucideIcon
  tone?: PastelTone | PastelKey
  size?: number
  iconSize?: number
  radius?: number
}
/** Kategoriya plitkasi: iliq neytral doira + siyoh chiziqli ikon (Sharabara uslubi; pastel ranglar olib tashlandi). */
export function PastelTile({ icon, Icon, tone: _tone = 'blue', size = 64, iconSize, radius, className, style, ...rest }: PastelTileProps) {
  const Cmp = Icon ?? resolveIcon(icon ?? 'tag')
  const st: CSSProperties = { width: size, height: size, background: 'var(--paper-2)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px var(--line)', borderRadius: radius ?? Math.round(size * 0.3), ...style }
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', className)} style={st} aria-hidden="true" {...rest}>
      <Cmp size={iconSize ?? Math.round(size * 0.42)} strokeWidth={1.8} />
    </span>
  )
}

/* ─── Navy karta (InkCard ustida gradient + oq matn) ─────────────────── */
export const NAVY_GRADIENT = 'linear-gradient(112deg, #1a2430 0%, #22303f 62%, #2b3a4a 100%)'
export function NavyCard({ className, style, children, ...rest }: InkCardProps) {
  return (
    <InkCard className={cn('relative overflow-hidden text-white', className)} style={{ background: NAVY_GRADIENT, color: '#ffffff', ...style }} {...rest}>
      {children}
    </InkCard>
  )
}

/* ─── Oltin tanga (Narx tekshirilgan muhri) ──────────────────────────── */
export function GoldCoin({ size = 56, Icon = Check, glow = true, className, style }: { size?: number; Icon?: LucideIcon; glow?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full text-ink', className)}
      style={{
        width: size, height: size,
        background: 'radial-gradient(circle at 35% 30%, #fff3c4 0%, #ffd75e 28%, #f5b400 62%, #d99e00 100%)',
        boxShadow: glow ? `0 ${Math.round(size * 0.14)}px ${Math.round(size * 0.4)}px -${Math.round(size * 0.12)}px rgba(245,180,0,.9), inset 0 -2px 4px rgba(0,0,0,.08)` : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      <span className="absolute rounded-full border-[1.5px] border-dashed border-ink/50" style={{ inset: Math.round(size * 0.08) }} />
      <Icon size={Math.round(size * 0.46)} strokeWidth={3} />
    </span>
  )
}

/* ─── Bo’sh holat (pastel plitka ikon bilan) ─────────────────────────── */
export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: string
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  compact?: boolean
  tone?: PastelKey
}
export function EmptyState({ icon = 'inbox', title, hint, action, compact = false, tone = 'blue', className, ...rest }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'gap-2 py-6' : 'gap-3 py-12', className)} {...rest}>
      <PastelTile icon={icon} tone={tone} size={compact ? 48 : 72} />
      <div className={cn('font-display text-ink', compact ? 'text-[15px]' : 'text-[17px]')}>{title}</div>
      {hint && <p className="m-0 max-w-[30ch] text-[13px] leading-snug text-ink-2">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

/* ─── Raqamli qadam doirasi (1, 2, 3) ────────────────────────────────── */
export function StepDot({ n, tone = 'gold', size = 28, className }: { n: number | string; tone?: PastelKey; size?: number; className?: string }) {
  const t = PASTEL[tone]
  return (
    <span className={cn('tnum inline-flex shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold', className)} style={{ width: size, height: size, background: t.bg, color: t.fg }}>
      {n}
    </span>
  )
}
