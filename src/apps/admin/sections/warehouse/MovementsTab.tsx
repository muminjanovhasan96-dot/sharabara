import { useMemo, useState } from 'react'
import { Badge, DataTable, EmptyState, Input, Select, type Column } from '@/design'
import { useStore } from '@/store'
import { dateKey } from '@/domain/clock'
import type { MovementKind, SalesChannel, StockMovement } from '@/domain/types'
import { IdLink } from '../../components/ui'
import { useQueryParam } from '../../lib/hooks'
import { csvDate, fmtTime, staffName } from '../../lib/format'
import { A } from '../../strings'
import { CHANNELS, CHANNEL_TONE, KIND_TONE, channelLabel, inWh, isOrderId, isReceiptId, kindLabel, whShort, type WhFilter } from './lib'

const KINDS: MovementKind[] = ['in', 'out', 'adjust', 'transfer', 'return']

export function MovementsTab({ wh }: { wh: WhFilter }) {
  const data = useStore((s) => s.data)
  const M = A.warehouse.movements
  const [, setTab] = useQueryParam('tab')
  const [, setReceipt] = useQueryParam('receipt')
  const [kind, setKind] = useState('')
  const [channel, setChannel] = useState('')
  const [whF, setWhF] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const rows = useMemo(() => data.movements.filter((m) => {
    if (!inWh(wh, m.warehouseId) || (whF && m.warehouseId !== whF)) return false
    if (kind && m.kind !== kind) return false
    if (channel && m.channel !== channel) return false
    const d = dateKey(m.at)
    if (from && d < from) return false
    if (to && d > to) return false
    return true
  }), [data.movements, wh, whF, kind, channel, from, to])
  const product = (id: string) => data.products.find((p) => p.id === id)
  const ref = (m: StockMovement) => {
    if (!m.refId) return <span className="text-ink-3">—</span>
    if (isOrderId(m.refId)) return <IdLink to={`/orders?id=${m.refId}`}>{m.refId}</IdLink>
    if (isReceiptId(m.refId)) return <button type="button" className="tnum font-medium text-blue underline-offset-4 hover:underline" onClick={(e) => { e.stopPropagation(); setTab('receipts'); setReceipt(m.refId ?? null) }}>{m.refId}</button>
    if (data.warehouses.some((w) => w.id === m.refId)) return <span className="text-ink-2">{whShort(data, m.refId)}</span>
    return <span className="tnum text-ink-2">{m.refId}</span>
  }
  const cols: Column<StockMovement>[] = [
    { key: 'at', header: M.time, sortable: true, width: 120, render: (m) => <span className="tnum text-ink-2">{fmtTime(m.at)}</span>, csv: (m) => csvDate(m.at) },
    { key: 'productId', header: M.product, sortable: true, sortValue: (m) => product(m.productId)?.title ?? '', render: (m) => { const p = product(m.productId); return <span className="flex min-w-0 max-w-[280px] items-baseline gap-2"><span className="truncate">{p?.title ?? m.productId}</span><span className="tnum shrink-0 text-[11.5px] text-ink-3">{p?.sku}</span></span> }, csv: (m) => product(m.productId)?.title ?? m.productId },
    { key: 'warehouseId', header: M.warehouse, sortable: true, width: 130, render: (m) => <span className="truncate text-ink-2">{whShort(data, m.warehouseId)}</span>, csv: (m) => whShort(data, m.warehouseId) },
    { key: 'kind', header: M.kind, sortable: true, width: 100, render: (m) => <Badge tone={KIND_TONE[m.kind]} size="sm">{kindLabel(m.kind)}</Badge>, csv: (m) => kindLabel(m.kind) },
    { key: 'qty', header: M.qty, sortable: true, align: 'right', width: 70, render: (m) => <span className={`tnum font-semibold ${m.qty > 0 ? 'text-green' : 'text-brick'}`}>{m.qty > 0 ? `+${m.qty}` : `−${Math.abs(m.qty)}`}</span> },
    { key: 'channel', header: M.channel, sortable: true, width: 100, sortValue: (m) => m.channel ?? '', render: (m) => m.channel ? <Badge tone={CHANNEL_TONE[m.channel]} size="sm">{channelLabel(m.channel)}</Badge> : <span className="text-ink-3">—</span>, csv: (m) => m.channel ? channelLabel(m.channel) : '' },
    { key: 'refId', header: M.ref, width: 100, render: ref, csv: (m) => m.refId ?? '' },
    { key: 'by', header: M.by, width: 140, render: (m) => <span className="truncate text-ink-2">{m.by === 'system' ? M.system : staffName(data, m.by)}</span>, csv: (m) => m.by === 'system' ? M.system : staffName(data, m.by) },
    { key: 'note', header: M.note, width: 170, render: (m) => <span className="truncate text-ink-2" title={m.note}>{m.note ?? ''}</span>, csv: (m) => m.note ?? '' },
  ]
  return (
    <DataTable columns={cols} rows={rows} rowKey={(m) => m.id} pageSize={20} exportFilename="harakatlar" defaultSort={{ key: 'at', dir: 'desc' }}
      toolbarLeft={<div className="flex flex-wrap items-center gap-2">
        <div className="w-36"><Select size="sm" value={kind} onChange={(e) => setKind(e.target.value)} aria-label={M.kind} options={[{ value: '', label: M.kind_all }, ...KINDS.map((k) => ({ value: k, label: kindLabel(k) }))]} /></div>
        <div className="w-40"><Select size="sm" value={channel} onChange={(e) => setChannel(e.target.value)} aria-label={M.channel} options={[{ value: '', label: M.channel_all }, ...CHANNELS.map((c) => ({ value: c, label: channelLabel(c as SalesChannel) }))]} /></div>
        {wh === 'all' && <div className="w-44"><Select size="sm" value={whF} onChange={(e) => setWhF(e.target.value)} aria-label={M.warehouse} options={[{ value: '', label: M.warehouse_all }, ...data.warehouses.map((w) => ({ value: w.id, label: whShort(data, w.id) }))]} /></div>}
        <Input size="sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={A.orders.dateFrom} className="w-38" />
        <Input size="sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={A.orders.dateTo} className="w-38" />
        <span className="tnum text-[12.5px] text-ink-3">{rows.length}</span>
      </div>}
      emptyState={<EmptyState compact icon="scroll-text" title={M.empty} hint={M.emptyHint} />} />
  )
}
