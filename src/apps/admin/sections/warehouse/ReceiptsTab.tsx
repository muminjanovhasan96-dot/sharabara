import { useMemo, useState } from 'react'
import { Check, PackageCheck, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, Field, Money, MoneyInput, NumberInput, Select, Textarea, type Column } from '@/design'
import { useNow, useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { formatMoney } from '@/domain/money'
import type { ReceiptStatus, StockReceipt, StockReceiptLine } from '@/domain/types'
import { AdminDrawer, AdminModal, BarList, IdLink, KV, KVGrid, Panel, SectionTitle, Steps } from '../../components/ui'
import { useAct, useQueryParam } from '../../lib/hooks'
import { fmtTime, staffName } from '../../lib/format'
import { A, tt } from '../../strings'
import { RECEIPT_TONE, inWh, receiptDate, receiptQty, whShort, type WhFilter } from './lib'

export function ReceiptStatusBadge({ status, size }: { status: ReceiptStatus; size?: 'sm' | 'md' }) { return <Badge tone={RECEIPT_TONE[status]} size={size} dot>{A.warehouse.receipts.statuses[status]}</Badge> }

export function ReceiptsTab({ wh, canEdit }: { wh: WhFilter; canEdit: boolean }) {
  const data = useStore((s) => s.data)
  const now = useNow()
  const [qr, setQr] = useQueryParam('receipt')
  const [status, setStatus] = useState('')
  const [wizard, setWizard] = useState(false)
  const R = A.warehouse.receipts
  const rows = useMemo(() => data.receipts.filter((r) => inWh(wh, r.warehouseId) && (!status || r.status === status)), [data.receipts, wh, status])
  const selected = qr ? data.receipts.find((r) => r.id === qr) : undefined
  const companyName = (id: string) => data.companies.find((c) => c.id === id)?.name ?? id
  const month = now.slice(0, 7)
  const byCompany = useMemo(() => {
    const m = new Map<string, { qty: number; sum: number }>()
    for (const r of data.receipts) { if (!inWh(wh, r.warehouseId) || r.status === 'expected' || receiptDate(r).slice(0, 7) !== month) continue; const a = m.get(r.companyId) ?? { qty: 0, sum: 0 }; a.qty += receiptQty(r); a.sum += r.totalTiyin; m.set(r.companyId, a) }
    return [...m.entries()].map(([id, a]) => ({ label: companyName(id), value: a.qty, hint: formatMoney(a.sum, { compact: true }) })).sort((a, b) => b.value - a.value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.receipts, data.companies, wh, month])

  const cols: Column<StockReceipt>[] = [
    { key: 'invoiceNo', header: R.invoice, sortable: true, width: 140, render: (r) => <span className="tnum font-medium">{r.invoiceNo}</span> },
    { key: 'companyId', header: R.company, sortable: true, sortValue: (r) => companyName(r.companyId), render: (r) => <span className="truncate">{companyName(r.companyId)}</span>, csv: (r) => companyName(r.companyId) },
    { key: 'warehouseId', header: R.warehouse, sortable: true, width: 140, render: (r) => <span className="truncate text-ink-2">{whShort(data, r.warehouseId)}</span>, csv: (r) => whShort(data, r.warehouseId) },
    { key: 'lines', header: R.lines, align: 'right', width: 80, sortValue: (r) => r.lines.length, render: (r) => <span className="tnum">{r.lines.length}</span>, csv: (r) => r.lines.length },
    { key: 'qty', header: R.qty, align: 'right', width: 80, sortable: true, sortValue: (r) => receiptQty(r), render: (r) => <span className="tnum">{receiptQty(r)}</span>, csv: (r) => receiptQty(r) },
    { key: 'totalTiyin', header: R.total, align: 'right', width: 140, sortable: true, render: (r) => <Money tiyin={r.totalTiyin} size="sm" />, csv: (r) => r.totalTiyin / 100 },
    { key: 'status', header: R.status, sortable: true, width: 140, render: (r) => <ReceiptStatusBadge status={r.status} />, csv: (r) => R.statuses[r.status] },
    { key: 'date', header: R.date, sortable: true, width: 130, sortValue: (r) => receiptDate(r), render: (r) => <span className="tnum text-ink-2">{fmtTime(receiptDate(r))}</span>, csv: (r) => receiptDate(r) },
  ]

  return (
    <div className="flex flex-col gap-3">
      <Panel eyebrow={R.thisMonth} bodyClassName="p-3">
        {byCompany.length === 0 ? <span className="text-[13px] text-ink-3">{R.noMonth}</span> : (
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
            {byCompany.map((r) => <BarList key={String(r.label)} rows={[r]} max={byCompany[0].value} format={(v) => `${v} ${uz.app.pcs}`} tone="blue" />)}
          </div>
        )}
      </Panel>
      <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setQr(r.id)} pageSize={12} exportFilename="kirimlar" defaultSort={{ key: 'date', dir: 'desc' }}
        toolbarLeft={<div className="flex items-center gap-2"><div className="w-44"><Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={R.status} options={[{ value: '', label: R.filterStatus }, ...(['expected', 'received', 'checked'] as ReceiptStatus[]).map((s) => ({ value: s, label: R.statuses[s] }))]} /></div><span className="tnum text-[12.5px] text-ink-3">{rows.length}</span></div>}
        toolbarRight={<Button size="sm" variant="gold" leading={<Plus strokeWidth={1.75} />} disabled={!canEdit} onClick={() => setWizard(true)}>{A.warehouse.newReceipt}</Button>}
        emptyState={<EmptyState compact icon="inbox" title={R.empty} hint={R.emptyHint} />} />
      <AdminDrawer open={!!selected} onOpenChange={(o) => !o && setQr(null)} width="lg" eyebrow={R.invoice} title={selected ? <span className="tnum">{selected.invoiceNo}</span> : undefined} actions={selected && <ReceiptStatusBadge status={selected.status} />}>
        {selected && <ReceiptDetail key={selected.id + selected.status} rc={selected} canEdit={canEdit} />}
      </AdminDrawer>
      <ReceiptWizard open={wizard} onClose={() => setWizard(false)} defaultWh={wh === 'all' ? data.warehouses[0]?.id ?? '' : wh} />
    </div>
  )
}

function ReceiptDetail({ rc, canEdit }: { rc: StockReceipt; canEdit: boolean }) {
  const data = useStore((s) => s.data)
  const { run, pending } = useAct()
  const R = A.warehouse.receipts
  const editable = canEdit && rc.status === 'expected'
  const [acc, setAcc] = useState<Record<string, number>>(() => Object.fromEntries(rc.lines.map((l) => [l.productId, l.acceptedQty ?? l.qty])))
  const product = (id: string) => data.products.find((p) => p.id === id)
  const company = data.companies.find((c) => c.id === rc.companyId)
  const accTotal = rc.lines.reduce((a, l) => a + (acc[l.productId] ?? l.qty), 0)
  return (
    <div className="flex flex-col gap-5">
      <KVGrid cols={3}>
        <KV label={R.company}>{company ? <IdLink to={`/companies?id=${company.id}`}>{company.name}</IdLink> : rc.companyId}</KV>
        <KV label={R.warehouse}>{whShort(data, rc.warehouseId)}</KV>
        <KV label={R.total}><Money tiyin={rc.totalTiyin} size="md" /></KV>
        <KV label={R.expectedAt}><span className="tnum">{fmtTime(rc.expectedAt)}</span></KV>
        <KV label={R.receivedAt}><span className="tnum">{rc.receivedAt ? fmtTime(rc.receivedAt) : '—'}</span></KV>
        <KV label={R.checkedBy}>{rc.checkedBy ? staffName(data, rc.checkedBy) : '—'}</KV>
      </KVGrid>
      {rc.note && <p className="m-0 rounded-card border border-line bg-paper p-3 text-[13px] text-ink-2">{rc.note}</p>}
      <div>
        <SectionTitle right={<span className="tnum text-[12.5px] text-ink-3">{tt(R.linesCount, { n: rc.lines.length })} · {accTotal} {uz.app.pcs}</span>}>{R.lines}</SectionTitle>
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-paper"><tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-3"><th className="py-1.5 font-medium">{R.product}</th><th className="py-1.5 text-right font-medium">{R.expectedQty}</th><th className="py-1.5 text-right font-medium">{R.acceptedQty}</th><th className="py-1.5 text-right font-medium">{R.unitCost}</th><th className="py-1.5 text-right font-medium">{R.sum}</th></tr></thead>
          <tbody>
            {rc.lines.map((l) => { const p = product(l.productId); const a = acc[l.productId] ?? l.qty; return (
              <tr key={l.productId} className="border-t border-line">
                <td className="py-2 pr-2"><div className="truncate font-medium text-ink">{p?.title ?? l.productId}</div><div className="tnum text-[11.5px] text-ink-3">{p?.sku}</div></td>
                <td className="tnum py-2 text-right text-ink-2">{l.qty}</td>
                <td className="py-2 text-right">{editable ? <NumberInput size="sm" value={a} onChange={(v) => setAcc((s) => ({ ...s, [l.productId]: v }))} min={0} max={l.qty * 2} aria-label={R.acceptedQty} className="ml-auto" /> : <span className={`tnum ${a !== l.qty ? 'font-semibold text-brick' : ''}`}>{a}</span>}</td>
                <td className="tnum py-2 text-right text-ink-2"><Money tiyin={l.unitCostTiyin} size="sm" bare /></td>
                <td className="tnum py-2 text-right"><Money tiyin={l.unitCostTiyin * a} size="sm" bare /></td>
              </tr>
            ) })}
          </tbody>
        </table>
      </div>
      {canEdit && rc.status !== 'checked' && (
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          {rc.status === 'expected' && <Button variant="gold" leading={<PackageCheck strokeWidth={1.75} />} loading={pending === 'recv'} onClick={() => run('recv', () => api.warehouse.receive(rc.id, acc), R.received)}>{R.receive}</Button>}
          {rc.status === 'received' && <Button variant="gold" leading={<Check strokeWidth={1.75} />} loading={pending === 'chk'} onClick={() => run('chk', () => api.warehouse.check(rc.id), R.checked)}>{R.check}</Button>}
        </div>
      )}
    </div>
  )
}

function ReceiptWizard(props: { open: boolean; onClose: () => void; defaultWh: string }) { return <ReceiptWizardInner key={props.open ? 'o' : 'c'} {...props} /> }
function ReceiptWizardInner({ open, onClose, defaultWh }: { open: boolean; onClose: () => void; defaultWh: string }) {
  const data = useStore((s) => s.data)
  const { run, pending } = useAct()
  const R = A.warehouse.receipts
  const [step, setStep] = useState(0)
  const [companyId, setCompanyId] = useState(data.companies[0]?.id ?? '')
  const [whId, setWhId] = useState(defaultWh)
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<StockReceiptLine[]>([])
  const own = useMemo(() => data.products.filter((p) => p.companyId === companyId), [data.products, companyId])
  const addLine = () => { const p = own.find((x) => !lines.some((l) => l.productId === x.id)) ?? own[0]; if (p) setLines((ls) => [...ls, { productId: p.id, qty: 10, unitCostTiyin: Math.round(p.priceTiyin * 0.78 / 100000) * 100000 }]) }
  const setLine = (i: number, patch: Partial<StockReceiptLine>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const total = lines.reduce((a, l) => a + l.qty * l.unitCostTiyin, 0)
  const qty = lines.reduce((a, l) => a + l.qty, 0)
  const valid = step === 0 ? !!companyId && !!whId : step === 1 ? lines.length > 0 && lines.every((l) => l.qty > 0 && l.unitCostTiyin > 0) : true
  const steps = [R.step1, R.step2, R.step3]
  const finish = async () => { const r = await run('create', () => api.warehouse.createReceipt({ companyId, warehouseId: whId, lines, note: note.trim() || undefined }), R.created); if (r) onClose() }
  const pName = (id: string) => data.products.find((p) => p.id === id)?.title ?? id
  return (
    <AdminModal open={open} onOpenChange={(o) => !o && onClose()} title={A.warehouse.newReceipt} size="lg"
      footer={<>
        <Button variant="secondary" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>{step === 0 ? A.common.cancel : uz.app.back}</Button>
        {step < 2 ? <Button variant="gold" disabled={!valid} onClick={() => setStep(step + 1)}>{uz.app.next}</Button> : <Button variant="gold" loading={pending === 'create'} onClick={finish}>{A.warehouse.newReceipt}</Button>}
      </>}>
      <Steps steps={steps} step={step} />
      {step === 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={R.company} required><Select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setLines([]) }} options={data.companies.map((c) => ({ value: c.id, label: c.name }))} /></Field>
          <Field label={R.warehouse} required><Select value={whId} onChange={(e) => setWhId(e.target.value)} options={data.warehouses.map((w) => ({ value: w.id, label: w.name }))} /></Field>
          <Field label={R.note} className="col-span-2"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
      )}
      {step === 1 && (
        <div className="flex flex-col gap-2">
          {own.length === 0 ? <p className="m-0 text-[13px] text-ink-3">{R.noProducts}</p> : lines.length === 0 ? <p className="m-0 text-[13px] text-ink-3">{R.pickProduct}</p> : (
            <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto_150px_36px] items-center gap-2">
                  <Select size="sm" value={l.productId} onChange={(e) => setLine(i, { productId: e.target.value })} aria-label={R.product} options={own.map((p) => ({ value: p.id, label: `${p.sku} · ${p.title}` }))} />
                  <NumberInput size="sm" value={l.qty} onChange={(v) => setLine(i, { qty: v })} min={1} max={9999} aria-label={R.qty} />
                  <MoneyInput size="sm" valueTiyin={l.unitCostTiyin} onChangeTiyin={(t) => setLine(i, { unitCostTiyin: t ?? 0 })} aria-label={R.unitCost} />
                  <button type="button" aria-label={R.removeLine} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-3 hover:bg-paper-2 hover:text-brick"><Trash2 size={16} strokeWidth={1.75} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between"><Button size="sm" variant="secondary" leading={<Plus strokeWidth={1.75} />} disabled={own.length === 0} onClick={addLine}>{R.addLine}</Button><span className="tnum text-[12.5px] text-ink-2">{qty} {uz.app.pcs} · <Money tiyin={total} size="sm" /></span></div>
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          <KVGrid cols={3}>
            <KV label={R.company}>{data.companies.find((c) => c.id === companyId)?.name}</KV>
            <KV label={R.warehouse}>{whShort(data, whId)}</KV>
            <KV label={R.total}><Money tiyin={total} size="md" /></KV>
          </KVGrid>
          <ul className="m-0 list-none divide-y divide-line rounded-card border border-line p-0">
            {lines.map((l, i) => <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]"><span className="truncate">{pName(l.productId)}</span><span className="tnum shrink-0 text-ink-2">{l.qty} × <Money tiyin={l.unitCostTiyin} size="sm" bare /> = <Money tiyin={l.qty * l.unitCostTiyin} size="sm" /></span></li>)}
          </ul>
          {note && <p className="m-0 text-[12.5px] text-ink-3">{note}</p>}
        </div>
      )}
    </AdminModal>
  )
}
