import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Copy, Star, TriangleAlert, Upload } from 'lucide-react'
import { useStore, useNow } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { cn } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { formatDemoTime } from '@/domain/clock'
import { Badge, BottomSheet, Button, ErrorState, Field, Ledger, LedgerRow, Money, ProductImage, Select, Tabs, TabsList, TabsTrigger, Textarea, Timeline, toast, usePhoneContainer } from '@/design'
import { EmptyState } from '../components/Ui'
import type { BadgeTone } from '@/design'
import type { Order, SubOrder, SubOrderStatus } from '@/domain/types'
import { ms } from '../strings'
import { copyText, timeAgo, useList, useMeId, useScreenLoad } from '../lib'
import { Screen } from '../components/Screen'
import { RowsSkeleton } from '../components/Cards'

const TONE: Partial<Record<SubOrderStatus, BadgeTone>> = {
  packing: 'neutral', packed: 'blue', handed_to_bts: 'blue', in_transit: 'blue', at_branch: 'gold', delivered: 'green', payout_scheduled: 'green', payout_paid: 'green',
  cancelled: 'brick', return_requested: 'brick', return_approved: 'brick', return_denied: 'neutral', refunded: 'brick',
}
const HAPPY: SubOrderStatus[] = ['packed', 'handed_to_bts', 'in_transit', 'at_branch', 'delivered']
const ACTIVE = new Set<SubOrderStatus>(['packing', 'packed', 'handed_to_bts', 'in_transit', 'at_branch', 'return_requested'])

export function orderStatus(o: Order): { label: string; tone: BadgeTone } {
  if (o.status === 'cancelled') return { label: uz.orders.status.cancelled, tone: 'brick' }
  const so = o.subOrders[0]
  const worst = o.subOrders.find((x) => ACTIVE.has(x.status)) ?? so
  return { label: uz.orders.status[worst.status], tone: TONE[worst.status] ?? 'neutral' }
}

export default function OrdersList() {
  const nav = useAppNavigate()
  const meId = useMeId()
  const now = useNow()
  const { loading, error, reload } = useScreenLoad([meId])
  const orders = useList((s) => s.data.orders.filter((o) => o.buyerId === meId).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  const [tab, setTab] = useState('active')
  const shown = useMemo(() => orders.filter((o) => (tab === 'active' ? o.status === 'paid' && o.subOrders.some((so) => ACTIVE.has(so.status)) : !(o.status === 'paid' && o.subOrders.some((so) => ACTIVE.has(so.status))))), [orders, tab])
  return (
    <Screen back backTo="/profile" title={uz.orders.title} withTabBar>
      <Tabs value={tab} onValueChange={setTab} variant="segmented" size="sm">
        <TabsList fullWidth className="mt-3"><TabsTrigger value="active">{ms.orders.active}</TabsTrigger><TabsTrigger value="done">{ms.orders.done}</TabsTrigger></TabsList>
      </Tabs>
      <div className="pt-3">
        {error ? <ErrorState onRetry={reload} /> : loading ? <RowsSkeleton n={3} /> : shown.length === 0 ? (
          <EmptyState icon="package" title={uz.orders.empty} action={<Button variant="secondary" onClick={() => nav('/catalog')}>{ms.cart.goCatalog}</Button>} />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {shown.map((o) => {
              const st = orderStatus(o)
              const items = o.subOrders.flatMap((so) => so.items)
              return (
                <li key={o.id}>
                  <button type="button" onClick={() => nav(`/orders/${o.id}`)} className="flex w-full items-center gap-3 rounded-card bg-card p-3 text-left shadow-soft active:bg-paper-2">
                    <div className="w-16 shrink-0"><ProductImage id={items[0]?.image ?? 'ill-phone-1'} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2"><span className="tnum text-[12px] text-ink-3">{o.id}</span><span className="text-[11px] text-ink-3">{timeAgo(o.createdAt, now)}</span></div>
                      <div className="clamp-1 text-[14px] font-medium">{items.map((i) => i.title).join(', ')}</div>
                      <div className="mt-1 flex items-center justify-between gap-2"><Badge tone={st.tone} size="sm" dot>{st.label}</Badge><Money tiyin={o.totalTiyin} size="md" className="font-bold" /></div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Screen>
  )
}

function SubOrderCard({ order, so, branchName, onProblem }: { order: Order; so: SubOrder; branchName?: string; onProblem: () => void }) {
  const delivered = ['delivered', 'payout_scheduled', 'payout_paid'].includes(so.status)
  const at = (s: SubOrderStatus) => so.timeline.find((e) => e.status === s)?.at
  const raw = [
    { label: uz.orders.timeline.paid, at: order.payment.paidAt ?? at('packing'), done: true },
    ...HAPPY.map((s) => ({ label: uz.orders.timeline[s as keyof typeof uz.orders.timeline], at: at(s), done: at(s) !== undefined })),
  ]
  const firstOpen = raw.findIndex((x) => !x.done)
  const steps = raw.map((x, i) => ({ label: x.label, at: x.at ? formatDemoTime(x.at) : undefined, done: x.done, active: i === firstOpen }))
  const problem = ['return_requested', 'return_approved', 'return_denied', 'refunded', 'cancelled'].includes(so.status)
  return (
    <section className="rounded-card bg-card shadow-soft">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0"><div className="text-[11px] font-medium text-ink-3">{ms.orders.seller}</div><div className="clamp-1 text-[14px] font-semibold">{so.sellerName}</div></div>
        <Badge tone={TONE[so.status] ?? 'neutral'} dot>{uz.orders.status[so.status]}</Badge>
      </header>
      <div className="flex flex-col gap-2 px-4 py-3">
        {so.items.map((c) => <div key={c.key} className="flex items-center gap-3"><div className="w-12 shrink-0"><ProductImage id={c.image} /></div><div className="clamp-2 flex-1 text-[13.5px]">{c.title}{c.qty > 1 ? ` ×${c.qty}` : ''}</div><Money tiyin={c.priceTiyin * c.qty} size="sm" /></div>)}
      </div>
      {problem ? (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-card bg-brick-soft px-3 py-2.5 text-[13px] font-medium text-brick"><TriangleAlert size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />{so.problem ?? uz.orders.status[so.status]}{so.timeline.at(-1) ? ` · ${formatDemoTime(so.timeline.at(-1)!.at)}` : ''}</div>
      ) : (
        <div className="px-4 pb-3"><Timeline data-testid={TID.mOrderTimeline} steps={steps} compact /></div>
      )}
      <Ledger className="border-t border-line px-4">
        <LedgerRow label={uz.orders.waybill} noDots value={so.waybill ? (
          <button type="button" onClick={async () => { if (await copyText(so.waybill!)) toast.success(uz.app.copied) }} className="tnum inline-flex items-center gap-1.5 font-semibold text-blue"><span>{so.waybill}</span><Copy size={14} strokeWidth={1.75} /></button>
        ) : <span className="text-[12px] text-ink-3">{ms.orders.noWaybill}</span>} />
        {branchName && <LedgerRow label={ms.orders.branch} value={<span className="clamp-1 max-w-[190px] text-[13px]">{branchName}</span>} sub={so.status === 'at_branch' ? ms.orders.smsCode : undefined} />}
      </Ledger>
      {(delivered || so.status === 'at_branch') && !problem && so.status !== 'payout_paid' && (
        <div className="border-t border-line px-4 py-2.5"><Button variant="ghost" size="sm" onClick={onProblem} leading={<TriangleAlert strokeWidth={1.75} />} className="text-brick">{uz.orders.problem}</Button></div>
      )}
    </section>
  )
}

export function OrderDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const nav = useAppNavigate()
  const container = usePhoneContainer()
  const order = useStore((s) => s.data.orders.find((o) => o.id === id))
  const branches = useStore((s) => s.data.branches)
  const { error, reload } = useScreenLoad([id])
  const [problemFor, setProblemFor] = useState<SubOrder | null>(null)
  const [reason, setReason] = useState<string>(uz.orders.returnReasons[0])
  const [desc, setDesc] = useState('')
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  if (!order) return <Screen back backTo="/orders" title={ms.orders.detail}><ErrorState title={ms.common.notFound} onRetry={() => nav('/orders')} retryLabel={uz.orders.title} /></Screen>
  const branch = branches.find((b) => b.id === order.delivery.branchId)
  const st = orderStatus(order)
  const canRate = !order.rating && order.subOrders.some((so) => ['delivered', 'payout_scheduled', 'payout_paid'].includes(so.status))
  const escrow = order.payment.escrow === 'held' ? ms.orders.escrowHeld : order.payment.escrow === 'released' ? ms.orders.escrowReleased : order.payment.escrow === 'none' ? uz.checkout.pay.cash : ms.orders.escrowRefunded

  const submitProblem = async () => {
    if (!problemFor) return
    setBusy(true)
    try {
      await api.orders.requestReturn(order.id, problemFor.id, reason, desc.trim(), files.map((f) => f.name))
      toast.success(ms.orders.problemSent, { description: uz.orders.returnSent }); setProblemFor(null); setDesc(''); setFiles([])
    } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error) } finally { setBusy(false) }
  }
  const rate = async () => {
    if (!stars) return
    setBusy(true)
    try { await api.orders.rate(order.id, stars, comment.trim()); toast.gold(ms.orders.rated) } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error) } finally { setBusy(false) }
  }

  return (
    <Screen back backTo="/orders" title={`${ms.orders.detail} ${order.id}`} eyebrow={formatDemoTime(order.createdAt)}>
      {error && <ErrorState compact onRetry={reload} className="mt-3" />}
      <div className="flex flex-col gap-4 pt-3">
        <div className="flex items-center justify-between gap-3 rounded-card bg-card px-4 py-3 shadow-soft">
          <Badge tone={st.tone} dot>{st.label}</Badge>
          <div className="text-right"><Money tiyin={order.totalTiyin} size="xl" softCurrency className="text-ink" /><div className="text-[11.5px] text-ink-3">{uz.checkout.pay[order.payment.method]} · {escrow}</div></div>
        </div>
        {order.subOrders.map((so) => <SubOrderCard key={so.id} order={order} so={so} branchName={branch?.name} onProblem={() => setProblemFor(so)} />)}
        <Ledger inset title={ms.orders.payment} className="!border-0 shadow-soft">
          <LedgerRow label={ms.checkout.items} value={<Money tiyin={order.itemsTiyin} size="sm" />} />
          <LedgerRow label={uz.checkout.deliveryFee} value={<Money tiyin={order.delivery.feeTiyin} size="sm" />} sub={uz.checkout.method[order.delivery.method]} />
          <LedgerRow label={uz.cart.total} value={<Money tiyin={order.totalTiyin} size="md" />} emphasis />
        </Ledger>
        {order.rating ? (
          <div className="rounded-card bg-card px-4 py-3 shadow-soft"><div className="eyebrow">{ms.orders.yourRating}</div><div className="mt-1 flex items-center gap-1 text-gold-fill">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={18} strokeWidth={1.75} fill={i < order.rating!.stars ? 'currentColor' : 'none'} className={i < order.rating!.stars ? '' : 'text-line-strong'} />)}</div>{order.rating.comment && <p className="m-0 mt-1 text-[13.5px] text-ink-2">{order.rating.comment}</p>}</div>
        ) : canRate && (
          <section className="rounded-card bg-gold-soft px-4 py-3">
            <div className="font-display text-[16px]">{ms.orders.rateTitle}</div>
            <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label={uz.orders.rate}>
              {Array.from({ length: 5 }, (_, i) => (
                <button key={i} type="button" role="radio" aria-checked={stars === i + 1} onClick={() => setStars(i + 1)} className="inline-flex h-11 w-11 items-center justify-center text-gold-fill"><Star size={28} strokeWidth={1.5} fill={i < stars ? 'currentColor' : 'none'} className={cn(i >= stars && 'text-line-strong')} /></button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={ms.orders.ratePlaceholder} rows={2} className="mt-2" />
            <Button variant="gold" className="mt-2" onClick={rate} disabled={!stars} loading={busy}>{ms.orders.rateSend}</Button>
          </section>
        )}
      </div>

      <BottomSheet open={!!problemFor} onOpenChange={(o) => { if (!o) setProblemFor(null) }} container={container} snap="auto" title={ms.orders.problemTitle} eyebrow={problemFor?.items[0]?.title}
        footer={<Button variant="danger" fullWidth onClick={submitProblem} loading={busy}>{ms.orders.problemSend}</Button>}>
        <div className="flex flex-col gap-3 pt-1">
          <Field label={uz.app.reason} required><Select value={reason} onChange={(e) => setReason(e.target.value)} options={uz.orders.returnReasons.map((r) => ({ value: r, label: r }))} /></Field>
          <Field label={ms.orders.problemDesc}><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={ms.orders.problemDescPlaceholder} rows={3} /></Field>
          <Field label={ms.orders.problemPhotos}>
            <label className="flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-paper-2 px-4 text-[13.5px] text-ink-2">
              <Upload size={16} strokeWidth={1.75} />{uz.sell.addPhoto}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { const fs = Array.from(e.target.files ?? []); setFiles((prev) => [...prev, ...fs.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))]) }} />
            </label>
            {files.length > 0 && <div className="mt-2 flex gap-2 overflow-x-auto">{files.map((f) => <img key={f.url} src={f.url} alt={f.name} className="h-16 w-16 shrink-0 rounded-[8px] border border-line object-cover" />)}</div>}
          </Field>
          <p className="m-0 text-[12px] text-ink-3">{uz.orders.returnSent}</p>
        </div>
      </BottomSheet>
    </Screen>
  )
}
