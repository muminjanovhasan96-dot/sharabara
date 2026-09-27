import { Component, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useAppNavigate } from '@/lib/router'
import {
  AnimatedMoney, AnimatedNumber, Badge, Button, Card, ConfirmDialog, Drawer, ErrorState, Modal, Sparkline, type BadgeTone, type ConfirmDialogProps, type DrawerProps, type KpiCardProps, type ModalProps,
} from '@/design'
import { Chip, Field, Input } from '@/design'
import { percent } from '@/domain/money'
import type { Tiyin } from '@/domain/types'
import { ArrowDownRight, ArrowUpRight, Minus, Plus, X } from 'lucide-react'
import type { CompanyStatus, ListingStatus, ManifestStatus, PayoutStatus, ProductCheck, ReturnStatus, SubOrderStatus, OrderStatus, EscrowStatus, AuditKind } from '@/domain/types'
import { uz } from '@/i18n/uz'
import { MANIFEST_STATUS_UZ, PAYOUT_STATUS_UZ, RETURN_STATUS_UZ, ORDER_STATUS_UZ } from '@/domain/machines'
import { useContainer, useAdmin } from '../lib/context'
import { A, tt } from '../strings'
import type { SavedView } from '../lib/hooks'

/* ─── Diagramma ranglari («Toza bozor») ──────────────────────────────── */
/** CSS o'zgaruvchilar orqali — qorong'i rejimda ham to'g'ri ishlaydi. Mall → ko'k, E'lonlar → navy, pul → oltin. */
export const AC = {
  blue: 'var(--blue)', navy: 'var(--ink)', gold: 'var(--gold)', goldFill: 'var(--gold-fill)', brick: 'var(--brick)', green: 'var(--green)', purple: '#8b5cf6', muted: 'var(--ink-3)',
  blueSoft: 'var(--blue-soft)', line: 'var(--line)',
} as const
export const AC_GRID = { stroke: 'var(--line)', strokeDasharray: '3 5' } as const
export const AC_CURSOR = { fill: 'var(--blue-soft)', fillOpacity: 0.55 } as const

/** Legenda — yumshoq pillalar (Recharts <Legend> o'rniga). */
export function LegendPills({ items, className }: { items: { label: ReactNode; color: string }[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)} aria-hidden="true">
      {items.map((i, k) => (
        <span key={k} className="inline-flex h-6 items-center gap-1.5 rounded-full bg-paper px-2.5 text-[12px] font-medium text-ink-2">
          <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />{i.label}
        </span>
      ))}
    </div>
  )
}

/* ─── KPI plitkasi ───────────────────────────────────────────────────── */
export interface KpiProps extends KpiCardProps {
  /** sparkline rangi; berilmasa pul → oltin, qolganlari → ko'k */
  tone?: 'blue' | 'gold' | 'green' | 'brick'
}
/** Admin KPI: eyebrow, 26px raqam, yumshoq delta pillasi, ko'k/oltin sparkline. */
export function Kpi({ label, value, money = false, compact = false, delta, deltaLabel, invertDelta = false, spark, suffix, hint, onClick, className, format, tone }: KpiProps) {
  const good = delta === undefined ? null : invertDelta ? delta <= 0 : delta >= 0
  const DeltaIcon = delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight
  const stroke = tone ? (tone === 'gold' ? AC.gold : AC[tone]) : money ? AC.gold : AC.blue
  // Karta tor bo'lsa (sahnadagi kichraytirilgan admin) sparkline va «maqsadga nisbatan» yozuvi yashirinadi —
  // yozuvlar bir-birining ustiga chiqmaydi, raqam esa doim to'liq ko'rinadi.
  return (
    <Card interactive={Boolean(onClick)} onClick={onClick} padding="md" className={cn('@container flex min-w-0 flex-col gap-1.5', className)}>
      <span className="eyebrow leading-[1.3]">{label}</span>
      <div className="flex items-end justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-1.5">
          {money ? (
            <AnimatedMoney tiyin={value as Tiyin} size="xl" compact={compact} softCurrency className="text-[23px] tracking-[-0.02em] @[220px]:text-[26px]" />
          ) : (
            <AnimatedNumber value={value} format={format} className="whitespace-nowrap font-display text-[23px] font-bold tracking-[-0.02em] text-ink @[220px]:text-[26px]" />
          )}
          {suffix && <span className="truncate text-[13px] text-ink-3">{suffix}</span>}
        </div>
        {spark && spark.length > 1 && <Sparkline values={spark} width={56} height={20} stroke={stroke} area className="mb-1 hidden shrink-0 @[200px]:block" />}
      </div>
      {(delta !== undefined || hint) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          {delta !== undefined && (
            <span className={cn('tnum inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-[12px] font-semibold', good === null ? 'bg-paper-2 text-ink-3' : good ? 'bg-green-soft text-green' : 'bg-brick-soft text-brick')}>
              <DeltaIcon size={13} strokeWidth={2} aria-hidden="true" />
              {percent(delta, 1)}
            </span>
          )}
          {deltaLabel && <span className="hidden text-ink-3 @[190px]:inline">{deltaLabel}</span>}
          {hint && <span className="text-ink-3">{hint}</span>}
        </div>
      )}
    </Card>
  )
}

/* ─── Ommaviy amallar paneli (navy) ──────────────────────────────────── */
export function BulkBar({ count, onClear, children, className }: { count: number; onClear: () => void; children?: ReactNode; className?: string }) {
  if (count <= 0) return null
  return (
    <div role="status" className={cn('flex flex-wrap items-center gap-3 rounded-[12px] bg-ink px-4 py-2 text-paper shadow-soft', className)}>
      <span className="tnum text-[13px] font-semibold">{tt(A.common.selected, { n: count })}</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        <button type="button" onClick={onClear} className="inline-flex h-9 items-center rounded-[10px] px-2.5 text-[13px] font-medium text-paper/75 hover:bg-paper/10 hover:text-paper">{A.common.clear}</button>
      </div>
    </div>
  )
}

/* ─── Panel ──────────────────────────────────────────────────────────── */
export function Panel({ eyebrow, title, actions, children, className, bodyClassName, padding = true }: {
  eyebrow?: ReactNode; title?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string; bodyClassName?: string; padding?: boolean
}) {
  return (
    <Card padding="none" className={cn('flex min-w-0 flex-col', className)}>
      {(eyebrow || title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h3 className="m-0 font-display text-[16px] leading-tight text-ink">{title}</h3>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('min-w-0 flex-1', padding && 'p-4', bodyClassName)}>{children}</div>
    </Card>
  )
}

/** Bo'lim sarlavhasi ostidagi asboblar qatori */
export function Toolbar({ children, right, className }: { children?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-center justify-between gap-2', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}

/* ─── Saved views chips ──────────────────────────────────────────────── */
export function ViewChips<F>({ views, active, onPick, onSave, onRemove, current, customNames }: {
  views: SavedView<F>[]; active: string | null; onPick: (v: SavedView<F>) => void; onSave?: (name: string, filters: F) => void; onRemove?: (name: string) => void; current: F; customNames: string[]
}) {
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={A.common.savedViews}>
      {views.map((v) => (
        <span key={v.name} className="inline-flex items-center">
          <Chip size="sm" selected={active === v.name} onToggle={() => onPick(v)}>{v.name}</Chip>
          {onRemove && customNames.includes(v.name) && (
            <button type="button" aria-label={`${A.common.clear}: ${v.name}`} onClick={() => onRemove(v.name)} className="-ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-3 hover:text-brick">
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </span>
      ))}
      {onSave && !naming && (
        <button type="button" onClick={() => setNaming(true)} className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 text-[12.5px] text-ink-2 hover:border-ink hover:text-ink">
          <Plus size={13} strokeWidth={2} aria-hidden="true" /> {A.common.saveView}
        </button>
      )}
      {onSave && naming && (
        <form className="inline-flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onSave(name.trim(), current); setName(''); setNaming(false) } }}>
          <Input size="sm" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={A.common.viewName} className="w-40" aria-label={A.common.viewName} />
          <Button size="sm" type="submit" variant="secondary">{A.common.save}</Button>
          <Button size="sm" variant="ghost" onClick={() => setNaming(false)}>{A.common.cancel}</Button>
        </form>
      )}
    </div>
  )
}

/* ─── Overlays bound to the admin root (theme scope + embedded) ──────── */
export function AdminDrawer(props: DrawerProps) {
  const root = useContainer()
  const { embedded } = useAdmin()
  return <Drawer container={root} className={cn(embedded && 'absolute', props.className)} {...props} />
}
export function AdminModal({ className, ...props }: ModalProps) { const root = useContainer(); return <Modal container={root} className={cn('p-6', className)} {...props} /> }
export function AdminConfirm(props: ConfirmDialogProps) { const root = useContainer(); return <ConfirmDialog container={root} {...props} /> }

/* ─── Small display helpers ──────────────────────────────────────────── */
export function KV({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="eyebrow mb-0.5 !text-[10px]">{label}</div>
      <div className="text-[14px] text-ink">{children}</div>
    </div>
  )
}
export function KVGrid({ children, cols = 3, className }: { children: ReactNode; cols?: 2 | 3 | 4; className?: string }) {
  return <div className={cn('grid gap-3', cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4', className)}>{children}</div>
}
export function SectionTitle({ children, right, className }: { children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-2 flex items-center justify-between gap-2', className)}>
      <div className="eyebrow">{children}</div>
      {right}
    </div>
  )
}
/** Ichki havola: boshqa bo'limga o'tish (masalan buyurtma → orders?id=) */
export function IdLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const nav = useAppNavigate()
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); nav(to) }} className={cn('tnum font-medium text-blue underline-offset-4 hover:underline', className)}>
      {children}
    </button>
  )
}
export function SampleBadge() { return <Badge tone="outline" size="sm">{A.common.sample}</Badge> }

/** Sehrgar qadamlari: 1 · 2 · 3 (faol/bajarilgan — ko'k) */
export function Steps({ steps, step, className }: { steps: string[]; step: number; className?: string }) {
  return (
    <ol className={cn('m-0 mb-4 flex list-none flex-wrap gap-3 p-0', className)}>
      {steps.map((s, i) => (
        <li key={s} className={cn('flex items-center gap-1.5 text-[12.5px]', i === step ? 'font-medium text-ink' : 'text-ink-3')} aria-current={i === step ? 'step' : undefined}>
          <span className={cn('tnum inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold', i < step ? 'bg-green-soft text-green' : i === step ? 'bg-blue text-white' : 'bg-paper-2 text-ink-3')}>{i < step ? '✓' : i + 1}</span>{s}
        </li>
      ))}
    </ol>
  )
}

/** Gorizontal chiziqlar ro'yxati (magnitude) */
export function BarList({ rows, max, format, tone = 'gold', className }: {
  rows: { label: ReactNode; value: number; hint?: ReactNode; onClick?: () => void; tone?: 'gold' | 'ink' | 'green' | 'brick' | 'blue' }[]
  max?: number; format?: (v: number) => ReactNode; tone?: 'gold' | 'ink' | 'green' | 'brick' | 'blue'; className?: string
}) {
  const m = max ?? Math.max(1, ...rows.map((r) => Math.abs(r.value)))
  const COLOR = { gold: 'bg-gold', ink: 'bg-ink', green: 'bg-green', brick: 'bg-brick', blue: 'bg-blue' }
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {rows.map((r, i) => {
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className="truncate text-ink">{r.label}</span>
              <span className="tnum shrink-0 text-ink-2">{format ? format(r.value) : r.value}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
              <div className={cn('h-full rounded-full', COLOR[r.tone ?? tone])} style={{ width: `${Math.min(100, (Math.abs(r.value) / m) * 100)}%` }} />
            </div>
            {r.hint && <div className="mt-0.5 text-[11.5px] text-ink-3">{r.hint}</div>}
          </>
        )
        return r.onClick ? (
          <button key={i} type="button" onClick={r.onClick} className="rounded-[8px] px-1 py-1 text-left hover:bg-paper-2">{inner}</button>
        ) : <div key={i} className="px-1 py-1">{inner}</div>
      })}
    </div>
  )
}

/** Ishonch halqasi (0..1) */
export function Ring({ value, size = 72, label }: { value: number; size?: number; label?: ReactNode }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const tone = v >= 0.75 ? 'var(--green)' : v >= 0.5 ? 'var(--gold)' : 'var(--brick)'
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(v * 100)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-2)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="tnum font-display text-[16px] font-bold text-ink">{Math.round(v * 100)}%</span>
        {label && <span className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-ink-3">{label}</span>}
      </div>
    </div>
  )
}

/* ─── Status badge maps ──────────────────────────────────────────────── */
const LISTING_TONE: Partial<Record<ListingStatus, BadgeTone>> = { in_review: 'gold', submitted: 'neutral', ai_checked: 'blue', offer_sent: 'blue', published: 'green', sold: 'neutral', reserved: 'gold', rejected_by_admin: 'brick', returned_for_edit: 'brick', declined_by_seller: 'brick', expired: 'outline', removed: 'outline', draft: 'outline', accepted: 'green' }
export function ListingStatusBadge({ status }: { status: ListingStatus }) { return <Badge tone={LISTING_TONE[status] ?? 'neutral'} dot>{uz.listing.status[status]}</Badge> }

const SUB_TONE: Partial<Record<SubOrderStatus, BadgeTone>> = { packing: 'gold', packed: 'blue', handed_to_bts: 'blue', in_transit: 'blue', at_branch: 'green', delivered: 'green', payout_scheduled: 'gold', payout_paid: 'green', cancelled: 'brick', return_requested: 'brick', return_approved: 'brick', return_denied: 'outline', refunded: 'brick' }
export function SubStatusBadge({ status, size }: { status: SubOrderStatus; size?: 'sm' | 'md' }) { return <Badge size={size} tone={SUB_TONE[status] ?? 'neutral'} dot>{uz.orders.status[status]}</Badge> }

const ORDER_TONE: Record<OrderStatus, BadgeTone> = { created: 'neutral', paid: 'green', completed: 'blue', cancelled: 'brick' }
export function OrderStatusBadge({ status }: { status: OrderStatus }) { return <Badge tone={ORDER_TONE[status]} dot>{ORDER_STATUS_UZ[status]}</Badge> }

const ESCROW_TONE: Record<EscrowStatus, BadgeTone> = { none: 'outline', held: 'gold', released: 'green', refunded: 'brick', partially_refunded: 'brick' }
export function EscrowBadge({ status, size }: { status: EscrowStatus; size?: 'sm' | 'md' }) { return <Badge size={size} tone={ESCROW_TONE[status]}>{A.common.escrow[status]}</Badge> }

const PAYOUT_TONE: Record<PayoutStatus, BadgeTone> = { pending: 'neutral', scheduled: 'gold', awaiting_second_approval: 'brick', paid: 'green' }
export function PayoutStatusBadge({ status }: { status: PayoutStatus }) { return <Badge tone={PAYOUT_TONE[status]} dot>{PAYOUT_STATUS_UZ[status]}</Badge> }

const RETURN_TONE: Record<ReturnStatus, BadgeTone> = { requested: 'brick', approved_full: 'gold', approved_partial: 'gold', denied: 'outline', refunded: 'green' }
export function ReturnStatusBadge({ status }: { status: ReturnStatus }) { return <Badge tone={RETURN_TONE[status]} dot>{RETURN_STATUS_UZ[status]}</Badge> }

const MANIFEST_TONE: Record<ManifestStatus, BadgeTone> = { open: 'gold', closed: 'blue', picked_up: 'green' }
export function ManifestStatusBadge({ status }: { status: ManifestStatus }) { return <Badge tone={MANIFEST_TONE[status]} dot>{MANIFEST_STATUS_UZ[status]}</Badge> }

const COMPANY_TONE: Record<CompanyStatus, BadgeTone> = { active: 'green', onboarding: 'gold', suspended: 'brick' }
export function CompanyStatusBadge({ status }: { status: CompanyStatus }) { return <Badge tone={COMPANY_TONE[status]} dot>{A.common.companyStatus[status]}</Badge> }

const CHECK_TONE: Record<ProductCheck, BadgeTone> = { passed: 'green', overpriced: 'brick', pending: 'gold' }
export function CheckBadge({ check }: { check: ProductCheck }) { return <Badge tone={CHECK_TONE[check]} dot>{A.common.productCheck[check]}</Badge> }

const AUDIT_TONE: Record<AuditKind, BadgeTone> = { status: 'neutral', money: 'gold', price: 'gold', fee: 'brick', data: 'neutral', auth: 'blue' }
export function AuditKindBadge({ kind }: { kind: AuditKind }) { return <Badge tone={AUDIT_TONE[kind]} size="sm">{A.audit.kinds[kind]}</Badge> }

export function ProviderBadge({ p }: { p: 'payme' | 'click' | 'cash' | undefined }) {
  if (!p) return <span className="text-ink-3">—</span>
  return <Badge tone={p === 'payme' ? 'blue' : p === 'click' ? 'green' : 'outline'} size="sm">{A.common.payment[p]}</Badge>
}

/* ─── Error boundary ─────────────────────────────────────────────────── */
export class SectionBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return <div className="p-6"><ErrorState title={A.shell.loadError} hint={this.state.error.message} onRetry={() => this.setState({ error: null })} /></div>
    return this.props.children
  }
}

export { Field }
