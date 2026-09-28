import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, PackageCheck, Truck } from 'lucide-react'
import { Badge, Button, Countdown, DataTable, EmptyState, Money, Progress, Skeleton, Wordmark, type Column } from '@/design'
import { useNow, useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { TID } from '@/lib/testids'
import { dateKey, manifestLabel, setHour, parseIso } from '@/domain/clock'
import type { Manifest, Order, SubOrder } from '@/domain/types'
import { AdminModal, BulkBar, IdLink, ManifestStatusBadge, Panel, SubStatusBadge } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useQueryParam, useSectionLoading } from '../lib/hooks'
import { branchOf, fmtDate, regionName, userName, sellerLabel } from '../lib/format'
import { A } from '../strings'

interface Row { so: SubOrder; o: Order }

export function Logistics() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const access = useAccess('logistics')
  const loading = useSectionLoading()
  const { run, pending } = useAct()
  const [highlight] = useQueryParam('highlight')
  const [sel, setSel] = useState<string[]>([])
  const [label, setLabel] = useState<Row | null>(null)
  const today = dateKey(now)
  const past17 = parseIso(now).getHours() >= 17
  /** Ish kuni 9:00 → 17:00: qancha o'tdi (oltin progress) */
  const dayStart = parseIso(setHour(now, 9)).getTime()
  const dayEnd = parseIso(setHour(now, 17)).getTime()
  const dayPct = Math.max(0, Math.min(1, (parseIso(now).getTime() - dayStart) / Math.max(1, dayEnd - dayStart)))
  const openManifest = data.manifests.find((m) => m.status === 'open' && m.date === today) ?? data.manifests.find((m) => m.status === 'open')
  const closedManifest = data.manifests.find((m) => m.status === 'closed')
  const manifest = closedManifest ?? openManifest

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = []
    for (const o of data.orders) for (const so of o.subOrders) {
      if (!['packing', 'packed', 'handed_to_bts'].includes(so.status)) continue
      const inManifest = manifest?.subOrderIds.includes(so.id) || openManifest?.subOrderIds.includes(so.id)
      if (so.status === 'packing' || dateKey(o.createdAt) === today || inManifest) out.push({ so, o })
    }
    return out.sort((a, b) => a.o.createdAt.localeCompare(b.o.createdAt))
  }, [data.orders, manifest, openManifest, today])
  const packedCount = rows.filter((r) => r.so.status !== 'packing').length
  const byRegion = useMemo(() => { const m = new Map<string, number>(); for (const r of rows) { const reg = branchOf(data, r.so.branchId)?.regionId ?? 'toshkent_sh'; m.set(reg, (m.get(reg) ?? 0) + 1) } return [...m.entries()].sort((a, b) => b[1] - a[1]) }, [rows, data])
  const packable = sel.filter((id) => rows.find((r) => r.so.id === id)?.so.status === 'packing')

  const cols: Column<Row>[] = [
    { key: 'id', header: A.orders.subOrders, sortable: true, width: 110, sortValue: (r) => r.so.id, render: (r) => <span className="tnum font-medium">{r.so.id}</span>, csv: (r) => r.so.id },
    { key: 'order', header: uz.admin.sections.orders, width: 100, defaultHidden: true, render: (r) => <IdLink to={`/orders?id=${r.o.id}`}>{r.o.id}</IdLink>, csv: (r) => r.o.id },
    { key: 'buyer', header: A.common.buyer, width: 150, defaultHidden: true, render: (r) => userName(data, r.o.buyerId), csv: (r) => userName(data, r.o.buyerId) },
    { key: 'branch', header: A.common.branch, sortable: true, sortValue: (r) => branchOf(data, r.so.branchId)?.name ?? '', render: (r) => { const b = branchOf(data, r.so.branchId); return b ? <span>{b.name} <span className="text-ink-3">· {regionName(data, b.regionId)}</span></span> : <span className="text-ink-3">—</span> }, csv: (r) => branchOf(data, r.so.branchId)?.name ?? '' },
    { key: 'items', header: A.logistics.items, width: 220, render: (r) => <span className="truncate" title={r.so.items.map((i) => i.title).join(', ')}>{r.so.items.map((i) => i.title).join(', ')}</span>, csv: (r) => r.so.items.map((i) => i.title).join('; ') },
    { key: 'waybill', header: A.logistics.waybill, width: 150, render: (r) => r.so.waybill ? <span className="tnum">{r.so.waybill}</span> : <span className="text-ink-3">—</span>, csv: (r) => r.so.waybill ?? '' },
    { key: 'status', header: A.common.status, sortable: true, width: 130, sortValue: (r) => r.so.status, render: (r) => <SubStatusBadge status={r.so.status} />, csv: (r) => r.so.status },
    { key: 'act', header: A.common.actions, width: 230, hideable: false, render: (r) => (
      <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {r.so.status === 'packing' && <Button data-testid={TID.aPack} data-id={r.so.id} size="sm" variant="primary" leading={<PackageCheck strokeWidth={1.75} />} disabled={!access.edit} loading={pending === r.so.id} onClick={() => run(r.so.id, () => api.logistics.pack(r.so.id), A.logistics.packedToast)}>{A.logistics.pack}</Button>}
        {r.so.waybill && <Button data-testid={TID.aPrintWaybill} data-id={r.so.id} size="sm" variant="secondary" title={A.logistics.print} leading={<Printer strokeWidth={1.75} />} onClick={() => setLabel(r)}>{A.logistics.printShort}</Button>}
      </span>
    ) },
  ]

  if (loading) return <div className="flex flex-col gap-4 p-5"><div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={110} className="rounded-card" />)}</div><Skeleton height={380} className="rounded-card" /></div>

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(215px,1fr))]">
        <Panel eyebrow={A.logistics.cutoff}>
          {past17 ? (
            <div><div className="font-display text-[32px] font-bold leading-none tracking-[-0.02em] text-ink">{A.logistics.closed}</div><div className="mt-2 text-[12.5px] text-ink-2">{A.logistics.bts19}</div></div>
          ) : (
            <div><Countdown target={setHour(now, 17)} now={now} suffix={A.logistics.left} className="font-display text-[32px] font-bold leading-none tracking-[-0.02em] text-ink [&>span:last-child]:text-[14px]" urgentMs={30 * 60_000} /><div className="mt-2 text-[12.5px] text-ink-2">{A.logistics.bts19}</div></div>
          )}
          <Progress value={dayPct} max={1} tone="gold" className="mt-3" size="md" label={A.logistics.cutoff} />
        </Panel>
        <Panel eyebrow={A.logistics.packed}>
          <div className="font-display text-[32px] font-bold leading-none tracking-[-0.02em] text-ink tnum">{packedCount} <span className="text-[15px] font-normal text-ink-3">/ {rows.length}</span></div>
          <Progress value={packedCount} max={Math.max(1, rows.length)} tone={packedCount === rows.length ? 'green' : 'gold'} className="mt-3" size="md" label={A.logistics.packed} />
        </Panel>
        <Panel eyebrow={A.logistics.regions}>
          {byRegion.length === 0 ? <span className="text-[13px] text-ink-3">{A.logistics.empty}</span> : (
            <div className="flex flex-wrap gap-1.5">{byRegion.map(([r, n]) => <Badge key={r} tone="neutral">{regionName(data, r)} <span className="tnum ml-1 font-semibold text-ink">{n}</span></Badge>)}</div>
          )}
        </Panel>
        <Panel eyebrow={A.logistics.manifest} title={manifest ? <span className="tnum">{manifestLabel(manifest.id)}</span> : A.logistics.noManifest} actions={manifest && <ManifestStatusBadge status={manifest.status} />}>
          {manifest ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-2"><span className="tnum font-display text-[20px] font-bold text-ink">{manifest.subOrderIds.length}</span><span>{A.orders.subOrders.toLowerCase()}</span>{Object.entries(manifest.byRegion).map(([r, n]) => <Badge key={r} size="sm" tone="blue">{regionName(data, r)} · {n}</Badge>)}</div>
              <div className="flex flex-col gap-2">
                <Button data-testid={TID.aHandToBts} size="md" variant="gold" fullWidth className="h-auto min-h-11 whitespace-normal py-2 text-left" leading={<Truck strokeWidth={1.75} />} disabled={!access.approve || !(manifest.status === 'closed' || past17) || manifest.status === 'picked_up'} loading={pending === 'hand'} onClick={() => run('hand', () => api.logistics.handToBts(manifest.id), A.logistics.handedToast)}>{A.logistics.handToBts}</Button>
                {manifest.status === 'open' && <Button variant="secondary" size="sm" fullWidth disabled={!access.approve} loading={pending === 'close'} onClick={() => run('close', () => api.logistics.closeManifest(manifest.id))}>{A.logistics.closeManifest}</Button>}
              </div>
              {manifest.status === 'open' && !past17 && <p className="m-0 text-[11.5px] text-ink-3">{A.logistics.handHint}</p>}
            </div>
          ) : <span className="text-[13px] text-ink-3">{A.logistics.noManifest}</span>}
        </Panel>
      </div>

      <BulkBar count={sel.length} onClear={() => setSel([])}>
        {packable.length > 0 && <Button size="sm" variant="primary" leading={<PackageCheck strokeWidth={1.75} />} disabled={!access.edit} loading={pending === 'bulk'} onClick={() => run('bulk', () => api.logistics.packMany(packable), A.logistics.packedToast).then(() => setSel([]))}>{A.logistics.packSel} ({packable.length})</Button>}
      </BulkBar>
      <DataTable columns={cols} rows={rows} rowKey={(r) => r.so.id} selectable selected={sel} onSelectionChange={setSel} pageSize={12} exportFilename={`yuklar-${today}`}
        rowClassName={(r) => (highlight === r.so.id ? 'bg-blue-soft shadow-[inset_3px_0_0_var(--blue)]' : undefined)}
        toolbarLeft={<><span className="eyebrow">{A.logistics.todays}</span><Badge tone="blue">{rows.length}</Badge></>}
        emptyState={<EmptyState compact icon="truck" title={A.logistics.empty} />} />

      <Panel eyebrow={A.logistics.recent} padding={false}>
        <ul className="m-0 grid list-none grid-cols-1 gap-x-6 p-0 md:grid-cols-2 2xl:grid-cols-3">
          {[...data.manifests].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((m: Manifest) => (
            <li key={m.id} className="flex items-center gap-3 border-b border-line px-4 py-2 text-[13px]"><span className="tnum flex-1 whitespace-nowrap font-medium">{manifestLabel(m.id)}</span><span className="tnum shrink-0 text-ink-3">{m.subOrderIds.length} {A.orders.subOrders.toLowerCase()}</span><ManifestStatusBadge status={m.status} /></li>
          ))}
        </ul>
      </Panel>
      <WaybillModal row={label} onClose={() => setLabel(null)} />
    </div>
  )
}

/* ─── A6 label ───────────────────────────────────────────────────────── */
function Barcode({ value, height = 48 }: { value: string; height?: number }) {
  const bars: { x: number; w: number }[] = []
  let x = 0
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    const pattern = [(c & 1) + 1, ((c >> 1) & 1) + 1, ((c >> 2) & 1) + 1, ((c >> 3) & 1) + 1]
    for (let j = 0; j < pattern.length; j++) { if (j % 2 === 0) bars.push({ x, w: pattern[j] }); x += pattern[j] + 1 }
  }
  bars.push({ x, w: 2 }); x += 2
  return (
    <svg viewBox={`0 0 ${x} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-label={value} role="img">
      {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="currentColor" />)}
    </svg>
  )
}

function Label({ row, print = false }: { row: Row; print?: boolean }) {
  const data = useStore((s) => s.data)
  const b = branchOf(data, row.so.branchId)
  const buyer = data.users.find((u) => u.id === row.o.buyerId)
  return (
    <div className={print ? 'h-full w-full bg-white p-4 text-black' : 'mx-auto w-[300px] rounded-[10px] border border-line bg-[#fff] p-4 text-[#111] shadow-soft'} style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex items-center justify-between border-b border-black/20 pb-2">
        <Wordmark size="sm" />
        <span className="font-display text-[18px] font-extrabold tracking-[0.08em]">BTS</span>
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-black/60">{A.logistics.waybill}</div>
      <div className="tnum font-display text-[20px] font-bold">{row.so.waybill}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div><div className="text-[9px] uppercase tracking-[0.16em] text-black/60">{A.common.buyer}</div><div className="font-medium">{buyer?.name}</div><div className="tnum">{buyer?.phoneMasked}</div></div>
        <div><div className="text-[9px] uppercase tracking-[0.16em] text-black/60">{A.common.branch}</div><div className="font-medium">{b?.name} · {regionName(data, b?.regionId)}</div><div className="text-black/70">{b?.address}</div></div>
      </div>
      <div className="mt-3 text-[9px] uppercase tracking-[0.16em] text-black/60">{A.logistics.items} · {sellerLabel(data, row.so.sellerKey)}</div>
      <ul className="m-0 list-none p-0 text-[12px]">{row.so.items.map((i) => <li key={i.key} className="flex justify-between gap-2"><span className="truncate">{i.title} × {i.qty}</span><Money tiyin={i.priceTiyin * i.qty} size="xs" className="text-black" /></li>)}</ul>
      <div className="mt-3 text-black"><Barcode value={row.so.waybill ?? row.so.id} /></div>
      <div className="tnum mt-1 text-center text-[11px] tracking-[0.2em]">{row.so.waybill}</div>
      <div className="mt-2 flex justify-between text-[10px] text-black/60"><span className="tnum">{row.o.id} / {row.so.id}</span><span>{fmtDate(row.o.createdAt)}</span></div>
    </div>
  )
}

function WaybillModal({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const [printing, setPrinting] = useState(false)
  useEffect(() => {
    if (!printing) return
    const t = requestAnimationFrame(() => { try { window.print() } finally { setTimeout(() => setPrinting(false), 300) } })
    return () => cancelAnimationFrame(t)
  }, [printing])
  const printRoot = typeof document !== 'undefined' ? document.getElementById('print-root') : null
  return (
    <>
      <AdminModal open={!!row} onOpenChange={(o) => !o && onClose()} title={A.logistics.labelTitle} size="sm"
        footer={<><Button variant="secondary" onClick={onClose}>{A.common.close}</Button><Button variant="gold" leading={<Printer strokeWidth={1.75} />} onClick={() => setPrinting(true)}>{A.logistics.printLabel}</Button></>}>
        {row && <Label row={row} />}
      </AdminModal>
      {printing && row && printRoot && createPortal(<Label row={row} print />, printRoot)}
    </>
  )
}
