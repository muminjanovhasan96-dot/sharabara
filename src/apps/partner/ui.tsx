import type { ReactNode } from 'react'
import { Badge, HelpPopover, type BadgeTone, type HelpContent } from '@/design'
import { percent } from '@/domain/money'
import type { Product, SubOrderStatus, PayoutStatus } from '@/domain/types'
import { uz } from '@/i18n/uz'
import { cn } from '@/lib/utils'
import { P } from './strings'

/** Sahifa sarlavhasi: eyebrow + Inter title + o'ng tomonda amallar. */
export function PageHeader({ eyebrow, title, actions, children, help }: { eyebrow?: ReactNode; title: ReactNode; actions?: ReactNode; children?: ReactNode; help?: HelpContent }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <div className="flex items-center gap-1.5"><h1 className="m-0 font-display text-[24px] leading-tight tracking-[-0.02em] text-ink">{title}</h1>{help && <HelpPopover title={typeof title === 'string' ? title : ''} help={help} />}</div>
        {help && <div className="mt-1 text-[14px] text-ink-2">{help.sub}</div>}
        {children && <div className="mt-1 text-[13px] text-ink-3">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** "O’tdi · −9%" / "Qimmat · +5%" / "Tekshiruvda" */
export function CheckBadge({ product, size = 'md' }: { product: Pick<Product, 'check' | 'checkDelta'>; size?: 'sm' | 'md' }) {
  if (product.check === 'pending') return <Badge tone="neutral" size={size} dot>{P.products.checkPending}</Badge>
  if (product.check === 'overpriced') return <Badge tone="brick" size={size} dot>{P.products.checkOver} · {percent(product.checkDelta)}</Badge>
  return <Badge tone="green" size={size} dot>{P.products.checkPassed} · {percent(product.checkDelta)}</Badge>
}

const SUB_TONE: Record<SubOrderStatus, BadgeTone> = {
  packing: 'gold', packed: 'gold', handed_to_bts: 'blue', in_transit: 'blue', at_branch: 'blue', delivered: 'green',
  payout_scheduled: 'green', payout_paid: 'green', cancelled: 'neutral', return_requested: 'brick', return_approved: 'brick', return_denied: 'neutral', refunded: 'brick',
}
export function SubStatusBadge({ status, size = 'md' }: { status: SubOrderStatus; size?: 'sm' | 'md' }) {
  return <Badge tone={SUB_TONE[status]} size={size} dot>{uz.orders.status[status]}</Badge>
}

const PAYOUT_TONE: Record<PayoutStatus, BadgeTone> = { pending: 'neutral', scheduled: 'gold', awaiting_second_approval: 'gold', paid: 'green' }
export function PayoutBadge({ status }: { status: PayoutStatus }) {
  return <Badge tone={PAYOUT_TONE[status]} dot>{P.billing.payoutStatus[status]}</Badge>
}

/** Kichik statistika qatori: label + value */
export function Stat({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="eyebrow">{label}</span>
      <span className="tnum text-[15px] font-medium text-ink">{value}</span>
    </div>
  )
}

/** Kod bloki (API hujjatlari uchun) */
export function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="overflow-hidden rounded-[12px] text-white" style={{ background: '#0f1f3a' }}>
      {title && <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 font-mono text-[12px] text-white/70"><span className="h-2 w-2 rounded-full bg-gold-fill" aria-hidden="true" />{title}</div>}
      <pre className="scroll-thin m-0 overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed text-white/90"><code>{code}</code></pre>
    </div>
  )
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}
