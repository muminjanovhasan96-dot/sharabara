import { useMemo, useState } from 'react'
import { Badge, Button, DataTable, EmptyState, Field, Input, Money, Select, Textarea, Timeline, Skeleton, exportCsv, type Column } from '@/design'
import { useNow, useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { dateKey } from '@/domain/clock'
import { orderMachine, subOrderMachine, ORDER_STATUS_UZ } from '@/domain/machines'
import type { Order, SubOrder, SubOrderStatus } from '@/domain/types'
import { AdminConfirm, AdminDrawer, AuditKindBadge, BulkBar, EscrowBadge, IdLink, KV, KVGrid, OrderStatusBadge, SectionTitle, SubStatusBadge, Toolbar, ViewChips } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useQueryParam, useSavedViews, useSectionLoading, type SavedView } from '../lib/hooks'
import { branchOf, fmtTime, regionName, sellerLabel, userName } from '../lib/format'
import { A } from '../strings'

interface F { status: string; source: string; region: string; from: string; to: string; view?: string }
const EMPTY: F = { status: '', source: '', region: '', from: '', to: '' }

export function Orders() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const access = useAccess('orders')
  const staffId = useStore((s) => s.session.staffId)
  const loading = useSectionLoading()
  const [qid, setQid] = useQueryParam('id')
  const [qview] = useQueryParam('view')
  const [sel, setSel] = useState<string[]>([])
  const [f, setF] = useState<F>(() => (qview === 'today' ? { ...EMPTY, view: 'today' } : EMPTY))
  const [activeView, setActiveView] = useState<string | null>(qview === 'today' ? A.orders.views.today : A.orders.views.all)
  const presets = useMemo<SavedView<F>[]>(() => [
    { name: A.orders.views.all, filters: EMPTY }, { name: A.orders.views.today, filters: { ...EMPTY, view: 'today' } },
    { name: A.orders.views.escrow, filters: { ...EMPTY, view: 'escrow' } }, { name: A.orders.views.cancelled, filters: { ...EMPTY, status: 'cancelled' } },
    { name: A.orders.views.myQueue, filters: { ...EMPTY, view: 'packing' } },
  ], [])
  const { views, custom, save, remove } = useSavedViews<F>('orders', presets)
  const today = dateKey(now)
  const rows = useMemo(() => data.orders.filter((o) => {
    if (f.status && o.status !== f.status) return false
    if (f.source && o.subOrders[0]?.items[0]?.source !== f.source) return false
    if (f.region && branchOf(data, o.delivery.branchId)?.regionId !== f.region) return false
    const d = dateKey(o.createdAt)
    if (f.from && d < f.from) return false
    if (f.to && d > f.to) return false
    if (f.view === 'today' && d !== today) return false
    if (f.view === 'escrow' && o.payment.escrow !== 'held') return false
    if (f.view === 'packing' && !o.subOrders.some((so) => so.status === 'packing')) return false
    return true
  }), [data, f, today])
  const selected = qid ? data.orders.find((o) => o.id === qid) : undefined

  const cols: Column<Order>[] = [
    { key: 'id', header: A.common.id, sortable: true, width: 100, render: (o) => <span className="tnum font-medium">{o.id}</span> },
    { key: 'createdAt', header: A.common.date, sortable: true, width: 130, render: (o) => <span className="text-ink-2">{fmtTime(o.createdAt)}</span> },
    { key: 'buyerId', header: A.common.buyer, sortable: true, render: (o) => userName(data, o.buyerId), csv: (o) => userName(data, o.buyerId), sortValue: (o) => userName(data, o.buyerId) },
    { key: 'source', header: A.orders.source, width: 80, render: (o) => <Badge tone={o.subOrders[0]?.items[0]?.source === 'product' ? 'blue' : 'neutral'} size="sm">{A.common.source[o.subOrders[0]?.items[0]?.source ?? 'listing']}</Badge>, csv: (o) => o.subOrders[0]?.items[0]?.source ?? '' },
    { key: 'region', header: A.common.region, sortable: true, width: 140, render: (o) => regionName(data, branchOf(data, o.delivery.branchId)?.regionId), csv: (o) => regionName(data, branchOf(data, o.delivery.branchId)?.regionId), sortValue: (o) => regionName(data, branchOf(data, o.delivery.branchId)?.regionId) },
    { key: 'totalTiyin', header: A.common.total, sortable: true, align: 'right', width: 130, render: (o) => <Money tiyin={o.totalTiyin} size="sm" />, csv: (o) => o.totalTiyin / 100 },
    { key: 'status', header: A.common.status, sortable: true, width: 130, render: (o) => <OrderStatusBadge status={o.status} /> },
    { key: 'escrow', header: A.orders.escrow, width: 140, render: (o) => <EscrowBadge status={o.payment.escrow} size="sm" />, csv: (o) => o.payment.escrow },
    { key: 'subs', header: A.orders.subOrders, width: 150, render: (o) => <span className="flex gap-1">{o.subOrders.slice(0, 2).map((so) => <SubStatusBadge key={so.id} status={so.status} size="sm" />)}{o.subOrders.length > 2 && <Badge size="sm">+{o.subOrders.length - 2}</Badge>}</span>, csv: (o) => o.subOrders.map((s) => s.status).join('|') },
  ]
  const regions = data.regions.map((r) => ({ value: r.id, label: r.name }))
  const pick = (v: SavedView<F>) => { setF(v.filters); setActiveView(v.name) }
  const set = (p: Partial<F>) => { setF((x) => ({ ...x, ...p, view: undefined })); setActiveView(null) }

  return (
    <div className="flex flex-col gap-3 p-5">
      <Toolbar right={<ViewChips views={views} active={activeView} onPick={pick} onSave={(name, filters) => { save({ name, filters }); setActiveView(name) }} onRemove={remove} current={f} customNames={custom.map((c) => c.name)} />}>
        <div className="w-44"><Select size="sm" value={f.status} onChange={(e) => set({ status: e.target.value })} aria-label={A.common.status} options={[{ value: '', label: `${A.common.status}: ${A.common.all}` }, ...(['paid', 'completed', 'cancelled', 'created'] as const).map((s) => ({ value: s, label: ORDER_STATUS_UZ[s] }))]} /></div>
        <div className="w-36"><Select size="sm" value={f.source} onChange={(e) => set({ source: e.target.value })} aria-label={A.orders.source} options={[{ value: '', label: `${A.orders.source}: ${A.common.all}` }, { value: 'listing', label: A.common.source.listing }, { value: 'product', label: A.common.source.product }]} /></div>
        <div className="w-44"><Select size="sm" value={f.region} onChange={(e) => set({ region: e.target.value })} aria-label={A.common.region} options={[{ value: '', label: `${A.common.region}: ${A.common.all}` }, ...regions]} /></div>
        <Input size="sm" type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} aria-label={A.orders.dateFrom} className="w-40" />
        <Input size="sm" type="date" value={f.to} onChange={(e) => set({ to: e.target.value })} aria-label={A.orders.dateTo} className="w-40" />
      </Toolbar>
      <BulkBar count={sel.length} onClear={() => setSel([])}>
        <Button size="sm" variant="gold" onClick={() => exportCsv('buyurtmalar-tanlangan', cols, rows.filter((o) => sel.includes(o.id)))}>{uz.admin.export}</Button>
      </BulkBar>
      {loading ? <Skeleton height={480} className="rounded-card" /> : (
        <DataTable columns={cols} rows={rows} rowKey={(o) => o.id} onRowClick={(o) => setQid(o.id)} pageSize={15} exportFilename="buyurtmalar" defaultSort={{ key: 'createdAt', dir: 'desc' }} selectable selected={sel} onSelectionChange={setSel}
          toolbarLeft={<span className="tnum text-[12.5px] text-ink-2">{rows.length} / {data.orders.length}</span>}
          emptyState={<EmptyState compact icon="shopping-bag" title={A.common.empty} hint={A.common.emptyHint} />} />
      )}
      <AdminDrawer open={!!selected} onOpenChange={(o) => !o && setQid(null)} width="lg" eyebrow={uz.admin.sections.orders} title={selected ? <span className="tnum">{selected.id}</span> : undefined}
        actions={selected && <><OrderStatusBadge status={selected.status} /><EscrowBadge status={selected.payment.escrow} /></>}>
        {selected && <OrderDetail o={selected} canEdit={access.edit} canApprove={access.approve} staffId={staffId} />}
      </AdminDrawer>
    </div>
  )
}

function OrderDetail({ o, canEdit, canApprove }: { o: Order; canEdit: boolean; canApprove: boolean; staffId: string }) {
  const data = useStore((s) => s.data)
  const { run, pending } = useAct()
  const [cancel, setCancel] = useState(false)
  const br = branchOf(data, o.delivery.branchId)
  const ids = [o.id, ...o.subOrders.map((s) => s.id)]
  const audit = data.audit.filter((a) => ids.includes(a.entityId)).slice(0, 30)
  return (
    <div className="flex flex-col gap-5">
      <KVGrid cols={4}>
        <KV label={A.common.buyer}><IdLink to={`/users?id=${o.buyerId}`}>{userName(data, o.buyerId)}</IdLink></KV>
        <KV label={A.common.date}>{fmtTime(o.createdAt)}</KV>
        <KV label={A.orders.payment}>{A.common.payment[o.payment.method]}{o.payment.txId && <span className="tnum block text-[12px] text-ink-3">{o.payment.txId}</span>}</KV>
        <KV label={A.common.total}><Money tiyin={o.totalTiyin} size="md" /><span className="block text-[12px] text-ink-3">{A.orders.delivery}: <Money tiyin={o.delivery.feeTiyin} size="xs" /></span></KV>
        <KV label={A.orders.delivery} className="col-span-2">{A.common.delivery[o.delivery.method]}{br && <span className="block text-[12.5px] text-ink-2">{br.name} · {regionName(data, br.regionId)} · {br.address}</span>}{o.delivery.address && <span className="block text-[12.5px] text-ink-2">{o.delivery.address}</span>}</KV>
        {o.rating && <KV label={A.orders.rating}>{'★'.repeat(o.rating.stars)}<span className="text-ink-3">{'★'.repeat(5 - o.rating.stars)}</span><span className="block text-[12px] text-ink-2">{o.rating.comment}</span></KV>}
      </KVGrid>

      <div>
        <SectionTitle>{A.orders.subOrders} · {o.subOrders.length}</SectionTitle>
        <div className="flex flex-col gap-3">
          {o.subOrders.map((so) => <SubOrderCard key={so.id} o={o} so={so} canEdit={canEdit} />)}
        </div>
      </div>

      <div>
        <SectionTitle right={<IdLink to={`/audit?q=${o.id}`}>{uz.admin.sections.audit}</IdLink>}>{A.orders.audit} · {audit.length}</SectionTitle>
        {audit.length === 0 ? <EmptyState compact title={A.common.empty} /> : (
          <ul className="m-0 list-none divide-y divide-line p-0 text-[12.5px]">
            {audit.map((a) => (
              <li key={a.id} className="flex items-center gap-2 py-1.5">
                <span className="tnum w-[92px] shrink-0 text-ink-3">{fmtTime(a.at)}</span>
                <AuditKindBadge kind={a.kind} />
                <span className="min-w-0 flex-1 truncate"><span className="text-ink-2">{a.actorName}</span> · <span className="tnum">{a.entityId}</span> · {a.field}: {a.from ?? '—'} → <span className="font-medium">{a.to ?? '—'}</span>{a.note && <span className="text-ink-3"> · {a.note}</span>}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {orderMachine.can(o.status, 'cancelled') && (
        <div className="flex justify-end border-t border-line pt-3">
          <Button variant="danger" size="sm" disabled={!canApprove} loading={pending === 'cancel'} onClick={() => setCancel(true)}>{A.orders.cancel}</Button>
        </div>
      )}
      <AdminConfirm open={cancel} onOpenChange={setCancel} title={A.orders.cancel} description={o.id} tone="destructive" requireReason reasonPlaceholder={A.orders.cancelReason} confirmLabel={A.orders.cancel}
        onConfirm={async (reason) => { setCancel(false); await run('cancel', () => api.orders.cancel(o.id, reason ?? ''), A.orders.cancelled) }} />
    </div>
  )
}

function SubOrderCard({ o, so, canEdit }: { o: Order; so: SubOrder; canEdit: boolean }) {
  const data = useStore((s) => s.data)
  const { run, pending } = useAct()
  const next = subOrderMachine.next(so.status)
  const [to, setTo] = useState<SubOrderStatus | ''>('')
  const [note, setNote] = useState('')
  const steps = so.timeline.map((e, i) => ({ label: uz.orders.status[e.status], at: fmtTime(e.at), done: i < so.timeline.length - 1, active: i === so.timeline.length - 1, note: e.note }))
  return (
    <div className="rounded-card border border-line bg-paper p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><span className="tnum font-medium">{so.id}</span><SubStatusBadge status={so.status} /><span className="text-[12.5px] text-ink-2">{sellerLabel(data, so.sellerKey)}</span></div>
        <div className="flex items-center gap-3 text-[12.5px]">{so.waybill && <span className="tnum text-ink-2">{uz.orders.waybill}: {so.waybill}</span>}<Money tiyin={so.subtotalTiyin} size="sm" /><span className="text-ink-3">{A.orders.fee}: <Money tiyin={so.feeOverride?.amountTiyin ?? so.feeTiyin} size="xs" /></span></div>
      </div>
      <ul className="m-0 mt-2 list-none p-0 text-[13px]">
        {so.items.map((i) => <li key={i.key} className="flex justify-between gap-2"><span className="truncate">{i.title} <span className="text-ink-3">× {i.qty}</span></span><Money tiyin={i.priceTiyin * i.qty} size="sm" /></li>)}
      </ul>
      {so.problem && <div className="mt-2 rounded-[8px] bg-brick-soft px-2.5 py-1.5 text-[12.5px] text-brick">{uz.orders.problem}: {so.problem}</div>}
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_240px] gap-4">
        <Timeline steps={steps} compact />
        <div className="flex flex-col gap-2">
          <div className="eyebrow !text-[10px]">{A.orders.changeStatus}</div>
          {next.length === 0 ? <span className="text-[12.5px] text-ink-3">{A.orders.noTransitions}</span> : (
            <>
              <Select size="sm" value={to} onChange={(e) => setTo(e.target.value as SubOrderStatus)} disabled={!canEdit} aria-label={A.orders.newStatus} placeholder={A.orders.newStatus} options={next.map((s) => ({ value: s, label: uz.orders.status[s] }))} />
              <Field><Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`${A.common.note} (${uz.app.optional})`} disabled={!canEdit} /></Field>
              <Button size="sm" variant="secondary" disabled={!canEdit || !to} loading={pending === so.id} onClick={() => run(so.id, () => api.orders.setSubStatus(o.id, so.id, to as SubOrderStatus, note || undefined), A.orders.statusChanged).then(() => { setTo(''); setNote('') })}>{A.common.apply}</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
