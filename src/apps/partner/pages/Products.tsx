import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tag } from 'lucide-react'
import {
  Badge, Button, Chip, DataTable, Drawer, EmptyState, Field, Input, Ledger, LedgerRow, Money, MoneyInput, ProductImage, SearchInput, Select, toast, type Column,
} from '@/design'
import { api } from '@/api'
import { useData, useNow } from '@/store'
import { formatDemoDate } from '@/domain/clock'
import { formatMoney, percent } from '@/domain/money'
import type { Product } from '@/domain/types'
import { t } from '@/i18n/uz'
import { cn } from '@/lib/utils'
import { useCompany, useCompanyProducts, useContainerWidth, useListLoading } from '../hooks'
import { P } from '../strings'
import { CheckBadge, PageHeader, Stat } from '../ui'

/* ─── Inline editors ─────────────────────────────────────────────────── */
function PriceCell({ p }: { p: Product }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState<number | null>(p.priceTiyin)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.select() }, [editing])
  const commit = async () => {
    if (val === null || val < 100_000) { toast.error(P.products.priceTooLow); return }
    if (val > 50_000_000_000) { toast.error(P.products.priceTooHigh); return }
    if (val === p.priceTiyin) { setEditing(false); return }
    setBusy(true)
    try {
      const np = await api.partner.updateProduct(p.id, { priceTiyin: val })
      toast.success(P.products.priceSaved, { description: `${p.sku} · ${formatMoney(val)}` })
      if (np.check === 'overpriced') toast.error(P.products.nowOverpriced, { description: `${P.products.market}: ${formatMoney(p.marketMedianTiyin)}` })
    } catch { toast.error(P.products.saveError) } finally { setBusy(false); setEditing(false) }
  }
  if (!editing) {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); setVal(p.priceTiyin); setEditing(true) }} aria-label={`${P.products.price}: ${formatMoney(p.priceTiyin)}. Tahrirlash`}
        className="-mx-2 inline-flex h-9 flex-col items-end justify-center rounded-[6px] border border-transparent px-2 leading-none hover:border-line-strong hover:bg-card">
        {p.previousPriceTiyin && p.previousPriceTiyin > p.priceTiyin && <Money tiyin={p.previousPriceTiyin} size="xs" strike bare className="mb-0.5 text-[11px]" />}
        <Money tiyin={p.priceTiyin} size="sm" className="font-medium" />
      </button>
    )
  }
  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-block w-[150px]">
      <MoneyInput ref={ref} size="sm" valueTiyin={val} onChangeTiyin={setVal} disabled={busy} autoFocus aria-label={P.products.price}
        onKeyDown={(e) => { if (e.key === 'Enter') void commit(); if (e.key === 'Escape') setEditing(false) }} onBlur={() => void commit()} />
    </span>
  )
}

function StockCell({ p }: { p: Product }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(p.stock))
  const [busy, setBusy] = useState(false)
  const commit = async () => {
    const n = Number(val.replace(/[^\d]/g, ''))
    if (!Number.isFinite(n)) { setEditing(false); return }
    if (n === p.stock) { setEditing(false); return }
    setBusy(true)
    try { await api.partner.updateProduct(p.id, { stock: n }); toast.success(P.products.stockSaved, { description: `${p.sku} · ${n} ${P.common.pcs}` }) }
    catch { toast.error(P.products.saveError) } finally { setBusy(false); setEditing(false) }
  }
  if (!editing) {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); setVal(String(p.stock)); setEditing(true) }} aria-label={`${P.products.stock}: ${p.stock}. Tahrirlash`}
        className={cn('tnum -mx-2 inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-transparent px-2 hover:border-line-strong hover:bg-card', p.stock <= 5 && 'font-semibold text-brick')}>
        {p.stock}
        {p.stock <= 5 && <Badge tone="brick" size="sm">{P.products.lowStockBadge}</Badge>}
      </button>
    )
  }
  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-block w-[84px]">
      <Input size="sm" inputMode="numeric" value={val} onChange={(e) => setVal(e.target.value)} disabled={busy} autoFocus aria-label={P.products.stock} className="tnum text-right"
        onKeyDown={(e) => { if (e.key === 'Enter') void commit(); if (e.key === 'Escape') setEditing(false) }} onBlur={() => void commit()} />
    </span>
  )
}

/* ─── Promo form (drawer) ────────────────────────────────────────────── */
export function PromoForm({ product, onDone }: { product: Product; onDone?: () => void }) {
  const [label, setLabel] = useState('Aksiya')
  const [days, setDays] = useState('7')
  const [price, setPrice] = useState<number | null>(Math.round(product.priceTiyin * 0.9 / 100000) * 100000)
  const [busy, setBusy] = useState(false)
  const invalid = price === null || price >= product.priceTiyin
  const submit = async () => {
    if (invalid || !label.trim()) return
    setBusy(true)
    try {
      await api.partner.createPromo(product.id, label.trim(), Math.max(1, Number(days) || 7), price)
      toast.gold(P.products.promoCreated, { description: `${product.title} · ${label} · ${formatMoney(price)}` })
      onDone?.()
    } catch { toast.error(P.products.saveError) } finally { setBusy(false) }
  }
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void submit() }}>
      <Field label={P.products.promoLabel} required><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={P.promos.labelPh} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={P.products.promoDays}><Input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/[^\d]/g, ''))} /></Field>
        <Field label={P.products.promoPrice} error={price !== null && price >= product.priceTiyin ? P.promos.priceMustBeLower : undefined}
          hint={price !== null && price < product.priceTiyin ? `${P.promos.discount}: ${percent((price - product.priceTiyin) / product.priceTiyin)}` : undefined}>
          <MoneyInput valueTiyin={price} onChangeTiyin={setPrice} invalid={price !== null && price >= product.priceTiyin} />
        </Field>
      </div>
      <Button type="submit" variant="gold" loading={busy} disabled={invalid || !label.trim()} leading={<Tag />}>{P.products.createPromo}</Button>
    </form>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export function Products() {
  const c = useCompany()
  const now = useNow()
  const all = useCompanyProducts(c.id)
  const categories = useData((d) => d.categories)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [check, setCheck] = useState(params.get('check') ?? '')
  const [low, setLow] = useState(params.get('low') === '1')
  const [openId, setOpenId] = useState<string | null>(null)
  const loading = useListLoading(c.id)
  const [wrapRef, width] = useContainerWidth<HTMLDivElement>()
  const hiddenColumns = useMemo(() => (width < 1000 ? ['marketMedianTiyin'] : []), [width])
  useEffect(() => { if (params.has('check') || params.has('low')) setParams({}, { replace: true }) }, [params, setParams])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return all.filter((p) => (!s || p.title.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)) && (!cat || p.categoryId === cat) && (!check || p.check === check) && (!low || p.stock <= 5))
  }, [all, q, cat, check, low])
  const open = all.find((p) => p.id === openId) ?? null
  const catName = (id: string) => categories.find((x) => x.id === id)?.name ?? id

  const columns: Column<Product>[] = [
    { key: 'sku', header: P.products.sku, sortable: true, width: 110, render: (p) => <span className="font-mono text-[12px] text-ink-2">{p.sku}</span> },
    { key: 'title', header: P.products.product, sortable: true, render: (p) => (
      <span className="flex items-center gap-2.5">
        <ProductImage id={p.images[0]} className="h-8 w-8 shrink-0" fill={0.8} />
        <span className="min-w-0"><span className="clamp-1 block text-ink">{p.title}</span><span className="block text-[11.5px] text-ink-3">{catName(p.categoryId)}{p.promo ? ` · ${p.promo.label}` : ''}</span></span>
      </span>
    ) },
    { key: 'stock', header: P.products.stock, sortable: true, align: 'right', width: 110, render: (p) => <StockCell p={p} /> },
    { key: 'priceTiyin', header: P.products.price, sortable: true, align: 'right', width: 170, csv: (p) => p.priceTiyin / 100, render: (p) => <PriceCell p={p} /> },
    { key: 'marketMedianTiyin', header: P.products.market, sortable: true, align: 'right', width: 140, csv: (p) => p.marketMedianTiyin / 100, render: (p) => <Money tiyin={p.marketMedianTiyin} size="sm" className="text-ink-2" /> },
    { key: 'check', header: P.products.check, sortable: true, width: 150, sortValue: (p) => p.checkDelta, csv: (p) => `${p.check} ${percent(p.checkDelta)}`, render: (p) => <CheckBadge product={p} size="sm" /> },
  ]

  return (
    <div ref={wrapRef}>
      <PageHeader eyebrow={c.name} title={P.nav.products}>{t(P.products.total, { n: all.length })} · {P.products.editHint}</PageHeader>
      <DataTable<Product>
        columns={columns} rows={rows} rowKey={(p) => p.id} loading={loading} onRowClick={(p) => setOpenId(p.id)} pageSize={15}
        exportFilename={`${c.id}-tovarlar`} defaultSort={{ key: 'stock', dir: 'asc' }} hiddenColumns={hiddenColumns}
        rowClassName={(p) => (p.stock <= 5 ? 'bg-brick-soft/40' : undefined)}
        emptyState={<EmptyState compact icon="package-search" title={P.products.empty} hint={P.products.emptyHint} />}
        toolbarLeft={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput size="sm" value={q} onChange={setQ} placeholder={P.products.search} className="w-[240px]" aria-label={P.products.search} />
            <div className="w-[180px]"><Select size="sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label={P.products.category}>
              <option value="">{P.products.allCategories}</option>
              {categories.filter((x) => all.some((p) => p.categoryId === x.id)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select></div>
            <div className="w-[170px]"><Select size="sm" value={check} onChange={(e) => setCheck(e.target.value)} aria-label={P.products.check}>
              <option value="">{P.products.allChecks}</option>
              <option value="passed">{P.products.checkPassed}</option><option value="overpriced">{P.products.checkOver}</option><option value="pending">{P.products.checkPending}</option>
            </Select></div>
            <Chip size="sm" selected={low} onToggle={setLow}>{P.products.lowStockOnly}</Chip>
          </div>
        }
      />

      <Drawer open={Boolean(open)} onOpenChange={(v) => { if (!v) setOpenId(null) }} eyebrow={open?.sku} title={open?.title} width="md">
        {open && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-4">
              <ProductImage id={open.images[0]} className="w-[140px] shrink-0" />
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2"><CheckBadge product={open} />{open.promo && <Badge tone="gold" Icon={Tag}>{open.promo.label} · {t(P.products.promoUntil, { d: formatDemoDate(open.promo.until) })}</Badge>}</div>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label={P.products.price} value={<Money tiyin={open.priceTiyin} size="lg" />} />
                  <Stat label={P.products.market} value={<Money tiyin={open.marketMedianTiyin} />} />
                  <Stat label={P.products.stock} value={<span className={cn(open.stock <= 5 && 'text-brick')}>{open.stock} {P.common.pcs}</span>} />
                  <Stat label={P.products.category} value={catName(open.categoryId)} />
                </div>
              </div>
            </div>
            <Ledger inset>
              <LedgerRow label={P.products.warranty} value={t(P.products.warrantyMonths, { n: open.warrantyMonths })} />
              <LedgerRow label="Qaytarish" value={t(P.products.returnDays, { n: open.returnDays })} />
              <LedgerRow label={P.products.views} value={`${open.stats.views} · 14 kun`} />
              <LedgerRow label="Qo’shilgan" value={formatDemoDate(open.createdAt)} />
            </Ledger>
            {open.description && <div><div className="eyebrow mb-1">{P.products.description}</div><p className="m-0 text-[14px] leading-relaxed text-ink-2">{open.description}</p></div>}
            <div className="rounded-card border border-gold/30 bg-gold-soft p-4">
              <div className="eyebrow mb-3">{P.products.createPromo}</div>
              <PromoForm key={open.id + String(now)} product={open} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
