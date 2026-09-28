/**
 * Direktor paneli uchun UI bo'laklari — "Toza bozor" (A) tili: oq kartalar, navy matn,
 * ko'k aksent, yumshoq rangli chiplar. Faqat token klasslari (dark mode xavfsiz).
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'
import { useAppNavigate } from '@/lib/router'
import { AnimatedNumber, Badge, Card, chartTheme, type BadgeTone } from '@/design'
import { formatMoney, groupDigits, percent } from '@/domain/money'
import type { SalesChannel, Tiyin } from '@/domain/types'
import { useDirector } from '../lib/ctx'
import { D } from '../strings'

/* ─── Ranglar (diagrammalar uchun; CSS tokenlar → dark mode xavfsiz) ─── */
export const C = {
  blue: 'var(--blue)',
  navy: 'var(--ink)',
  gold: 'var(--gold-fill)',
  violet: '#7c5cff',
  green: 'var(--green)',
  brick: 'var(--brick)',
  muted: 'var(--ink-3)',
} as const
/** Kanal ranglari: Ilova oltin, Telegram ko'k, Instagram binafsha, Oflayn navy */
export const CHANNEL_COLOR: Record<SalesChannel, string> = { app: C.gold, telegram: C.blue, instagram: C.violet, offline: C.navy }

export type ChipTone = 'blue' | 'green' | 'gold' | 'brick' | 'violet' | 'neutral'
const CHIP: Record<ChipTone, string> = {
  blue: 'bg-blue-soft text-blue',
  green: 'bg-green-soft text-green',
  gold: 'bg-gold-soft text-[color-mix(in_srgb,var(--gold)_72%,var(--ink))]',
  brick: 'bg-brick-soft text-brick',
  violet: 'bg-[color-mix(in_srgb,#7c5cff_14%,var(--card))] text-[#7c5cff]',
  neutral: 'bg-paper-2 text-ink-2',
}

/* ─── Panel (oq karta, sarlavha) ─────────────────────────────────────── */
export function Panel({ eyebrow, title, hint, actions, children, className, bodyClassName, padding = true, onClick }: {
  eyebrow?: ReactNode; title?: ReactNode; hint?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string; bodyClassName?: string; padding?: boolean; onClick?: () => void
}) {
  const heading = title ?? eyebrow
  const small = title ? eyebrow : undefined
  return (
    <Card padding="none" interactive={Boolean(onClick)} onClick={onClick} className={cn('flex min-w-0 flex-col', className)}>
      {(heading || actions) && (
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-1">
          <div className="min-w-0">
            {small && <div className="eyebrow mb-0.5">{small}</div>}
            {heading && <h3 className="m-0 truncate font-display text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink">{heading}</h3>}
            {hint && <div className="mt-0.5 text-[12px] text-ink-3">{hint}</div>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('min-w-0', padding && 'px-4 pb-4 pt-2', bodyClassName)}>{children}</div>
    </Card>
  )
}

/* ─── Ikon chip (32px, yumshoq fon) ──────────────────────────────────── */
export function IconChip({ icon: Icon, tone = 'blue', size = 32, className }: { icon: LucideIcon; tone?: ChipTone; size?: 28 | 32 | 36 | 40; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-[10px]', CHIP[tone], className)} style={{ width: size, height: size }} aria-hidden="true">
      <Icon size={Math.round(size * 0.5)} strokeWidth={1.9} />
    </span>
  )
}

/* ─── Sanoq pilli (brick / gold) ──────────────────────────────────────── */
export function CountPill({ n, tone = 'brick', className }: { n: number | string; tone?: ChipTone; className?: string }) {
  return <span className={cn('tnum inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-2 text-[11.5px] font-bold', CHIP[tone], className)}>{n}</span>
}

/* ─── Delta pilli ─────────────────────────────────────────────────────── */
export function DeltaPill({ delta, invert = false, label, className }: { delta: number | undefined; invert?: boolean; label?: ReactNode; className?: string }) {
  if (delta === undefined && !label) return null
  const good = delta === undefined ? null : invert ? delta <= 0 : delta >= 0
  const Icon = delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('flex flex-wrap items-center gap-1.5 text-[12px] leading-tight', className)}>
      {delta !== undefined && (
        <span className={cn('tnum inline-flex items-center gap-0.5 rounded-[7px] px-1.5 py-[3px] font-bold', good === null ? CHIP.neutral : good ? CHIP.green : CHIP.brick)}>
          <Icon size={12} strokeWidth={2.25} aria-hidden="true" />{percent(delta, 1).replace('.', ',').replace('%', ' %')}
        </span>
      )}
      {label && <span className="text-ink-3">{label}</span>}
    </span>
  )
}

/* ─── Katta pul: "129,5" + "mln so’m" ─────────────────────────────────── */
type Unit = 'mln' | 'ming' | ''
function unitOf(tiyin: number): Unit {
  const sums = Math.abs(Math.trunc(tiyin / 100))
  return sums >= 1_000_000 ? 'mln' : sums >= 10_000 ? 'ming' : ''
}
function numFor(tiyin: number, unit: Unit): string {
  const sums = Math.trunc(tiyin / 100)
  if (unit === 'mln') { const m = sums / 1_000_000; return Math.abs(m) >= 1000 ? groupDigits(Math.round(m)) : m.toFixed(1).replace(/\.0$/, '').replace('.', ',') }
  if (unit === 'ming') return groupDigits(Math.round(sums / 1000))
  return groupDigits(sums)
}
/** "129,5 mln" — bir kasr aniqlikda ixcham pul (valyutasiz) */
export function compactParts(tiyin: number): [string, string] { const u = unitOf(tiyin); return [numFor(tiyin, u), u] }
export function compact(tiyin: number): string { const [n, u] = compactParts(tiyin); return u ? `${n} ${u}` : n }
export function BigMoney({ tiyin, size = 'xl', className, unitClassName, animate = true, currency = true }: {
  tiyin: Tiyin; size?: 'lg' | 'xl' | 'display'; className?: string; unitClassName?: string; animate?: boolean; currency?: boolean
}) {
  const unit = unitOf(tiyin)
  const cls = size === 'display' ? 'text-[34px] leading-none @md:text-[40px]' : size === 'xl' ? 'text-[26px] leading-none' : 'text-[18px] leading-none'
  const ucls = size === 'display' ? 'text-[17px] @md:text-[19px]' : size === 'xl' ? 'text-[13px]' : 'text-[12px]'
  const suffix = `${unit ? `${unit} ` : ''}${currency ? 'so’m' : ''}`.trim()
  return (
    <span data-money="" className={cn('tnum inline-flex items-baseline gap-1.5 whitespace-nowrap font-display font-extrabold tracking-[-0.02em] text-ink', cls, className)}>
      {animate ? <AnimatedNumber value={tiyin} format={(v) => numFor(v, unit)} /> : <span className="tnum">{numFor(tiyin, unit)}</span>}
      {suffix && <span className={cn('font-body font-semibold tracking-normal text-ink-2', ucls, unitClassName)}>{suffix}</span>}
    </span>
  )
}

/* ─── Stat tile ───────────────────────────────────────────────────────── */
export function Stat({ label, value, money = false, delta, deltaLabel, hint, suffix, onClick, tone, icon, chip = 'blue', className, invert = false }: {
  label: ReactNode; value: number; money?: boolean; delta?: number; deltaLabel?: ReactNode; hint?: ReactNode; suffix?: ReactNode
  onClick?: () => void; tone?: 'gold' | 'brick' | 'green'; icon?: LucideIcon; chip?: ChipTone; className?: string; invert?: boolean
}) {
  const toneCls = tone === 'brick' ? 'text-brick' : tone === 'green' ? 'text-green' : tone === 'gold' ? 'text-[color-mix(in_srgb,var(--gold)_72%,var(--ink))]' : undefined
  return (
    <Card interactive={Boolean(onClick)} onClick={onClick} padding="none" className={cn('relative flex flex-col gap-2 p-3.5 @md:p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn('min-w-0 text-[12px] font-medium leading-[1.25] text-ink-3', icon && 'pr-1')}>{label}</span>
        {icon && <IconChip icon={icon} tone={chip} size={32} className="-mr-0.5 -mt-0.5" />}
      </div>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        {money
          ? <BigMoney tiyin={value as Tiyin} size="xl" className={cn('text-[24px] @md:text-[26px]', toneCls)} />
          : <AnimatedNumber value={value} className={cn('font-display text-[26px] font-extrabold leading-none tracking-[-0.02em] text-ink', toneCls)} />}
        {suffix && <span className="text-[13px] font-medium text-ink-2">{suffix}</span>}
      </div>
      {(delta !== undefined || deltaLabel || hint) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[12px] leading-tight text-ink-3">
          <DeltaPill delta={delta} invert={invert} label={deltaLabel} />
          {hint && <span className="clamp-2">{hint}</span>}
        </div>
      )}
    </Card>
  )
}

/* ─── Silliq sparkline (ko'k, gradient to'ldirish) ───────────────────── */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`
  }
  return d
}
export function SmoothSpark({ values, width = 120, height = 44, color = C.blue, id = 'spark', className }: { values: number[]; width?: number; height?: number; color?: string; id?: string; className?: string }) {
  const pad = 3
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1
  const pts: [number, number][] = values.map((v, i) => [Number((pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2)).toFixed(1)), Number((pad + (1 - (v - min) / span) * (height - pad * 2 - 2)).toFixed(1))])
  const line = smoothPath(pts)
  const last = pts[pts.length - 1]
  const gid = `${id}-g`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn('block overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {line && <path d={`${line} L${last[0]},${height} L${pts[0][0]},${height} Z`} fill={`url(#${gid})`} />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />}
      {last && <circle cx={last[0]} cy={last[1]} r={3} fill={color} stroke="var(--card)" strokeWidth={1.5} />}
    </svg>
  )
}

/* ─── Donut (recharts) ────────────────────────────────────────────────── */
export function Donut({ data, children, className }: {
  data: { key: string; label: string; value: number; color: string }[]; children?: ReactNode; className?: string
}) {
  return (
    <div className={cn('relative aspect-square w-[128px] shrink-0', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius="76%" outerRadius="100%" paddingAngle={2.5} cornerRadius={3} stroke="none" isAnimationActive={false}>
            {data.map((c) => <Cell key={c.key} fill={c.color} />)}
          </Pie>
          <Tooltip content={({ active, payload }) => active && payload?.length ? (
            <div className={chartTheme.tooltipClass}><div className={chartTheme.tooltipLabelClass}>{String(payload[0].name)}</div><div className="tnum">{formatMoney(Number(payload[0].value), { compact: true })}</div></div>
          ) : null} />
        </PieChart>
      </ResponsiveContainer>
      {children && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  )
}

/* ─── Horizontal bars ────────────────────────────────────────────────── */
export function Bars({ rows, format, tone = 'blue', max, className }: {
  rows: { id: string; label: ReactNode; value: number; hint?: ReactNode; right?: ReactNode; color?: string; onClick?: () => void }[]
  format?: (v: number) => ReactNode; tone?: 'gold' | 'ink' | 'green' | 'blue' | 'brick'; max?: number; className?: string
}) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value))
  const COLOR = { gold: 'bg-gold-fill', ink: 'bg-ink', green: 'bg-green', blue: 'bg-blue', brick: 'bg-brick' }
  if (!rows.length) return <Empty />
  return (
    <ul className={cn('m-0 flex list-none flex-col gap-2.5 p-0', className)}>
      {rows.map((r) => {
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
              <span className="min-w-0 truncate font-medium text-ink">{r.label}</span>
              <span className="tnum shrink-0 text-ink-2">{r.right ?? (format ? format(r.value) : r.value)}</span>
            </div>
            <div className="mt-1.5 h-[7px] w-full overflow-hidden rounded-full bg-paper-2">
              <div className={cn('h-full rounded-full', !r.color && COLOR[tone])} style={{ width: `${Math.max(2, Math.min(100, (r.value / m) * 100))}%`, background: r.color }} />
            </div>
            {r.hint && <div className="mt-0.5 text-[11.5px] text-ink-3">{r.hint}</div>}
          </>
        )
        return (
          <li key={r.id}>
            {r.onClick ? <button type="button" onClick={r.onClick} className="w-full rounded-[8px] text-left hover:bg-paper-2">{inner}</button> : inner}
          </li>
        )
      })}
    </ul>
  )
}

/* ─── Reyting chipi (1 — oltin) ──────────────────────────────────────── */
export function RankChip({ n }: { n: number }) {
  return <span className={cn('tnum inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold', n === 1 ? 'bg-gold-fill text-[#0f1f3a]' : n <= 3 ? 'bg-gold-soft text-[color-mix(in_srgb,var(--gold)_72%,var(--ink))]' : 'bg-paper-2 text-ink-2')}>{n}</span>
}

/* ─── Ro'yxat qatori ─────────────────────────────────────────────────── */
export function Row({ title, sub, right, rightSub, badge, onClick, leading, className }: {
  title: ReactNode; sub?: ReactNode; right?: ReactNode; rightSub?: ReactNode; badge?: ReactNode; onClick?: () => void; leading?: ReactNode; className?: string
}) {
  const body = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[14px] font-medium text-ink">{title}</span>
          {badge}
        </span>
        {sub && <span className="mt-0.5 block truncate text-[12px] text-ink-3">{sub}</span>}
      </span>
      {(right || rightSub) && (
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          {right && <span className="tnum text-[14px] font-bold text-ink">{right}</span>}
          {rightSub && <span className="text-[11.5px] text-ink-3">{rightSub}</span>}
        </span>
      )}
      {onClick && <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden="true" />}
    </>
  )
  const cls = cn('flex w-full items-center gap-3 py-2.5 text-left', className)
  return onClick ? <button type="button" onClick={onClick} className={cn(cls, '-mx-2 w-[calc(100%+16px)] rounded-[10px] px-2 hover:bg-paper-2')}>{body}</button> : <div className={cls}>{body}</div>
}

export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('divide-y divide-line', className)}>{children}</div>
}

export function Empty({ text = D.empty }: { text?: string }) {
  return <div className="py-6 text-center text-[13px] text-ink-3">{text}</div>
}

/* ─── Timeline (lenta) ───────────────────────────────────────────────── */
export type DotTone = 'gold' | 'brick' | 'blue' | 'green' | 'muted' | 'violet'
const DOT: Record<DotTone, string> = { gold: 'bg-gold-fill', brick: 'bg-brick', blue: 'bg-blue', green: 'bg-green', muted: 'bg-ink-3', violet: 'bg-[#7c5cff]' }
export function TimelineList({ items, className }: { items: { id: string; tone: DotTone; text: ReactNode; meta?: ReactNode }[]; className?: string }) {
  if (!items.length) return <Empty />
  return (
    <ol className={cn('relative m-0 list-none p-0', className)}>
      <span className="absolute bottom-3 left-[5px] top-3 w-px bg-line" aria-hidden="true" />
      {items.map((f) => (
        <li key={f.id} className="relative flex items-start gap-3 py-2">
          <span className={cn('relative z-[1] mt-[5px] h-[11px] w-[11px] shrink-0 rounded-full ring-[3px] ring-card', DOT[f.tone])} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] leading-snug text-ink">{f.text}</span>
            {f.meta && <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-ink-3">{f.meta}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

/* ─── Admin havolasi (ko'k "Ochish →") ───────────────────────────────── */
/** Admin bo'limiga havola: standalone → absolyut `/admin/...`; admin ichida → nisbiy navigatsiya. */
export function AdminLink({ to, children, className, icon = true }: { to: string; children?: ReactNode; className?: string; icon?: boolean }) {
  const { linkMode } = useDirector()
  const nav = useAppNavigate()
  const cls = cn('inline-flex items-center gap-1 text-[12.5px] font-semibold text-blue underline-offset-4 hover:underline', className)
  const inner = <>{children ?? D.open}{icon && <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />}</>
  if (linkMode === 'admin') return <button type="button" onClick={(e) => { e.stopPropagation(); nav(to) }} className={cls}>{inner}</button>
  return <Link to={`/admin${to}`} onClick={(e) => e.stopPropagation()} className={cls}>{inner}</Link>
}

/* ─── Recharts tooltip ───────────────────────────────────────────────── */
export function ChartTip({ active, payload, label, names }: { active?: boolean; payload?: readonly { dataKey?: unknown; value?: unknown; color?: string }[]; label?: ReactNode; names: Record<string, string> }) {
  if (!active || !payload?.length) return null
  return (
    <div className={chartTheme.tooltipClass}>
      <div className={chartTheme.tooltipLabelClass}>{label}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{names[String(p.dataKey)] ?? String(p.dataKey)}</span>
          <span className="tnum font-semibold">{formatMoney(Math.abs(Number(p.value)))}</span>
        </div>
      ))}
    </div>
  )
}

export function Legend({ items, className }: { items: { label: ReactNode; color: string }[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-2', className)}>
      {items.map((i, k) => <span key={k} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />{i.label}</span>)}
    </div>
  )
}

export function Tone({ tone, children }: { tone: BadgeTone; children: ReactNode }) { return <Badge tone={tone} size="sm">{children}</Badge> }
