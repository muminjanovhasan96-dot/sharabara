import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, Field, Input, NumberInput, Seal, Select, Skeleton, Textarea, type Column } from '@/design'
import { useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import type { Company, CompanyModel, CompanyStatus } from '@/domain/types'
import { AdminDrawer, AdminModal, CompanyStatusBadge, IdLink, KV, KVGrid, Steps } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useQueryParam, useSectionLoading } from '../lib/hooks'
import { fmtTime, pctStr } from '../lib/format'
import { A } from '../strings'

export function Companies() {
  const data = useStore((s) => s.data)
  const access = useAccess('companies')
  const loading = useSectionLoading()
  const [qid, setQid] = useQueryParam('id')
  const [wizard, setWizard] = useState(false)
  const selected = qid ? data.companies.find((c) => c.id === qid) : undefined
  const productCount = useMemo(() => { const m = new Map<string, number>(); for (const p of data.products) m.set(p.companyId, (m.get(p.companyId) ?? 0) + 1); return m }, [data.products])
  const cols: Column<Company>[] = [
    { key: 'name', header: A.companies.name, sortable: true, render: (c) => <span className="flex items-center gap-2"><Seal icon={c.sealIcon} size={28} variant="paper" /><span className="truncate font-medium">{c.name}</span></span> },
    { key: 'inn', header: A.companies.inn, width: 120, render: (c) => <span className="tnum text-ink-2">{c.inn}</span> },
    { key: 'status', header: A.common.status, sortable: true, width: 130, render: (c) => <CompanyStatusBadge status={c.status} /> },
    { key: 'model', header: A.companies.model, sortable: true, width: 130, render: (c) => <Badge tone="outline">{A.common.company[c.model]}</Badge>, csv: (c) => A.common.company[c.model] },
    { key: 'commissionRate', header: A.companies.commission, sortable: true, align: 'right', width: 110, render: (c) => <span className="tnum">{pctStr(c.commissionRate, 1)}</span> },
    { key: 'rating', header: A.companies.rating, sortable: true, align: 'right', width: 90, render: (c) => <span className="tnum">{c.rating.toFixed(1)}</span> },
    { key: 'lateShipments', header: A.companies.late, sortable: true, align: 'right', width: 100, render: (c) => <span className={c.lateShipments > 5 ? 'tnum text-brick' : 'tnum'}>{c.lateShipments}</span> },
    { key: 'returnsRate', header: A.companies.returns, sortable: true, align: 'right', width: 100, render: (c) => <span className="tnum">{pctStr(c.returnsRate, 1)}</span> },
    { key: 'products', header: A.companies.products, align: 'right', width: 90, render: (c) => <span className="tnum">{productCount.get(c.id) ?? 0}</span>, csv: (c) => productCount.get(c.id) ?? 0 },
  ]
  if (loading) return <div className="p-5"><Skeleton height={360} className="rounded-card" /></div>
  return (
    <div className="flex flex-col gap-3 p-5">
      <DataTable columns={cols} rows={data.companies} rowKey={(c) => c.id} onRowClick={(c) => setQid(c.id)} pageSize={12} exportFilename="kompaniyalar" defaultSort={{ key: 'name', dir: 'asc' }}
        toolbarRight={<Button size="sm" variant="gold" leading={<Plus strokeWidth={1.75} />} disabled={!access.edit} onClick={() => setWizard(true)}>{A.companies.new}</Button>}
        emptyState={<EmptyState compact icon="building-2" title={A.common.empty} />} />
      <AdminDrawer open={!!selected} onOpenChange={(o) => !o && setQid(null)} eyebrow={uz.admin.sections.companies} title={selected?.name} actions={selected && <CompanyStatusBadge status={selected.status} />}>
        {selected && <CompanyDetail key={selected.id} c={selected} canEdit={access.edit} canApprove={access.approve} count={productCount.get(selected.id) ?? 0} />}
      </AdminDrawer>
      <Wizard open={wizard} onClose={() => setWizard(false)} />
    </div>
  )
}

function CompanyDetail({ c, canEdit, canApprove, count }: { c: Company; canEdit: boolean; canApprove: boolean; count: number }) {
  const { run, pending } = useAct()
  const [rate, setRate] = useState(Math.round(c.commissionRate * 1000) / 10)
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3"><Seal icon={c.sealIcon} size={56} variant="gold" ticks /><p className="m-0 text-[14px] leading-relaxed text-ink-2">{c.description}</p></div>
      <KVGrid cols={3}>
        <KV label={A.companies.inn}><span className="tnum">{c.inn}</span></KV>
        <KV label={A.companies.model}>{A.common.company[c.model]}</KV>
        <KV label={A.companies.joined}>{fmtTime(c.joinedAt)}</KV>
        <KV label={A.companies.rating}><span className="tnum">{c.rating.toFixed(1)}</span></KV>
        <KV label={A.companies.late}><span className="tnum">{c.lateShipments}</span></KV>
        <KV label={A.companies.returns}><span className="tnum">{pctStr(c.returnsRate, 1)}</span></KV>
        <KV label={A.companies.shipSpeed}><span className="tnum">{c.shipSpeedDays}</span></KV>
        <KV label={A.companies.products}><IdLink to={`/products?company=${c.id}`}>{count}</IdLink></KV>
        <KV label={A.companies.contract}>{c.contractFile ? <span className="tnum text-[13px]">{c.contractFile}</span> : <span className="text-ink-3">—</span>}</KV>
      </KVGrid>
      <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
        <Field label={A.companies.setStatus}>
          <Select size="sm" value={c.status} disabled={!canApprove || pending === 'status'} onChange={(e) => run('status', () => api.admin.setCompanyStatus(c.id, e.target.value as CompanyStatus), A.companies.statusChanged)} options={(['active', 'onboarding', 'suspended'] as CompanyStatus[]).map((s) => ({ value: s, label: A.common.companyStatus[s] }))} />
        </Field>
        <Field label={A.companies.setCommission}>
          <div className="flex items-center gap-2">
            <NumberInput size="sm" value={rate} onChange={setRate} step={0.5} min={0} max={30} disabled={!canEdit} aria-label={A.companies.setCommission} />
            <Button size="sm" variant="secondary" disabled={!canEdit || rate / 100 === c.commissionRate} loading={pending === 'rate'} onClick={() => run('rate', () => api.admin.setCommission(c.id, Math.round(rate * 10) / 1000), A.companies.commissionChanged)}>{A.common.save}</Button>
          </div>
        </Field>
      </div>
    </div>
  )
}

function Wizard({ open, onClose }: { open: boolean; onClose: () => void }) { return <WizardInner key={open ? 'o' : 'c'} open={open} onClose={onClose} /> }
function WizardInner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { run, pending } = useAct()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(''); const [inn, setInn] = useState(''); const [desc, setDesc] = useState('')
  const [file, setFile] = useState<string | undefined>()
  const [model, setModel] = useState<CompanyModel>('warehouse'); const [rate, setRate] = useState(8)
  const steps = [A.companies.step1, A.companies.step2, A.companies.step3]
  const valid = step === 0 ? name.trim().length >= 2 && inn.replace(/\D/g, '').length >= 9 : true
  const finish = async () => { const r = await run('create', () => api.admin.onboardCompany({ name: name.trim(), inn, model, commissionRate: Math.round(rate * 10) / 1000, contractFile: file, description: desc }), A.companies.created); if (r) onClose() }
  return (
    <AdminModal open={open} onOpenChange={(o) => !o && onClose()} title={A.companies.new} size="md"
      footer={<>
        <Button variant="secondary" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>{step === 0 ? A.common.cancel : uz.app.back}</Button>
        {step < 2 ? <Button variant="gold" disabled={!valid} onClick={() => setStep(step + 1)}>{uz.app.next}</Button> : <Button variant="gold" loading={pending === 'create'} onClick={finish}>{A.companies.new}</Button>}
      </>}>
      <Steps steps={steps} step={step} />
      {step === 0 && <div className="flex flex-col gap-3"><Field label={A.companies.name} required><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field><Field label={A.companies.inn} required><Input value={inn} onChange={(e) => setInn(e.target.value)} inputMode="numeric" placeholder="305 112 447" /></Field><Field label={A.companies.description}><Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field></div>}
      {step === 1 && <Field label={A.companies.file} hint={file ?? A.companies.noFile}><input type="file" accept=".pdf,.doc,.docx" aria-label={A.companies.file} onChange={(e) => setFile(e.target.files?.[0]?.name)} className="block w-full rounded-[10px] border border-line bg-card p-2 text-[13px] file:mr-3 file:rounded-[8px] file:border-0 file:bg-blue-soft file:px-3 file:py-1.5 file:font-medium file:text-blue" /></Field>}
      {step === 2 && <div className="flex flex-col gap-3"><Field label={A.companies.model}><Select value={model} onChange={(e) => setModel(e.target.value as CompanyModel)} options={(['wholesale', 'warehouse', 'self_ship'] as CompanyModel[]).map((m) => ({ value: m, label: A.common.company[m] }))} /></Field><Field label={A.companies.setCommission}><NumberInput value={rate} onChange={setRate} step={0.5} min={0} max={30} aria-label={A.companies.setCommission} /></Field></div>}
    </AdminModal>
  )
}
