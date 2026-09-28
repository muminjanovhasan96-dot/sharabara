import { useMemo, useState } from 'react'
import { Badge, Button, Countdown, DataTable, EmptyState, Field, Money, MoneyInput, ProductImage, Segmented, Skeleton, Textarea, type Column } from '@/design'
import { useNow, useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { addHours, parseIso } from '@/domain/clock'
import type { ReturnRequest, Tiyin } from '@/domain/types'
import { AdminDrawer, IdLink, KV, KVGrid, ReturnStatusBadge, SectionTitle, SubStatusBadge } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useQueryParam, useSectionLoading } from '../lib/hooks'
import { fmtTime, userName, sellerLabel } from '../lib/format'
import { formatMoney } from '@/domain/money'
import { imgId } from './Moderation'
import { A, tt } from '../strings'

export function Returns() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const access = useAccess('returns')
  const loading = useSectionLoading()
  const [qid, setQid] = useQueryParam('id')
  const [onlyOpen, setOnlyOpen] = useState(true)
  const rows = useMemo(() => data.returns.filter((r) => !onlyOpen || r.status === 'requested'), [data.returns, onlyOpen])
  const selected = qid ? data.returns.find((r) => r.id === qid) : undefined
  const slaOf = (r: ReturnRequest) => addHours(r.createdAt, r.slaHours)
  const cols: Column<ReturnRequest>[] = [
    { key: 'id', header: A.common.id, sortable: true, width: 100, render: (r) => <span className="tnum font-medium">{r.id}</span> },
    { key: 'orderId', header: uz.admin.sections.orders, width: 100, render: (r) => <IdLink to={`/orders?id=${r.orderId}`}>{r.orderId}</IdLink> },
    { key: 'buyerId', header: A.common.buyer, render: (r) => userName(data, r.buyerId), csv: (r) => userName(data, r.buyerId) },
    { key: 'reason', header: A.common.reason, sortable: true, render: (r) => <span className="truncate" title={r.reason}>{r.reason}</span> },
    { key: 'status', header: A.common.status, sortable: true, width: 160, render: (r) => <ReturnStatusBadge status={r.status} /> },
    { key: 'sla', header: A.returns.sla, sortable: true, width: 130, sortValue: (r) => slaOf(r), render: (r) => r.status === 'requested' ? <Countdown target={slaOf(r)} now={now} expiredText={A.returns.overdue} urgentMs={4 * 3_600_000} className="text-[13px]" /> : <span className="text-ink-3">—</span>, csv: (r) => slaOf(r) },
    { key: 'createdAt', header: A.common.date, sortable: true, width: 130, render: (r) => <span className="text-ink-2">{fmtTime(r.createdAt)}</span> },
  ]
  if (loading) return <div className="p-5"><Skeleton height={420} className="rounded-card" /></div>
  return (
    <div className="flex flex-col gap-3 p-5">
      <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setQid(r.id)} pageSize={12} exportFilename="qaytarishlar" defaultSort={{ key: 'sla', dir: 'asc' }}
        rowClassName={(r) => (r.status === 'requested' && parseIso(slaOf(r)).getTime() < parseIso(now).getTime() ? 'bg-brick-soft/40 [&_td]:text-brick' : undefined)}
        toolbarLeft={<Segmented size="sm" value={onlyOpen ? 'open' : 'all'} onChange={(v) => setOnlyOpen(v === 'open')} options={[{ value: 'open', label: A.returns.open }, { value: 'all', label: A.common.all }]} aria-label={A.common.filter} />}
        emptyState={<EmptyState compact icon="rotate-ccw" title={A.returns.empty} />} />
      <AdminDrawer open={!!selected} onOpenChange={(o) => !o && setQid(null)} width="lg" eyebrow={uz.admin.sections.returns} title={selected ? <span className="tnum">{selected.id}</span> : undefined} actions={selected && <ReturnStatusBadge status={selected.status} />}>
        {selected && <ReturnDetail key={selected.id} r={selected} canApprove={access.approve} now={now} />}
      </AdminDrawer>
    </div>
  )
}

function ReturnDetail({ r, canApprove, now }: { r: ReturnRequest; canApprove: boolean; now: string }) {
  const data = useStore((s) => s.data)
  const { run, pending } = useAct()
  const o = data.orders.find((x) => x.id === r.orderId)
  const so = o?.subOrders.find((x) => x.id === r.subOrderId)
  const subtotal = so?.subtotalTiyin ?? 0
  const [kind, setKind] = useState<'full' | 'partial' | 'deny'>('full')
  const [amount, setAmount] = useState<Tiyin | null>(subtotal)
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)
  const invalid = note.trim().length < 3
  const refIds = so?.items.map((i) => i.refId) ?? []
  const chats = data.chats.filter((c) => refIds.includes(c.listingId) && c.buyerId === r.buyerId)
  const eff = kind === 'full' ? subtotal : kind === 'partial' ? (amount ?? 0) : 0
  const sla = addHours(r.createdAt, r.slaHours)
  const overdue = parseIso(sla).getTime() < parseIso(now).getTime()
  const effectText = kind === 'deny' ? tt(A.returns.effectDeny, { a: formatMoney(subtotal - (so?.feeTiyin ?? 0)) }) : kind === 'full' ? tt(A.returns.effectFull, { a: formatMoney(subtotal) }) : tt(A.returns.effectPartial, { a: formatMoney(eff), b: formatMoney(Math.max(0, subtotal - eff)) })
  const decide = async () => { setTouched(true); if (invalid) return; await run('decide', () => api.orders.decideReturn(r.id, kind, eff, note.trim()), A.returns.decided) }
  return (
    <div className="flex flex-col gap-5">
      <KVGrid cols={4}>
        <KV label={A.common.buyer}><IdLink to={`/users?id=${r.buyerId}`}>{userName(data, r.buyerId)}</IdLink></KV>
        <KV label={A.orders.subOrders}><IdLink to={`/orders?id=${r.orderId}`}>{r.subOrderId}</IdLink>{so && <span className="mt-0.5 block"><SubStatusBadge status={so.status} size="sm" /></span>}</KV>
        <KV label={A.common.seller}>{so ? sellerLabel(data, so.sellerKey) : '—'}</KV>
        <KV label={A.returns.sla}>{r.status === 'requested' ? <Countdown target={sla} now={now} expiredText={A.returns.overdue} urgentMs={4 * 3_600_000} className={overdue ? 'text-brick' : undefined} /> : <span className="text-ink-3">—</span>}<span className="block text-[11.5px] text-ink-3">{r.slaHours} {A.common.hours} · {fmtTime(r.createdAt)}</span></KV>
      </KVGrid>
      {so && (
        <div className="rounded-card border border-line bg-paper p-3">
          <SectionTitle>{A.returns.item}</SectionTitle>
          {so.items.map((i) => <div key={i.key} className="flex items-center gap-3"><ProductImage id={imgId(i.image, i.refId)} className="h-12 w-12" fill={0.8} /><span className="min-w-0 flex-1 truncate text-[13.5px]">{i.title} × {i.qty}</span><Money tiyin={i.priceTiyin * i.qty} size="sm" /></div>)}
        </div>
      )}
      <div>
        <SectionTitle>{A.common.reason}</SectionTitle>
        <Badge tone="brick">{r.reason}</Badge>
        <p className="m-0 mt-2 text-[14px] leading-relaxed text-ink">{r.description}</p>
      </div>
      <div>
        <SectionTitle>{A.returns.images}</SectionTitle>
        <div className="grid grid-cols-4 gap-2">{(r.images.length ? r.images : ['x', 'y']).map((img, i) => <ProductImage key={i} id={imgId(img, `${r.id}-${i}`)} aspect="4/3" />)}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-card border border-line p-3">
          <SectionTitle>{A.returns.sellerReply}</SectionTitle>
          <p className="m-0 text-[13px] text-ink-2">{r.sellerReply ?? A.returns.noReply}</p>
        </div>
        <div className="rounded-card border border-line p-3">
          <SectionTitle>{A.returns.chat}</SectionTitle>
          {chats.length === 0 ? <p className="m-0 text-[13px] text-ink-3">{A.returns.noChat}</p> : (
            <ul className="m-0 flex max-h-40 list-none flex-col gap-1.5 overflow-y-auto p-0 text-[12.5px]">
              {chats.flatMap((c) => c.messages).slice(-8).map((m) => <li key={m.id} className={m.from === r.buyerId ? 'text-ink' : 'text-ink-2'}><span className="font-medium">{userName(data, m.from)}:</span> {m.text}</li>)}
            </ul>
          )}
        </div>
      </div>
      {r.status === 'requested' ? (
        <div className="flex flex-col gap-3 rounded-card border border-gold/30 bg-gold-soft p-4">
          <SectionTitle>{A.returns.decision}</SectionTitle>
          <Segmented value={kind} onChange={(v) => { setKind(v); if (v === 'full') setAmount(subtotal) }} size="md" fullWidth options={[{ value: 'full', label: A.returns.full }, { value: 'partial', label: A.returns.partial }, { value: 'deny', label: A.returns.deny }]} aria-label={A.returns.decision} />
          {kind === 'partial' && <Field label={A.returns.amount}><MoneyInput valueTiyin={amount} onChangeTiyin={(v) => setAmount(v !== null ? Math.min(v, subtotal) : null)} /></Field>}
          <Field label={A.returns.noteRequired} required error={touched && invalid ? uz.app.reasonRequired : undefined}><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => setTouched(true)} invalid={touched && invalid} /></Field>
          <div className="text-[12.5px] text-ink-2"><span className="eyebrow !text-[10px]">{A.returns.escrowEffect}</span><div className="mt-0.5">{effectText}</div></div>
          <Button variant={kind === 'deny' ? 'danger' : 'gold'} disabled={!canApprove || (kind === 'partial' && !amount)} loading={pending === 'decide'} onClick={decide}>{A.common.confirm}: {kind === 'full' ? A.returns.full : kind === 'partial' ? A.returns.partial : A.returns.deny}</Button>
        </div>
      ) : r.decision && (
        <div className="rounded-card border border-line p-3 text-[13px]">
          <SectionTitle>{A.returns.decision}</SectionTitle>
          <div className="flex flex-wrap items-center gap-2"><ReturnStatusBadge status={r.status} /><Money tiyin={r.decision.amountTiyin} size="sm" /><span className="text-ink-3">· {fmtTime(r.decision.at)}</span></div>
          <p className="m-0 mt-1 text-ink-2">{r.decision.note}</p>
        </div>
      )}
    </div>
  )
}
