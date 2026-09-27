import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, DataTable, EmptyState, Segmented, Select, Skeleton, type Column, type SortState } from '@/design'
import { useStore } from '@/store'
import { uz } from '@/i18n/uz'
import { TID } from '@/lib/testids'
import type { AuditEntry, AuditKind } from '@/domain/types'
import { cn } from '@/lib/utils'
import { useAppNavigate } from '@/lib/router'
import { AuditKindBadge, IdLink } from '../components/ui'
import { useQueryParam, useSectionLoading } from '../lib/hooks'
import { fmtTime } from '../lib/format'
import { A, tt } from '../strings'

const KINDS: AuditKind[] = ['status', 'money', 'price', 'fee', 'data', 'auth']
export function entityTarget(entity: string, id: string): string | null {
  switch (entity) {
    case 'listing': return `/pricing?id=${id}`
    case 'order': return `/orders?id=${id}`
    case 'subOrder': return `/logistics?highlight=${id}`
    case 'user': return `/users?id=${id}`
    case 'company': return `/companies?id=${id}`
    case 'product': return `/products?id=${id}`
    case 'category': return `/categories?id=${id}`
    case 'campaign': return `/campaigns?id=${id}`
    case 'payout': return '/payments'
    case 'return': return `/returns?id=${id}`
    case 'feeRuleSet': return '/fees'
    case 'role': return '/roles'
    default: return null
  }
}

export function Audit() {
  const data = useStore((s) => s.data)
  const loading = useSectionLoading()
  const nav = useAppNavigate()
  const [q, setQ] = useQueryParam('q')
  const [mode, setMode] = useState<'table' | 'trail'>(q ? 'trail' : 'table')
  const [kind, setKind] = useState(''); const [entity, setEntity] = useState(''); const [actor, setActor] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortState | null>({ key: 'at', dir: 'desc' })
  const [text, setText] = useState(q ?? '')
  const entities = useMemo(() => [...new Set(data.audit.map((a) => a.entity))].sort(), [data.audit])
  const actors = useMemo(() => [...new Map(data.audit.map((a) => [a.actorId, a.actorName])).entries()], [data.audit])
  const rows = useMemo(() => {
    const s = (q ?? '').trim().toLowerCase()
    return data.audit.filter((a) => (!kind || a.kind === kind) && (!entity || a.entity === entity) && (!actor || a.actorId === actor) && (!s || a.entityId.toLowerCase().includes(s) || (a.note ?? '').toLowerCase().includes(s) || a.field.toLowerCase().includes(s) || String(a.to ?? '').toLowerCase().includes(s) || a.actorName.toLowerCase().includes(s)))
  }, [data.audit, kind, entity, actor, q])

  // trail: the id + related orders/sub-orders
  const trail = useMemo(() => {
    const id = (q ?? '').trim()
    if (!id) return { ids: [] as string[], rows: [] as AuditEntry[] }
    const ids = new Set<string>([id])
    for (const o of data.orders) {
      const hit = o.id === id || o.subOrders.some((so) => so.id === id || so.items.some((i) => i.refId === id))
      if (hit) { ids.add(o.id); for (const so of o.subOrders) { ids.add(so.id); if (so.manifestId) ids.add(so.manifestId) } }
    }
    for (const p of data.payouts) if (p.subOrderIds.some((s) => ids.has(s))) ids.add(p.id)
    for (const r of data.returns) if (ids.has(r.subOrderId) || ids.has(r.orderId)) ids.add(r.id)
    const list = data.audit.filter((a) => ids.has(a.entityId) || (a.note ?? '').includes(id)).sort((a, b) => a.at.localeCompare(b.at))
    return { ids: [...ids], rows: list }
  }, [q, data])

  const wrapRef = useRef<HTMLDivElement>(null)
  const sorted = useMemo(() => { const dir = sort?.dir === 'asc' ? 1 : -1; const k = sort?.key ?? 'at'; return [...rows].sort((a, b) => String((a as unknown as Record<string, unknown>)[k] ?? '').localeCompare(String((b as unknown as Record<string, unknown>)[k] ?? '')) * dir) }, [rows, sort])
  const pageRows = sorted.slice(page * 25, page * 25 + 25)
  useEffect(() => {
    const trs = wrapRef.current?.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-index]')
    trs?.forEach((tr) => { tr.setAttribute('data-testid', TID.aAuditRow); const idx = Number(tr.dataset.rowIndex); const row = pageRows[idx]; if (row) tr.setAttribute('data-id', row.id) })
  })

  const cols: Column<AuditEntry>[] = [
    { key: 'at', header: A.common.time, sortable: true, width: 130, render: (a) => <span className="tnum text-ink-2">{fmtTime(a.at)}</span> },
    { key: 'actorName', header: A.audit.actor, sortable: true, width: 170, render: (a) => <span className="flex flex-col leading-tight"><span className="truncate">{a.actorName}</span><span className="text-[11px] text-ink-3">{uz.admin.roles[a.role] ?? a.role}</span></span> },
    { key: 'kind', header: A.audit.kind, sortable: true, width: 100, render: (a) => <AuditKindBadge kind={a.kind} />, csv: (a) => a.kind },
    { key: 'entity', header: A.audit.entity, sortable: true, width: 100, render: (a) => <span className="text-ink-2">{a.entity}</span> },
    { key: 'entityId', header: A.audit.entityId, sortable: true, width: 120, render: (a) => { const to = entityTarget(a.entity, a.entityId); return to ? <IdLink to={to}>{a.entityId}</IdLink> : <span className="tnum">{a.entityId}</span> } },
    { key: 'field', header: A.audit.field, sortable: true, width: 110, render: (a) => <span className="tnum">{a.field}</span> },
    { key: 'change', header: A.audit.change, render: (a) => <span className="tnum"><span className="text-ink-3">{a.from ?? '—'}</span> → <span className={cn('font-medium', (a.kind === 'money' || a.kind === 'price') && 'text-gold', a.kind === 'fee' && 'text-brick', a.kind === 'auth' && 'text-blue')}>{a.to ?? '—'}</span></span>, csv: (a) => `${a.from ?? ''} → ${a.to ?? ''}` },
    { key: 'note', header: A.audit.note, render: (a) => <span className="truncate text-ink-2" title={a.note}>{a.note ?? ''}</span> },
  ]

  if (loading) return <div className="p-5"><Skeleton height={520} className="rounded-card" /></div>
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented size="sm" value={mode} onChange={setMode} options={[{ value: 'table', label: A.audit.table }, { value: 'trail', label: A.audit.trail }]} aria-label={A.audit.trail} />
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setQ(text.trim() || null); setPage(0) }}>
          <input type="search" role="searchbox" value={text} onChange={(e) => setText(e.target.value)} placeholder={A.audit.search} aria-label={A.audit.search} className="h-9 w-64 rounded-[10px] border border-line bg-card px-3 text-[13.5px] text-ink outline-none placeholder:text-ink-3 focus:border-blue/50 focus:ring-2 focus:ring-blue/20" />
        </form>
        <div className="w-40"><Select size="sm" value={kind} onChange={(e) => { setKind(e.target.value); setPage(0) }} aria-label={A.audit.kind} options={[{ value: '', label: `${A.audit.kind}: ${A.common.all}` }, ...KINDS.map((k) => ({ value: k, label: A.audit.kinds[k] }))]} /></div>
        <div className="w-44"><Select size="sm" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(0) }} aria-label={A.audit.entity} options={[{ value: '', label: `${A.audit.entity}: ${A.common.all}` }, ...entities.map((k) => ({ value: k, label: k }))]} /></div>
        <div className="w-52"><Select size="sm" value={actor} onChange={(e) => { setActor(e.target.value); setPage(0) }} aria-label={A.audit.actor} options={[{ value: '', label: `${A.audit.actor}: ${A.common.all}` }, ...actors.map(([id, name]) => ({ value: id, label: name }))]} /></div>
        <span className="tnum text-[12.5px] text-ink-3">{tt(A.audit.entries, { n: rows.length })}</span>
      </div>
      {mode === 'table' ? (
        <div ref={wrapRef}>
          <DataTable columns={cols} rows={rows} rowKey={(a) => a.id} pageSize={25} page={page} onPageChange={setPage} sort={sort} onSortChange={setSort} exportFilename="audit" onRowClick={(a) => { setQ(a.entityId); setText(a.entityId); setMode('trail') }}
            emptyState={<EmptyState compact icon="scroll-text" title={A.common.empty} hint={A.common.emptyHint} />} />
        </div>
      ) : (
        <div className="rounded-card border border-line bg-card p-5">
          {!q ? <EmptyState compact icon="scroll-text" title={A.audit.trail} hint={A.audit.search} /> : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2"><h2 className="m-0 font-display text-[18px]">{tt(A.audit.trailTitle, { id: q })}</h2><span className="text-[12.5px] text-ink-3">{tt(A.audit.related, { ids: trail.ids.filter((i) => i !== q).join(', ') || '—' })}</span></div>
              {trail.rows.length === 0 ? <EmptyState compact title={A.audit.trailEmpty} /> : (
                <ol className="relative m-0 list-none p-0">
                  {trail.rows.map((a, i) => {
                    const to = entityTarget(a.entity, a.entityId)
                    return (
                      <li key={a.id} data-testid={TID.aAuditRow} data-id={a.id} className="relative flex gap-4 pb-4 pl-6 last:pb-0">
                        {i < trail.rows.length - 1 && <span aria-hidden="true" className="absolute left-[7px] top-4 bottom-0 w-px bg-line-strong" />}
                        <span aria-hidden="true" className={cn('absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[2px] bg-card', a.kind === 'money' || a.kind === 'price' ? 'border-gold-fill bg-gold-soft' : a.kind === 'fee' ? 'border-brick bg-brick-soft' : a.kind === 'auth' ? 'border-blue bg-blue-soft' : 'border-line-strong')} />
                        <span className="tnum w-[100px] shrink-0 pt-0.5 text-[12px] text-ink-3">{fmtTime(a.at)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-[13.5px]"><AuditKindBadge kind={a.kind} /><Badge tone="outline" size="sm">{a.entity}</Badge>{to ? <button type="button" onClick={() => nav(to)} className="tnum font-medium text-blue hover:underline">{a.entityId}</button> : <span className="tnum font-medium">{a.entityId}</span>}<span className="text-ink-2">{a.field}:</span><span className="tnum text-ink-3">{a.from ?? '—'}</span><span>→</span><span className={cn('tnum font-semibold', (a.kind === 'money' || a.kind === 'price') && 'text-gold', a.kind === 'fee' && 'text-brick')}>{a.to ?? '—'}</span></div>
                          <div className="mt-0.5 text-[12.5px] text-ink-2">{a.actorName} <span className="text-ink-3">· {uz.admin.roles[a.role] ?? a.role}</span>{a.note && <span> · {a.note}</span>}</div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
