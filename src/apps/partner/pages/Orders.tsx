import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PackageCheck, Truck, Warehouse } from 'lucide-react'
import { Avatar, Button, DataTable, Drawer, EmptyState, Ledger, LedgerRow, Money, ProductImage, Segmented, Timeline, type Column } from '@/design'
import { toast } from '../toast'
import { api } from '@/api'
import { useData } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import { uz, t } from '@/i18n/uz'
import { useAction } from '@/lib/hooks'
import { useCompany, useCompanySubs, useListLoading, type SubRow } from '../hooks'
import { P } from '../strings'
import { PageHeader, Stat, SubStatusBadge } from '../ui'

const ACTIVE = new Set(['packing', 'packed', 'handed_to_bts', 'in_transit', 'at_branch', 'return_requested'])

export function Orders() {
  const c = useCompany()
  const subs = useCompanySubs(c.id)
  const branches = useData((d) => d.branches)
  const users = useData((d) => d.users)
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<string | null>(params.get('id'))
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')
  const loading = useListLoading(c.id)
  useEffect(() => { if (params.has('id')) setParams({}, { replace: true }) }, [params, setParams])

  const rows = useMemo(() => subs.filter(({ so }) => filter === 'all' || (filter === 'active' ? ACTIVE.has(so.status) : !ACTIVE.has(so.status))), [subs, filter])
  const open = subs.find((r) => r.so.id === openId) ?? null
  const branchName = (id?: string) => branches.find((b) => b.id === id)?.name.replace(' (namuna)', '')
  const buyer = (id: string) => users.find((u) => u.id === id)

  const ready = useAction(api.partner.markReady)
  const handed = useAction(api.partner.handedToBts)
  const doReady = async (id: string) => { const r = await ready.run(id); if (r) toast.success(P.orders.readyDone, { description: r.waybill }) ; else if (ready.error) toast.error(ready.error.message) }
  const doHanded = async (id: string) => { const r = await handed.run(id); if (r) toast.success(P.orders.handedDone) ; else if (handed.error) toast.error(handed.error.message) }

  const columns: Column<SubRow>[] = [
    { key: 'id', header: P.orders.id, sortable: true, width: 120, sortValue: (r) => r.o.id, csv: (r) => r.o.id, render: (r) => <span className="font-mono text-[12px] text-ink">{r.o.id}</span> },
    { key: 'date', header: P.orders.date, sortable: true, width: 130, sortValue: (r) => r.o.createdAt, csv: (r) => r.o.createdAt, render: (r) => <span className="tnum text-ink-2">{formatDemoTime(r.o.createdAt)}</span> },
    { key: 'items', header: P.orders.items, csv: (r) => r.so.items.map((i) => i.title).join('; '), render: (r) => (
      <span className="flex items-center gap-2"><ProductImage id={r.so.items[0].image} className="h-7 w-7 shrink-0" fill={0.8} /><span className="clamp-1">{r.so.items.map((i) => `${i.title}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ')}</span></span>
    ) },
    { key: 'subtotal', header: P.orders.subtotal, sortable: true, align: 'right', width: 130, sortValue: (r) => r.so.subtotalTiyin, csv: (r) => r.so.subtotalTiyin / 100, render: (r) => <Money tiyin={r.so.subtotalTiyin} size="sm" className="font-medium" /> },
    { key: 'status', header: P.orders.status, sortable: true, width: 160, sortValue: (r) => r.so.status, csv: (r) => uz.orders.status[r.so.status], render: (r) => <SubStatusBadge status={r.so.status} size="sm" /> },
    { key: 'branch', header: P.orders.branch, width: 190, csv: (r) => branchName(r.so.branchId) ?? '', render: (r) => <span className="clamp-1 text-ink-2">{r.o.delivery.method === 'courier_tashkent' ? P.orders.courier : r.o.delivery.method === 'pickup' ? P.orders.pickup : branchName(r.so.branchId) ?? '—'}</span> },
    { key: 'waybill', header: P.orders.waybill, width: 140, csv: (r) => r.so.waybill ?? '', render: (r) => <span className="font-mono text-[12px] text-ink-2">{r.so.waybill ?? '—'}</span> },
  ]

  const steps = open ? open.so.timeline.map((e, i, arr) => ({ label: uz.orders.status[e.status], at: formatDemoTime(e.at), done: i < arr.length - 1, active: i === arr.length - 1, note: e.note })) : []

  return (
    <div>
      <PageHeader eyebrow={c.name} help={P.help.orders} title={P.nav.orders}>{t(P.orders.total, { n: subs.length })}</PageHeader>
      <DataTable<SubRow>
        columns={columns} rows={rows} rowKey={(r) => r.so.id} loading={loading} onRowClick={(r) => setOpenId(r.so.id)} pageSize={15} exportFilename={`${c.id}-buyurtmalar`}
        emptyState={<EmptyState compact icon="package-open" title={P.orders.empty} hint={P.orders.emptyHint} />}
        toolbarLeft={<Segmented aria-label={P.common.filters} value={filter} onChange={setFilter} options={[{ value: 'all', label: P.orders.all }, { value: 'active', label: P.orders.active }, { value: 'done', label: P.orders.done }]} />}
      />
      <Drawer open={Boolean(open)} onOpenChange={(v) => { if (!v) setOpenId(null) }} eyebrow={open ? `${open.o.id} · ${formatDemoTime(open.o.createdAt)}` : undefined} title={open?.so.items.map((i) => i.title).join(', ')}
        footer={open && c.model === 'self_ship' ? (
          <>
            <Button variant="secondary" leading={<PackageCheck />} disabled={open.so.status !== 'packing'} loading={ready.pending} onClick={() => void doReady(open.so.id)}>{P.orders.ready}</Button>
            <Button variant="gold" leading={<Truck />} disabled={open.so.status !== 'packed'} loading={handed.pending} onClick={() => void doHanded(open.so.id)}>{P.orders.handed}</Button>
          </>
        ) : undefined}>
        {open && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><SubStatusBadge status={open.so.status} />{open.so.waybill && <span className="font-mono text-[13px] text-ink-2">{P.orders.waybill}: {open.so.waybill}</span>}</div>
            {c.model !== 'self_ship' && (
              <div className="flex items-start gap-3 rounded-card bg-blue-soft p-3 text-[13.5px]"><Warehouse size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-blue" aria-hidden="true" /><div><div className="font-medium text-ink">{P.orders.warehouseNote}</div><div className="text-ink-2">{P.orders.warehouseHint}</div></div></div>
            )}
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {open.so.items.map((i) => (
                <li key={i.key} className="flex items-center gap-3"><ProductImage id={i.image} className="h-12 w-12 shrink-0" /><div className="min-w-0 flex-1"><div className="clamp-1 text-[14px] text-ink">{i.title}</div><div className="text-[12px] text-ink-3">{i.qty} {P.common.pcs}</div></div><Money tiyin={i.priceTiyin * i.qty} /></li>
              ))}
            </ul>
            <Ledger inset>
              <LedgerRow label={P.orders.subtotal} value={<Money tiyin={open.so.subtotalTiyin} />} />
              <LedgerRow label={`${P.orders.fee} · ${Math.round(c.commissionRate * 100)}%`} value={<Money tiyin={-(open.so.feeOverride?.amountTiyin ?? open.so.feeTiyin)} />} tone="brick" />
              <LedgerRow label={P.orders.net} value={<Money tiyin={open.so.subtotalTiyin - (open.so.feeOverride?.amountTiyin ?? open.so.feeTiyin)} />} emphasis />
            </Ledger>
            <div className="grid grid-cols-2 gap-3">
              <Stat label={P.orders.buyer} value={<span className="flex items-center gap-2"><Avatar name={buyer(open.o.buyerId)?.name ?? '?'} size={28} />{buyer(open.o.buyerId)?.name ?? '—'}</span>} />
              <Stat label={P.orders.branch} value={open.o.delivery.method === 'courier_tashkent' ? P.orders.courier : open.o.delivery.method === 'pickup' ? P.orders.pickup : branchName(open.so.branchId) ?? '—'} />
            </div>
            <div><div className="eyebrow mb-3">{P.orders.timeline}</div><Timeline steps={steps} /></div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
