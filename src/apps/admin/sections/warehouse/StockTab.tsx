import { useMemo, useState } from 'react'
import { ArrowLeftRight, SlidersHorizontal, Wrench } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, Field, Money, NumberInput, ProductImage, SearchInput, Select, Switch, Textarea, type Column } from '@/design'
import { useNow, useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { addDays } from '@/domain/clock'
import type { Product, StockLevel, StockMovement } from '@/domain/types'
import { AdminDrawer, IdLink, KV, KVGrid, SectionTitle } from '../../components/ui'
import { useAct, useQueryParam } from '../../lib/hooks'
import { categoryName, fmtTime, staffName } from '../../lib/format'
import { imgId } from '../Moderation'
import { A } from '../../strings'
import { CHANNEL_TONE, KIND_TONE, channelLabel, inWh, kindLabel, whShort, type WhFilter } from './lib'

export interface StockRow { key: string; lvl: StockLevel; p: Product; company: string; sold30: number; daily: number; daysLeft: number | null; low: boolean }

export function StockTab({ wh, canEdit }: { wh: WhFilter; canEdit: boolean }) {
  const data = useStore((s) => s.data)
  const now = useNow()
  const [qid, setQid] = useQueryParam('id')
  const [company, setCompany] = useState('')
  const [cat, setCat] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const [q, setQ] = useState('')
  const [hidden, setHidden] = useState<string[]>(['reserved'])
  const S = A.warehouse.stock

  const rows = useMemo<StockRow[]>(() => {
    const since = addDays(now, -30)
    const sold = new Map<string, number>()
    for (const m of data.movements) if (m.kind === 'out' && m.at >= since) { const k = `${m.productId}|${m.warehouseId}`; sold.set(k, (sold.get(k) ?? 0) + Math.abs(m.qty)) }
    const out: StockRow[] = []
    for (const lvl of data.stockLevels) {
      if (!inWh(wh, lvl.warehouseId)) continue
      const p = data.products.find((x) => x.id === lvl.productId)
      if (!p) continue
      const s30 = sold.get(`${lvl.productId}|${lvl.warehouseId}`) ?? 0
      const daily = s30 / 30
      out.push({ key: `${lvl.productId}|${lvl.warehouseId}`, lvl, p, company: data.companies.find((c) => c.id === p.companyId)?.name ?? p.companyId, sold30: s30, daily, daysLeft: daily > 0 ? lvl.qty / daily : null, low: lvl.qty <= lvl.minQty })
    }
    return out
  }, [data, wh, now])
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return rows.filter((r) => (!company || r.p.companyId === company) && (!cat || r.p.categoryId === cat) && (!onlyLow || r.low) && (!qq || r.p.title.toLowerCase().includes(qq) || r.p.sku.toLowerCase().includes(qq)))
  }, [rows, company, cat, onlyLow, q])
  /** ?id=P-1@wh-tosh (tovar@ombor) yoki faqat P-1 */
  const selected = useMemo(() => { if (!qid) return undefined; const [pid, w] = qid.split('@'); return rows.find((r) => r.p.id === pid && (!w || r.lvl.warehouseId === w)) ?? rows.find((r) => r.p.id === pid) }, [rows, qid])
  const open = (r: StockRow) => setQid(`${r.p.id}@${r.lvl.warehouseId}`)
  const close = () => setQid(null)

  const cols: Column<StockRow>[] = [
    { key: 'sku', header: S.sku, width: 90, sortable: true, sortValue: (r) => r.p.sku, render: (r) => <span className="tnum text-ink-2">{r.p.sku}</span>, csv: (r) => r.p.sku },
    { key: 'title', header: S.product, sortable: true, sortValue: (r) => r.p.title, render: (r) => <span className="flex max-w-[216px] items-center gap-2"><ProductImage id={imgId(r.p.images[0] ?? '', r.p.id)} className="h-8 w-8 shrink-0" fill={0.85} /><span className="truncate">{r.p.title}</span></span>, csv: (r) => r.p.title },
    { key: 'company', header: S.company, sortable: true, width: 135, render: (r) => <span className="truncate">{r.company}</span> },
    { key: 'wh', header: S.warehouse, sortable: true, width: 145, sortValue: (r) => r.lvl.warehouseId, render: (r) => <span className="truncate text-ink-2">{whShort(data, r.lvl.warehouseId)}</span>, csv: (r) => whShort(data, r.lvl.warehouseId) },
    { key: 'qty', header: S.qty, sortable: true, align: 'right', width: 100, sortValue: (r) => r.lvl.qty, render: (r) => <span className={`tnum inline-flex items-center justify-end gap-1 ${r.low ? 'font-semibold text-brick' : ''}`}>{r.lvl.qty}{r.low && <Badge tone="brick" size="sm">{S.low}</Badge>}</span>, csv: (r) => r.lvl.qty },
    { key: 'reserved', header: S.reserved, align: 'right', width: 55, sortValue: (r) => r.lvl.reserved, render: (r) => <span className="tnum text-ink-3">{r.lvl.reserved}</span>, csv: (r) => r.lvl.reserved },
    { key: 'min', header: S.min, align: 'right', width: 50, sortValue: (r) => r.lvl.minQty, render: (r) => <span className="tnum text-ink-3">{r.lvl.minQty}</span>, csv: (r) => r.lvl.minQty },
    { key: 'sold30', header: S.sold30, sortable: true, align: 'right', width: 95, render: (r) => <span className="tnum">{r.sold30}</span> },
    { key: 'daily', header: S.daily, sortable: true, align: 'right', width: 85, render: (r) => <span className="tnum text-ink-2">{r.daily.toFixed(1).replace('.', ',')}</span>, csv: (r) => Math.round(r.daily * 10) / 10 },
    { key: 'daysLeft', header: S.daysLeft, sortable: true, align: 'right', width: 85, sortValue: (r) => r.daysLeft ?? 99999, render: (r) => r.daysLeft === null ? <span className="text-ink-3">∞</span> : <span className={`tnum ${r.daysLeft < 7 ? 'font-semibold text-brick' : r.daysLeft < 14 ? 'text-gold' : ''}`}>{Math.round(r.daysLeft)} {S.daysUnit}</span>, csv: (r) => r.daysLeft === null ? '' : Math.round(r.daysLeft) },
    { key: 'price', header: S.price, sortable: true, align: 'right', width: 127, sortValue: (r) => r.p.priceTiyin, render: (r) => <Money tiyin={r.p.priceTiyin} size="sm" />, csv: (r) => r.p.priceTiyin / 100 },
  ]
  const lowCount = rows.filter((r) => r.low).length

  return (
    <>
      <DataTable columns={cols} rows={filtered} rowKey={(r) => r.key} onRowClick={open} pageSize={15} exportFilename="zaxira" defaultSort={{ key: 'daysLeft', dir: 'asc' }} hiddenColumns={hidden} onHiddenColumnsChange={setHidden}
        toolbarLeft={<div className="flex flex-wrap items-center gap-2">
          <SearchInput size="sm" value={q} onChange={setQ} placeholder={S.search} className="w-52" aria-label={S.search} />
          <div className="w-48"><Select size="sm" value={company} onChange={(e) => setCompany(e.target.value)} aria-label={S.company} options={[{ value: '', label: S.company_all }, ...data.companies.map((c) => ({ value: c.id, label: c.name }))]} /></div>
          <div className="w-48"><Select size="sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label={A.common.category} options={[{ value: '', label: S.category_all }, ...data.categories.filter((c) => data.products.some((p) => p.categoryId === c.id)).map((c) => ({ value: c.id, label: c.name }))]} /></div>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-card px-2.5 text-[13px] text-ink"><Switch size="sm" checked={onlyLow} onCheckedChange={setOnlyLow} aria-label={S.onlyLow} />{S.onlyLow}{lowCount > 0 && <Badge tone="brick" size="sm">{lowCount}</Badge>}</label>
          <span className="tnum text-[12.5px] text-ink-3">{filtered.length} / {rows.length}</span>
        </div>}
        emptyState={<EmptyState compact icon="warehouse" title={S.empty} hint={S.emptyHint} />} />
      <AdminDrawer open={!!selected} onOpenChange={(o) => !o && close()} width="lg" eyebrow={uz.admin.sections.warehouse} title={selected?.p.title}
        actions={selected && <>{selected.low && <Badge tone="brick" dot>{S.low}</Badge>}<Badge tone="outline">{selected.p.sku}</Badge></>}>
        {selected && <StockDetail key={selected.key} row={selected} canEdit={canEdit} />}
      </AdminDrawer>
    </>
  )
}

function StockDetail({ row, canEdit }: { row: StockRow; canEdit: boolean }) {
  const data = useStore((s) => s.data)
  const { run, pending } = useAct()
  const S = A.warehouse.stock
  const { p, lvl } = row
  const levels = data.stockLevels.filter((l) => l.productId === p.id)
  const history = useMemo(() => data.movements.filter((m) => m.productId === p.id).slice(0, 20), [data.movements, p.id])
  const [adj, setAdj] = useState(0); const [reason, setReason] = useState(''); const [touched, setTouched] = useState(false)
  const others = data.warehouses.filter((w) => w.id !== lvl.warehouseId)
  const [to, setTo] = useState(others[0]?.id ?? '')
  const [tq, setTq] = useState(1)
  const [minQ, setMinQ] = useState(lvl.minQty)
  const reasonBad = reason.trim().length < 3
  const total = levels.reduce((a, l) => a + l.qty, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4">
        <ProductImage id={imgId(p.images[0] ?? '', p.id)} className="h-24 w-24 shrink-0" />
        <KVGrid cols={3} className="flex-1">
          <KV label={S.company}><IdLink to={`/companies?id=${p.companyId}`}>{row.company}</IdLink></KV>
          <KV label={A.common.category}>{categoryName(data, p.categoryId)}</KV>
          <KV label={S.price}><Money tiyin={p.priceTiyin} size="md" /></KV>
          <KV label={S.sold30}><span className="tnum">{row.sold30} {uz.app.pcs}</span></KV>
          <KV label={S.daily}><span className="tnum">{row.daily.toFixed(1).replace('.', ',')}</span></KV>
          <KV label={S.daysLeft}>{row.daysLeft === null ? '∞' : <span className={`tnum ${row.daysLeft < 7 ? 'text-brick' : ''}`}>{Math.round(row.daysLeft)} {S.daysUnit}</span>}</KV>
        </KVGrid>
      </div>

      <div>
        <SectionTitle right={<span className="tnum text-[12.5px] text-ink-3">{A.common.total}: <b className="text-ink">{total}</b> {uz.app.pcs}</span>}>{S.levels}</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {data.warehouses.map((w) => { const l = levels.find((x) => x.warehouseId === w.id); const low = l ? l.qty <= l.minQty : false; const active = w.id === lvl.warehouseId; return (
            <div key={w.id} className={`rounded-card border p-3 ${active ? 'border-blue/40 bg-blue-soft' : 'border-line bg-paper'}`}>
              <div className="eyebrow !text-[10px]">{whShort(data, w.id)}</div>
              <div className="mt-1 flex items-baseline gap-1.5"><span className={`tnum font-display text-[22px] font-bold ${low ? 'text-brick' : 'text-ink'}`}>{l?.qty ?? 0}</span><span className="text-[12px] text-ink-3">{uz.app.pcs}</span>{low && <Badge tone="brick" size="sm">{S.low}</Badge>}</div>
              <div className="tnum mt-0.5 text-[11.5px] text-ink-3">{S.reserved}: {l?.reserved ?? 0} · {S.min}: {l?.minQty ?? '—'}</div>
            </div>
          ) })}
        </div>
      </div>

      {canEdit ? (
        <div className="grid grid-cols-1 gap-3 border-t border-line pt-4 md:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-card border border-line p-3">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><Wrench size={14} strokeWidth={1.75} />{S.adjust} <span className="text-ink-3">· {whShort(data, lvl.warehouseId)}</span></div>
            <NumberInput size="sm" value={adj} onChange={setAdj} min={-lvl.qty} max={9999} aria-label={S.adjustHint} />
            <Field error={touched && reasonBad ? uz.app.reasonRequired : undefined}><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} onBlur={() => setTouched(true)} placeholder={S.adjustReasonPh} invalid={touched && reasonBad} aria-label={S.adjustReason} /></Field>
            <Button size="sm" variant="gold" disabled={adj === 0 || reasonBad} loading={pending === 'adj'} onClick={() => run('adj', () => api.warehouse.adjust(p.id, lvl.warehouseId, adj, reason.trim()), S.adjusted).then((r) => { if (r) { setAdj(0); setReason(''); setTouched(false) } })}>{S.adjust}</Button>
          </div>
          <div className="flex flex-col gap-2 rounded-card border border-line p-3">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><ArrowLeftRight size={14} strokeWidth={1.75} />{S.transfer}</div>
            <Select size="sm" value={to} onChange={(e) => setTo(e.target.value)} aria-label={S.transferTo} options={others.map((w) => ({ value: w.id, label: whShort(data, w.id) }))} />
            <NumberInput size="sm" value={tq} onChange={setTq} min={1} max={Math.max(1, lvl.qty)} aria-label={S.transferQty} />
            <Button size="sm" variant="secondary" disabled={!to || lvl.qty < 1 || tq > lvl.qty} loading={pending === 'tr'} onClick={() => run('tr', () => api.warehouse.transfer(p.id, lvl.warehouseId, to, tq), S.transferred).then(() => setTq(1))}>{S.transfer}</Button>
          </div>
          <div className="flex flex-col gap-2 rounded-card border border-line p-3">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><SlidersHorizontal size={14} strokeWidth={1.75} />{S.minQty}</div>
            <NumberInput size="sm" value={minQ} onChange={setMinQ} min={0} max={999} aria-label={S.minQty} />
            <Button size="sm" variant="secondary" disabled={minQ === lvl.minQty} loading={pending === 'min'} onClick={() => run('min', () => api.warehouse.setMinQty(p.id, lvl.warehouseId, minQ), S.minSaved)}>{A.common.save}</Button>
          </div>
        </div>
      ) : <p className="m-0 border-t border-line pt-3 text-[12.5px] text-ink-3">{S.readOnly}</p>}

      <div>
        <SectionTitle>{S.history}</SectionTitle>
        {history.length === 0 ? <p className="m-0 text-[13px] text-ink-3">{S.noHistory}</p> : <MovementList items={history} />}
      </div>
    </div>
  )
}

export function MovementList({ items }: { items: StockMovement[] }) {
  const data = useStore((s) => s.data)
  return (
    <ol className="m-0 list-none divide-y divide-line p-0">
      {items.map((m) => (
        <li key={m.id} className="flex items-center gap-3 py-2 text-[13px]">
          <span className="tnum w-24 shrink-0 text-ink-3">{fmtTime(m.at)}</span>
          <Badge tone={KIND_TONE[m.kind]} size="sm">{kindLabel(m.kind)}</Badge>
          <span className={`tnum w-12 shrink-0 text-right font-semibold ${m.qty > 0 ? 'text-green' : 'text-brick'}`}>{m.qty > 0 ? `+${m.qty}` : `−${Math.abs(m.qty)}`}</span>
          <span className="w-28 shrink-0 truncate text-ink-2">{whShort(data, m.warehouseId)}</span>
          {m.channel && <Badge tone={CHANNEL_TONE[m.channel]} size="sm">{channelLabel(m.channel)}</Badge>}
          <span className="min-w-0 flex-1 truncate text-ink-2" title={m.note}>{m.note ?? ''}</span>
          <span className="shrink-0 text-[12px] text-ink-3">{m.by === 'system' ? A.warehouse.movements.system : staffName(data, m.by)}</span>
        </li>
      ))}
    </ol>
  )
}
