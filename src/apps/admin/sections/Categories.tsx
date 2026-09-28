import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { Badge, Button, Checkbox, EmptyState, Field, Icon, Input, NumberInput, Select, Skeleton, Textarea } from '@/design'
import { useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { cn } from '@/lib/utils'
import type { AttributeDef, AttributeType, Category, Condition } from '@/domain/types'
import { AdminModal, SectionTitle } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useQueryParam, useSectionLoading } from '../lib/hooks'
import { A, tt } from '../strings'

export function Categories() {
  const data = useStore((s) => s.data)
  const access = useAccess('categories')
  const loading = useSectionLoading()
  const [qid, setQid] = useQueryParam('id')
  const [newOpen, setNewOpen] = useState(false)
  const roots = data.categories.filter((c) => !c.parentId)
  const children = (id: string) => data.categories.filter((c) => c.parentId === id)
  const selected = data.categories.find((c) => c.id === qid) ?? roots[0]
  const counts = useMemo(() => { const m = new Map<string, number>(); for (const l of data.listings) if (!l.historical) m.set(l.categoryId, (m.get(l.categoryId) ?? 0) + 1); return m }, [data.listings])
  useEffect(() => { if (!qid && roots[0]) setQid(roots[0].id) }, [qid, roots, setQid])
  if (loading) return <div className="grid h-full grid-cols-[300px_1fr] gap-4 p-5"><Skeleton height="100%" className="rounded-card" /><Skeleton height="100%" className="rounded-card" /></div>
  const Item = ({ c, depth }: { c: Category; depth: number }) => (
    <>
      <button type="button" onClick={() => setQid(c.id)} aria-current={selected?.id === c.id ? 'true' : undefined} className={cn('flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[13.5px] hover:bg-paper-2', selected?.id === c.id && 'bg-blue-soft font-semibold text-blue hover:bg-blue-soft')} style={{ paddingLeft: 8 + depth * 16 }}>
        {depth > 0 && <ChevronRight size={12} className="text-ink-3" aria-hidden="true" />}<Icon name={c.icon} size={16} className="text-ink-2" /><span className="min-w-0 flex-1 truncate">{c.name}</span><span className="tnum text-[11.5px] text-ink-3">{counts.get(c.id) ?? 0}</span>
      </button>
      {children(c.id).map((ch) => <Item key={ch.id} c={ch} depth={depth + 1} />)}
    </>
  )
  return (
    <div className="grid h-full min-h-0 grid-cols-[300px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-r border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-3 py-2.5"><span className="eyebrow">{A.categories.tree}</span><Button size="sm" variant="secondary" leading={<Plus strokeWidth={1.75} />} disabled={!access.edit} onClick={() => setNewOpen(true)}>{A.categories.new}</Button></div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2">{roots.map((c) => <Item key={c.id} c={c} depth={0} />)}</div>
      </aside>
      <section className="scroll-thin min-h-0 overflow-y-auto p-5">{selected ? <CategoryDetail key={selected.id} c={selected} canEdit={access.edit} count={counts.get(selected.id) ?? 0} /> : <EmptyState title={A.common.empty} />}</section>
      <NewCategory open={newOpen} onClose={() => setNewOpen(false)} roots={roots} />
    </div>
  )
}

function CategoryDetail({ c, canEdit, count }: { c: Category; canEdit: boolean; count: number }) {
  const { run, pending } = useAct()
  const [discount, setDiscount] = useState(Math.round(c.discountRate * 1000) / 10)
  const [ratio, setRatio] = useState(Math.round(c.maxNewRatio * 100))
  const [notes, setNotes] = useState(c.conditionNotes)
  const [attr, setAttr] = useState<{ key: string; label: string; type: AttributeType; options: string; unit: string; required: boolean }>({ key: '', label: '', type: 'text', options: '', unit: '', required: false })
  const dirtyNums = discount / 100 !== c.discountRate || ratio / 100 !== c.maxNewRatio
  const dirtyNotes = JSON.stringify(notes) !== JSON.stringify(c.conditionNotes)
  const addAttr = () => {
    if (!attr.key.trim() || !attr.label.trim()) return
    const def: AttributeDef = { key: attr.key.trim(), label: attr.label.trim(), type: attr.type, required: attr.required }
    if (attr.type === 'select') def.options = attr.options.split(',').map((s) => s.trim()).filter(Boolean)
    if (attr.unit.trim()) def.unit = attr.unit.trim()
    void run('attr', () => api.admin.updateCategory(c.id, { attributes: [...c.attributes, def] }), A.categories.saved).then(() => setAttr({ key: '', label: '', type: 'text', options: '', unit: '', required: false }))
  }
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <div className="flex items-center gap-3"><Icon name={c.icon} size={28} className="text-ink" /><div><h2 className="m-0 font-display text-[22px] leading-tight">{c.name}</h2><div className="text-[12.5px] text-ink-3"><span className="tnum">{c.id}</span> · {tt(A.categories.listingsCount, { n: count })}</div></div></div>
      <div className="grid grid-cols-2 gap-4 rounded-card border border-line bg-card p-4">
        <Field label={A.categories.discount}><NumberInput value={discount} onChange={setDiscount} step={0.5} min={0} max={50} disabled={!canEdit} aria-label={A.categories.discount} /></Field>
        <Field label={A.categories.maxNewRatio}><NumberInput value={ratio} onChange={setRatio} step={1} min={10} max={100} disabled={!canEdit} aria-label={A.categories.maxNewRatio} /></Field>
        <div className="col-span-2 flex justify-end"><Button size="sm" variant="gold" disabled={!canEdit || !dirtyNums} loading={pending === 'nums'} onClick={() => run('nums', () => api.admin.updateCategory(c.id, { discountRate: Math.round(discount * 10) / 1000, maxNewRatio: ratio / 100 }), A.categories.saved)}>{A.common.save}</Button></div>
      </div>
      <div>
        <SectionTitle>{A.categories.attributes} · {c.attributes.length}</SectionTitle>
        <div className="overflow-hidden rounded-card border border-line bg-card">
          <table className="w-full text-[13px]">
            <thead className="bg-paper"><tr className="border-b border-line text-left">{[A.categories.key, A.categories.label, A.categories.type, A.categories.options, A.categories.unit, A.categories.required].map((h) => <th key={h} className="eyebrow px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {c.attributes.map((a) => <tr key={a.key}><td className="tnum px-3 py-2 text-ink-2">{a.key}</td><td className="px-3 py-2 font-medium">{a.label}</td><td className="px-3 py-2"><Badge tone="outline" size="sm">{a.type}</Badge></td><td className="px-3 py-2 text-ink-2">{a.options?.join(', ') ?? '—'}</td><td className="px-3 py-2 text-ink-2">{a.unit ?? '—'}</td><td className="px-3 py-2">{a.required ? uz.app.yes : '—'}</td></tr>)}
              {canEdit && (
                <tr className="bg-paper">
                  <td className="px-2 py-2"><Input size="sm" value={attr.key} onChange={(e) => setAttr({ ...attr, key: e.target.value })} placeholder="kalit" aria-label={A.categories.key} /></td>
                  <td className="px-2 py-2"><Input size="sm" value={attr.label} onChange={(e) => setAttr({ ...attr, label: e.target.value })} placeholder={A.categories.label} aria-label={A.categories.label} /></td>
                  <td className="px-2 py-2"><Select size="sm" value={attr.type} onChange={(e) => setAttr({ ...attr, type: e.target.value as AttributeType })} options={[{ value: 'text', label: 'text' }, { value: 'number', label: 'number' }, { value: 'select', label: 'select' }]} aria-label={A.categories.type} /></td>
                  <td className="px-2 py-2"><Input size="sm" value={attr.options} onChange={(e) => setAttr({ ...attr, options: e.target.value })} placeholder={A.categories.optionsHint} disabled={attr.type !== 'select'} aria-label={A.categories.options} /></td>
                  <td className="px-2 py-2"><Input size="sm" value={attr.unit} onChange={(e) => setAttr({ ...attr, unit: e.target.value })} className="w-20" aria-label={A.categories.unit} /></td>
                  <td className="px-2 py-2"><span className="flex items-center gap-2"><Checkbox checked={attr.required} onCheckedChange={(v) => setAttr({ ...attr, required: v === true })} aria-label={A.categories.required} /><Button size="sm" variant="secondary" leading={<Plus strokeWidth={1.75} />} loading={pending === 'attr'} disabled={!attr.key.trim() || !attr.label.trim()} onClick={addAttr}>{A.common.add}</Button></span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <SectionTitle right={<Button size="sm" variant="secondary" disabled={!canEdit || !dirtyNotes} loading={pending === 'notes'} onClick={() => run('notes', () => api.admin.updateCategory(c.id, { conditionNotes: notes }), A.categories.saved)}>{A.common.save}</Button>}>{A.categories.conditions}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {(['A', 'B', 'C', 'D'] as Condition[]).map((k) => <Field key={k} label={uz.condition[k]}><Textarea rows={2} value={notes[k]} onChange={(e) => setNotes({ ...notes, [k]: e.target.value })} disabled={!canEdit} /></Field>)}
        </div>
      </div>
    </div>
  )
}

function NewCategory({ open, onClose, roots }: { open: boolean; onClose: () => void; roots: Category[] }) {
  const { run, pending } = useAct()
  const [name, setName] = useState(''); const [parent, setParent] = useState('')
  return (
    <AdminModal open={open} onOpenChange={(o) => !o && onClose()} title={A.categories.new} footer={<><Button variant="secondary" onClick={onClose}>{A.common.cancel}</Button><Button variant="gold" disabled={name.trim().length < 2} loading={pending === 'new'} onClick={async () => { const r = await run('new', () => api.admin.addCategory(name.trim(), parent || null), A.categories.created); if (r) { setName(''); onClose() } }}>{A.common.add}</Button></>}>
      <div className="flex flex-col gap-3"><Field label={A.common.title} required><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field><Field label={A.categories.parent}><Select value={parent} onChange={(e) => setParent(e.target.value)} options={[{ value: '', label: A.categories.root }, ...roots.map((r) => ({ value: r.id, label: r.name }))]} /></Field></div>
    </AdminModal>
  )
}
