import { useState } from 'react'
import { Button, Field, Input, MoneyInput, NumberInput, Select } from '@/design'
import { useStore } from '@/store'
import { api } from '@/api'
import { AdminModal } from '../../components/ui'
import { useAct } from '../../lib/hooks'
import { A } from '../../strings'

export function NewProductModal(props: { open: boolean; onClose: () => void; defaultWh: string }) { return <Inner key={props.open ? 'o' : 'c'} {...props} /> }
function Inner({ open, onClose, defaultWh }: { open: boolean; onClose: () => void; defaultWh: string }) {
  const data = useStore((s) => s.data)
  const { run, pending } = useAct()
  const P = A.warehouse.product
  const cats = data.categories.filter((c) => c.parentId === null)
  const [companyId, setCompanyId] = useState(data.companies[0]?.id ?? '')
  const [sku, setSku] = useState(''); const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(cats[0]?.id ?? '')
  const [price, setPrice] = useState<number | null>(null); const [cost, setCost] = useState<number | null>(null)
  const [qty, setQty] = useState(10); const [whId, setWhId] = useState(defaultWh); const [warranty, setWarranty] = useState(12)
  const valid = !!companyId && sku.trim().length >= 2 && title.trim().length >= 3 && !!categoryId && (price ?? 0) > 0 && (cost ?? 0) >= 0 && !!whId
  const submit = async () => {
    const r = await run('add', () => api.warehouse.addProduct({ companyId, sku: sku.trim(), title: title.trim(), categoryId, priceTiyin: price ?? 0, unitCostTiyin: cost ?? Math.round((price ?? 0) * 0.78), qty, warehouseId: whId, warrantyMonths: warranty }), P.created)
    if (r) onClose()
  }
  return (
    <AdminModal open={open} onOpenChange={(o) => !o && onClose()} title={A.warehouse.newProduct} size="md"
      footer={<><Button variant="secondary" onClick={onClose}>{A.common.cancel}</Button><Button variant="gold" disabled={!valid} loading={pending === 'add'} onClick={submit}>{A.common.add}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={P.company} required className="col-span-2"><Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} options={data.companies.map((c) => ({ value: c.id, label: c.name }))} /></Field>
        <Field label={P.sku} required><Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder={P.skuPh} autoFocus /></Field>
        <Field label={P.category} required><Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={cats.map((c) => ({ value: c.id, label: c.name }))} /></Field>
        <Field label={P.title} required className="col-span-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={P.titlePh} /></Field>
        <Field label={P.price} required><MoneyInput valueTiyin={price} onChangeTiyin={setPrice} placeholder="0" /></Field>
        <Field label={P.cost}><MoneyInput valueTiyin={cost} onChangeTiyin={setCost} placeholder="0" /></Field>
        <Field label={P.qty}><NumberInput value={qty} onChange={setQty} min={0} max={9999} aria-label={P.qty} /></Field>
        <Field label={P.warehouse} required><Select value={whId} onChange={(e) => setWhId(e.target.value)} options={data.warehouses.map((w) => ({ value: w.id, label: w.name }))} /></Field>
        <Field label={P.warranty}><NumberInput value={warranty} onChange={setWarranty} min={0} max={60} aria-label={P.warranty} /></Field>
      </div>
    </AdminModal>
  )
}
