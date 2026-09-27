import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Badge, Button, Chip, DataTable, EmptyState, Money, ProductImage, Skeleton, type Column } from '@/design'
import { useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import type { Product } from '@/domain/types'
import { AdminDrawer, CheckBadge, IdLink, KV, KVGrid, SectionTitle } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useQueryParam, useSectionLoading } from '../lib/hooks'
import { categoryName, signedPct } from '../lib/format'
import { imgId } from './Moderation'
import { A } from '../strings'

type Filter = 'all' | 'failed' | 'lowStock'

export function Products() {
  const data = useStore((s) => s.data)
  const access = useAccess('products')
  const loading = useSectionLoading()
  const [qid, setQid] = useQueryParam('id')
  const [qf, setQf] = useQueryParam('filter')
  const [qc] = useQueryParam('company')
  const filter: Filter = qf === 'failed' || qf === 'lowStock' ? qf : 'all'
  const [sel, setSel] = useState<string[]>([])
  const rows = useMemo(() => data.products.filter((p) => (filter === 'all' || (filter === 'failed' ? p.check !== 'passed' : p.stock <= 5)) && (!qc || p.companyId === qc)), [data.products, filter, qc])
  const selected = qid ? data.products.find((p) => p.id === qid) : undefined
  const company = (id: string) => data.companies.find((c) => c.id === id)?.name ?? id
  const { run, pending } = useAct()
  const cols: Column<Product>[] = [
    { key: 'title', header: A.common.title, sortable: true, render: (p) => <span className="flex items-center gap-2"><ProductImage id={imgId(p.images[0] ?? '', p.id)} className="h-8 w-8 shrink-0" fill={0.85} /><span className="truncate">{p.title}</span></span> },
    { key: 'companyId', header: A.products.company, sortable: true, width: 160, render: (p) => company(p.companyId), csv: (p) => company(p.companyId), sortValue: (p) => company(p.companyId) },
    { key: 'sku', header: A.products.sku, width: 110, render: (p) => <span className="tnum text-ink-2">{p.sku}</span> },
    { key: 'priceTiyin', header: A.common.price, sortable: true, align: 'right', width: 130, render: (p) => <Money tiyin={p.priceTiyin} size="sm" />, csv: (p) => p.priceTiyin / 100 },
    { key: 'marketMedianTiyin', header: A.products.market, sortable: true, align: 'right', width: 130, render: (p) => <Money tiyin={p.marketMedianTiyin} size="sm" className="text-ink-2" />, csv: (p) => p.marketMedianTiyin / 100 },
    { key: 'checkDelta', header: A.products.delta, sortable: true, align: 'right', width: 90, render: (p) => <span className={`tnum ${p.checkDelta > 0 ? 'text-brick' : 'text-green'}`}>{signedPct(p.checkDelta)}</span> },
    { key: 'stock', header: A.products.stock, sortable: true, align: 'right', width: 90, render: (p) => <span className={`tnum ${p.stock <= 5 ? 'text-brick' : ''}`}>{p.stock}{p.stock <= 5 && <Badge tone="brick" size="sm" className="ml-1">{A.products.lowStockBadge}</Badge>}</span> },
    { key: 'check', header: A.products.check, sortable: true, width: 120, render: (p) => <CheckBadge check={p.check} /> },
  ]
  if (loading) return <div className="p-5"><Skeleton height={480} className="rounded-card" /></div>
  const bulk = (r: 'passed' | 'overpriced') => run('bulk', async () => { for (const id of sel) await api.admin.productCheck(id, r) }, A.products.checked).then(() => setSel([]))
  return (
    <div className="flex flex-col gap-3 p-5">
      <DataTable columns={cols} rows={rows} rowKey={(p) => p.id} onRowClick={(p) => setQid(p.id)} selectable selected={sel} onSelectionChange={setSel} pageSize={15} exportFilename="tovarlar" defaultSort={{ key: 'check', dir: 'desc' }}
        toolbarLeft={<div className="flex flex-wrap items-center gap-1.5">{(['all', 'failed', 'lowStock'] as Filter[]).map((f) => <Chip key={f} size="sm" selected={filter === f} onToggle={() => setQf(f === 'all' ? null : f)}>{A.products.filters[f]}</Chip>)}{qc && <Badge tone="blue">{company(qc)}</Badge>}<span className="tnum text-[12.5px] text-ink-3">{rows.length}</span></div>}
        toolbarRight={sel.length > 0 && access.approve && <><Button size="sm" variant="secondary" leading={<X strokeWidth={1.75} />} loading={pending === 'bulk'} onClick={() => bulk('overpriced')}>{A.products.overpriced}</Button><Button size="sm" variant="gold" leading={<Check strokeWidth={1.75} />} loading={pending === 'bulk'} onClick={() => bulk('passed')}>{A.products.pass} ({sel.length})</Button></>}
        emptyState={<EmptyState compact icon="package" title={A.common.empty} hint={A.common.emptyHint} />} />
      <AdminDrawer open={!!selected} onOpenChange={(o) => !o && setQid(null)} eyebrow={uz.admin.sections.products} title={selected?.title} actions={selected && <CheckBadge check={selected.check} />}>
        {selected && <ProductDetail p={selected} canApprove={access.approve} />}
      </AdminDrawer>
    </div>
  )
}

function ProductDetail({ p, canApprove }: { p: Product; canApprove: boolean }) {
  const data = useStore((s) => s.data)
  const { run, pending } = useAct()
  const c = data.companies.find((x) => x.id === p.companyId)
  const ratio = p.marketMedianTiyin ? p.priceTiyin / p.marketMedianTiyin : 1
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4"><ProductImage id={imgId(p.images[0] ?? '', p.id)} className="h-28 w-28 shrink-0" /><div className="min-w-0 flex-1"><p className="m-0 text-[13.5px] leading-relaxed text-ink-2">{p.description}</p><div className="mt-2 flex flex-wrap gap-1.5"><Badge tone="outline">{categoryName(data, p.categoryId)}</Badge><Badge tone="neutral">{p.sku}</Badge>{p.promo && <Badge tone="gold">{p.promo.label}</Badge>}</div></div></div>
      <div className="rounded-card border border-line bg-paper p-4">
        <SectionTitle>{A.products.priceVsMarket}</SectionTitle>
        <div className="flex items-end justify-between gap-4">
          <div><div className="eyebrow !text-[10px]">{A.common.price}</div><Money tiyin={p.priceTiyin} size="xl" /></div>
          <div className="text-right"><div className="eyebrow !text-[10px]">{A.products.market}</div><Money tiyin={p.marketMedianTiyin} size="lg" className="text-ink-2" /></div>
        </div>
        <div className="relative mt-3 h-2 w-full rounded-full bg-paper-2"><div className="absolute left-1/2 top-[-3px] h-[14px] w-px bg-ink-3" /><div className={`absolute top-0 h-full rounded-full ${ratio > 1 ? 'left-1/2 bg-brick' : 'right-1/2 bg-green'}`} style={{ width: `${Math.min(50, Math.abs(ratio - 1) * 100)}%` }} /></div>
        <div className={`tnum mt-2 text-[13px] font-semibold ${p.checkDelta > 0 ? 'text-brick' : 'text-green'}`}>{signedPct(p.checkDelta)} {A.products.market.toLowerCase()}ga nisbatan</div>
      </div>
      <KVGrid cols={3}>
        <KV label={A.products.company}>{c ? <IdLink to={`/companies?id=${c.id}`}>{c.name}</IdLink> : '—'}</KV>
        <KV label={A.products.stock}><span className={`tnum ${p.stock <= 5 ? 'text-brick' : ''}`}>{p.stock} {uz.app.pcs}</span></KV>
        <KV label={A.products.warranty}><span className="tnum">{p.warrantyMonths}</span></KV>
        <KV label={A.products.returnDays}><span className="tnum">{p.returnDays}</span></KV>
        <KV label={uz.listing.views}><span className="tnum">{p.stats.views}</span></KV>
        <KV label={uz.listing.saves}><span className="tnum">{p.stats.saves}</span></KV>
      </KVGrid>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="secondary" leading={<X strokeWidth={1.75} />} disabled={!canApprove || p.check === 'overpriced'} loading={pending === 'over'} onClick={() => run('over', () => api.admin.productCheck(p.id, 'overpriced'), A.products.checked)}>{A.products.overpriced}</Button>
        <Button variant="gold" leading={<Check strokeWidth={1.75} />} disabled={!canApprove || p.check === 'passed'} loading={pending === 'pass'} onClick={() => run('pass', () => api.admin.productCheck(p.id, 'passed'), A.products.checked)}>{A.products.pass}</Button>
      </div>
    </div>
  )
}
