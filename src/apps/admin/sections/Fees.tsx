import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, Field, LedgerRow, Ledger, Money, MoneyInput, NumberInput, Select, Textarea, Skeleton, type Column } from '@/design'
import { useStore } from '@/store'
import { api } from '@/api'
import { simulateFee, publishedRuleSet } from '@/domain/fees'
import type { FeeApproval, FeeRule, FeeRuleSet, Tiyin } from '@/domain/types'
import { uid } from '@/lib/utils'
import { AdminModal, BulkBar, IdLink, Panel, SampleBadge, Toolbar } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useSectionLoading } from '../lib/hooks'
import { categoryName, fmtTime, pctStr, sellerLabel, staffName } from '../lib/format'
import { A, tt } from '../strings'

const S = 100

export function Fees() {
  const data = useStore((s) => s.data)
  const access = useAccess('fees')
  const loading = useSectionLoading()
  const { run, pending } = useAct()
  const published = publishedRuleSet(data.feeRuleSets) ?? data.feeRuleSets[0]
  const draft = data.feeRuleSets.find((r) => r.status === 'draft')
  const [editing, setEditing] = useState(false)
  const [rules, setRules] = useState<FeeRule[]>([])
  const [note, setNote] = useState('')
  const [simPrice, setSimPrice] = useState<Tiyin | null>(620_000_000)
  const [simCat, setSimCat] = useState<string>('')
  const [adjusting, setAdjusting] = useState<FeeApproval | null>(null)
  const [sel, setSel] = useState<string[]>([])

  const startEdit = () => { setRules((draft ?? published).rules.map((r) => ({ ...r }))); setNote(draft?.note ?? ''); setEditing(true) }
  const shown = editing ? rules : published.rules
  const sim = useMemo(() => { try { return simPrice ? simulateFee(simPrice, published, simCat || null) : null } catch { return null } }, [simPrice, simCat, published])
  const pendingApprovals = useMemo(() => data.feeApprovals.filter((a) => a.status === 'pending'), [data.feeApprovals])
  const roots = data.categories.filter((c) => !c.parentId)
  const catOptions = [{ value: '', label: A.fees.default }, ...roots.map((c) => ({ value: c.id, label: c.name }))]

  const upd = (id: string, patch: Partial<FeeRule>) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const ruleCols: Column<FeeRule>[] = [
    { key: 'categoryId', header: A.fees.category, width: 170, render: (r) => editing ? <Select size="sm" options={catOptions} value={r.categoryId ?? ''} onChange={(e) => upd(r.id, { categoryId: e.target.value || null })} aria-label={A.fees.category} /> : (r.categoryId ? <Badge tone="blue">{categoryName(data, r.categoryId)}</Badge> : <span className="text-ink-2">{A.fees.default}</span>), csv: (r) => r.categoryId ? categoryName(data, r.categoryId) : A.fees.default },
    { key: 'minTiyin', header: `${A.fees.range} (${A.common.from})`, align: 'right', width: 160, render: (r) => editing ? <MoneyInput size="sm" valueTiyin={r.minTiyin} onChangeTiyin={(v) => upd(r.id, { minTiyin: v ?? 0 })} aria-label={A.common.from} /> : <Money tiyin={r.minTiyin} size="sm" />, csv: (r) => r.minTiyin / S },
    { key: 'maxTiyin', header: `${A.fees.range} (${A.common.to})`, align: 'right', width: 160, render: (r) => editing ? <MoneyInput size="sm" valueTiyin={r.maxTiyin} onChangeTiyin={(v) => upd(r.id, { maxTiyin: v })} placeholder={A.fees.infinity} aria-label={A.common.to} /> : (r.maxTiyin === null ? <span className="text-ink-3">{A.fees.infinity}</span> : <Money tiyin={r.maxTiyin} size="sm" />), csv: (r) => r.maxTiyin === null ? '' : r.maxTiyin / S },
    { key: 'type', header: A.fees.type, width: 150, render: (r) => editing ? <Select size="sm" value={r.type} onChange={(e) => upd(r.id, { type: e.target.value as FeeRule['type'] })} options={(['fixed', 'percent', 'percent_capped'] as const).map((t) => ({ value: t, label: A.fees.types[t] }))} aria-label={A.fees.type} /> : <Badge tone="outline">{A.fees.types[r.type]}</Badge>, csv: (r) => A.fees.types[r.type] },
    { key: 'value', header: A.fees.value, align: 'right', width: 150, render: (r) => r.type === 'fixed'
      ? (editing ? <MoneyInput size="sm" valueTiyin={r.fixedTiyin ?? 0} onChangeTiyin={(v) => upd(r.id, { fixedTiyin: v ?? 0 })} aria-label={A.fees.value} /> : <Money tiyin={r.fixedTiyin ?? 0} size="sm" />)
      : (editing ? <NumberInput size="sm" value={Math.round((r.rate ?? 0) * 1000) / 10} onChange={(v) => upd(r.id, { rate: Math.round(v * 10) / 1000 })} step={0.5} min={0} max={50} aria-label={A.fees.value} /> : <span className="tnum">{pctStr(r.rate ?? 0, 1)}</span>), csv: (r) => r.type === 'fixed' ? (r.fixedTiyin ?? 0) / S : `${((r.rate ?? 0) * 100).toFixed(1)}%` },
    { key: 'capTiyin', header: A.fees.cap, align: 'right', width: 150, render: (r) => r.type === 'percent_capped' ? (editing ? <MoneyInput size="sm" valueTiyin={r.capTiyin ?? null} onChangeTiyin={(v) => upd(r.id, { capTiyin: v ?? undefined })} aria-label={A.fees.cap} /> : <Money tiyin={r.capTiyin ?? 0} size="sm" />) : <span className="text-ink-3">—</span>, csv: (r) => r.capTiyin ? r.capTiyin / S : '' },
    ...(editing ? [{ key: 'x', header: '', width: 44, hideable: false, render: (r: FeeRule) => <button type="button" aria-label={A.fees.removeRule} onClick={() => setRules((rs) => rs.filter((x) => x.id !== r.id))} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-3 hover:bg-brick/10 hover:text-brick"><Trash2 size={15} strokeWidth={1.75} /></button> } as Column<FeeRule>] : []),
  ]

  const apprCols: Column<FeeApproval>[] = [
    { key: 'subOrderId', header: A.orders.subOrders, sortable: true, width: 120, render: (a) => <IdLink to={`/orders?id=${a.orderId}`}>{a.subOrderId}</IdLink> },
    { key: 'sellerKey', header: A.common.seller, sortable: true, render: (a) => sellerLabel(data, a.sellerKey), csv: (a) => sellerLabel(data, a.sellerKey) },
    { key: 'priceTiyin', header: A.common.price, sortable: true, align: 'right', width: 130, render: (a) => <Money tiyin={a.priceTiyin} size="sm" />, csv: (a) => a.priceTiyin / S },
    { key: 'autoFeeTiyin', header: A.fees.autoFee, sortable: true, align: 'right', width: 130, render: (a) => <span className="inline-flex flex-col items-end leading-tight"><Money tiyin={a.autoFeeTiyin} size="sm" /><span className="text-[11px] text-ink-3">{a.priceTiyin ? pctStr(a.autoFeeTiyin / a.priceTiyin, 1) : ''}</span></span>, csv: (a) => a.autoFeeTiyin / S },
    { key: 'createdAt', header: A.common.time, sortable: true, width: 130, render: (a) => <span className="text-ink-2">{fmtTime(a.createdAt)}</span> },
    { key: 'act', header: A.common.actions, width: 210, hideable: false, render: (a) => (
      <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="secondary" disabled={!access.edit} onClick={() => setAdjusting(a)}>{A.fees.adjust}</Button>
        <Button size="sm" variant="primary" disabled={!access.approve} loading={pending === a.id} onClick={() => run(a.id, () => api.finance.approveFee(a.id), A.fees.approved)}>{A.fees.approve}</Button>
      </span>
    ) },
  ]

  if (loading) return <div className="flex flex-col gap-4 p-5"><Skeleton height={260} className="rounded-card" /><Skeleton height={220} className="rounded-card" /></div>

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3">
          <Toolbar right={
            !editing ? <Button size="sm" variant="secondary" disabled={!access.edit} onClick={startEdit}>{A.fees.editDraft}</Button> : (
              <>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>{A.common.cancel}</Button>
                <Button size="sm" variant="secondary" leading={<Plus strokeWidth={1.75} />} onClick={() => setRules((rs) => [...rs, { id: uid('fr'), minTiyin: rs.at(-1)?.maxTiyin ?? 0, maxTiyin: null, type: 'percent', rate: 0.03, categoryId: null }])}>{A.fees.addRule}</Button>
                <Button size="sm" variant="secondary" loading={pending === 'save'} onClick={() => run('save', () => api.finance.saveDraftRules(rules, note), A.fees.savedDraft).then((r) => r && setEditing(false))}>{A.fees.saveDraft}</Button>
              </>
            )
          }>
            <span className="eyebrow">{A.fees.rules}</span>
            <Badge tone="green" dot>{A.fees.published} · {tt(A.fees.v, { n: published.version })}</Badge>
            {draft && !editing && <Badge tone="gold" dot>{A.fees.draft} · {tt(A.fees.v, { n: draft.version })}</Badge>}
            <SampleBadge />
          </Toolbar>
          {editing && <Field label={A.fees.draftNote}><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>}
          <DataTable columns={ruleCols} rows={shown} rowKey={(r) => r.id} pageSize={20} exportFilename="komissiya-qoidalari" columnsMenu={!editing} />
          <p className="m-0 text-[12px] text-ink-3">{A.fees.sampleHint}</p>
        </div>
        <div className="flex flex-col gap-4">
          <Panel eyebrow={A.fees.tryIt}>
            <div className="flex flex-col gap-3">
              <Field label={A.fees.tryPrice}><MoneyInput valueTiyin={simPrice} onChangeTiyin={setSimPrice} size="sm" /></Field>
              <Field label={A.fees.category}><Select size="sm" options={catOptions} value={simCat} onChange={(e) => setSimCat(e.target.value)} /></Field>
              {sim ? (
                <Ledger>
                  <LedgerRow label={A.fees.rule} value={<Badge tone="outline">{A.fees.types[sim.rule.type]}</Badge>} className="py-1.5" />
                  <LedgerRow label={A.pricing.fee} value={<Money tiyin={sim.feeTiyin} size="md" />} className="py-1.5" />
                  <LedgerRow label={A.fees.effective} value={<span className="tnum">{pctStr(sim.effectiveRate, 2)}</span>} className="py-1.5" />
                  <LedgerRow label={A.pricing.sellerGets} value={<Money tiyin={sim.sellerGetsTiyin} size="md" />} emphasis className="py-1.5" />
                </Ledger>
              ) : <span className="text-[13px] text-ink-3">—</span>}
            </div>
          </Panel>
          <Panel eyebrow={A.fees.history} padding={false}>
            <ul className="m-0 list-none divide-y divide-line p-0">
              {[...data.feeRuleSets].sort((a, b) => b.version - a.version).map((rs: FeeRuleSet) => (
                <li key={rs.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="tnum font-display text-[15px] font-bold text-ink">v{rs.version}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2"><Badge tone={rs.status === 'published' ? 'green' : rs.status === 'draft' ? 'gold' : 'outline'} dot>{A.fees[rs.status]}</Badge><span className="text-[11.5px] text-ink-3">{rs.rules.length} {A.fees.rules.toLowerCase()}</span></span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-ink-2" title={rs.note}>{rs.note || '—'}</span>
                    <span className="block text-[11.5px] text-ink-3">{rs.publishedAt ? fmtTime(rs.publishedAt) : ''} · {staffName(data, rs.createdBy)}</span>
                  </span>
                  {rs.status === 'draft' && <Button size="sm" variant="gold" disabled={!access.approve} loading={pending === 'pub'} onClick={() => run('pub', () => api.finance.publishRules(rs.id), A.fees.publishedToast)}>{A.fees.publish}</Button>}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <BulkBar count={sel.length} onClear={() => setSel([])}>
        <Button size="sm" variant="primary" disabled={!access.approve} loading={pending === 'bulk'} onClick={() => run('bulk', () => api.finance.approveFees(sel), A.fees.approved).then(() => setSel([]))}>{A.fees.approveSel} ({sel.length})</Button>
      </BulkBar>
      <DataTable columns={apprCols} rows={pendingApprovals} rowKey={(a) => a.id} selectable selected={sel} onSelectionChange={setSel} pageSize={10} exportFilename="haq-tasdiqlash" defaultSort={{ key: 'createdAt', dir: 'desc' }}
        toolbarLeft={<><span className="eyebrow">{A.fees.approvals}</span><Badge tone={pendingApprovals.length ? 'gold' : 'neutral'}>{pendingApprovals.length}</Badge></>}
        emptyState={<EmptyState compact icon="receipt" title={A.fees.emptyApprovals} />} />

      <AdjustModal a={adjusting} onClose={() => setAdjusting(null)} />
    </div>
  )
}

function AdjustModal({ a, onClose }: { a: FeeApproval | null; onClose: () => void }) {
  return <AdjustInner key={a?.id ?? 'none'} a={a} onClose={onClose} />
}
function AdjustInner({ a, onClose }: { a: FeeApproval | null; onClose: () => void }) {
  const [amount, setAmount] = useState<Tiyin | null>(a?.autoFeeTiyin ?? null)
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const { run, pending } = useAct()
  const invalid = reason.trim().length < 3
  return (
    <AdminModal open={!!a} onOpenChange={(o) => !o && onClose()} title={A.fees.adjust} description={a ? `${a.subOrderId} · ${A.fees.autoFee}: ${(a.autoFeeTiyin / S).toLocaleString('ru-RU')} so’m` : undefined}
      footer={<><Button variant="secondary" onClick={onClose}>{A.common.cancel}</Button><Button variant="gold" loading={pending === 'adj'} disabled={touched && invalid} onClick={async () => { setTouched(true); if (invalid || !a || amount === null) return; const r = await run('adj', () => api.finance.adjustFee(a.id, amount, reason.trim()), A.fees.adjusted); if (r) onClose() }}>{A.fees.adjust}</Button></>}>
      <div className="flex flex-col gap-3">
        <Field label={A.fees.newFee} required><MoneyInput valueTiyin={amount} onChangeTiyin={setAmount} /></Field>
        <Field label={A.fees.adjustReason} required error={touched && invalid ? A.common.reason : undefined}><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} onBlur={() => setTouched(true)} invalid={touched && invalid} /></Field>
      </div>
    </AdminModal>
  )
}
