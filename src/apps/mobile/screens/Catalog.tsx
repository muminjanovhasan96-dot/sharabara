import { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { useStore, useNow } from '@/store'
import { cn } from '@/lib/utils'
import { uz, t } from '@/i18n/uz'
import { formatMoney } from '@/domain/money'
import { BottomSheet, Button, Chip, ChipGroup, ErrorState, Field, RangeSlider, Segmented, Select, Switch, usePhoneContainer } from '@/design'
import type { Condition, Listing, Product, RegionId } from '@/domain/types'
import { ms } from '../strings'
import { isListing, useQuery, useScreenLoad } from '../lib'
import { Screen } from '../components/Screen'
import { CardGridSkeleton, ListingCard, ProductCard } from '../components/Cards'
import { EmptyState } from '../components/Ui'

type Sort = 'recommended' | 'cheap' | 'fresh' | 'popular'
const PAGE = 20
const PRICE_MAX = 3_000_000_000 // 30 mln so'm

interface Filters { cat: string | null; price: [number, number]; conds: Condition[]; region: RegionId | ''; verified: boolean; mall: boolean; bts: boolean; drops: boolean }

export default function Catalog() {
  const qp = useQuery()
  const now = useNow()
  const container = usePhoneContainer()
  const { loading, error, reload } = useScreenLoad()
  const categories = useStore((s) => s.data.categories)
  const regions = useStore((s) => s.data.regions)
  const companies = useStore((s) => s.data.companies)
  const listings = useStore((s) => s.data.listings)
  const products = useStore((s) => s.data.products)

  const initial: Filters = { cat: qp.get('cat'), price: [0, PRICE_MAX], conds: [], region: '', verified: qp.get('verified') === '1', mall: qp.get('mall') === '1', bts: false, drops: qp.get('drops') === '1' }
  const [filters, setFilters] = useState<Filters>(initial)
  const [draft, setDraft] = useState<Filters>(initial)
  const [sort, setSort] = useState<Sort>('recommended')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(PAGE)
  const q = (qp.get('q') ?? '').trim().toLowerCase()
  useEffect(() => { setFilters(initial); setDraft(initial) }, [qp]) // eslint-disable-line react-hooks/exhaustive-deps

  const apply = (f: Filters, items: (Listing | Product)[]) => items.filter((x) => {
    if (f.cat && x.categoryId !== f.cat) return false
    if (x.priceTiyin < f.price[0] || (f.price[1] < PRICE_MAX && x.priceTiyin > f.price[1])) return false
    if (isListing(x)) {
      if (f.mall) return false
      if (f.conds.length && !f.conds.includes(x.condition)) return false
      if (f.region && x.regionId !== f.region) return false
      if (f.verified && !x.priceVerified) return false
      if (f.drops && !(x.previousPriceTiyin !== undefined && x.previousPriceTiyin > x.priceTiyin)) return false
    } else {
      if (f.region || f.conds.length) return false
      if (f.verified && x.check !== 'passed') return false
      if (f.drops && !(x.previousPriceTiyin !== undefined && x.previousPriceTiyin > x.priceTiyin)) return false
      if (f.bts && companies.find((c) => c.id === x.companyId)?.model === 'self_ship') return false
    }
    if (q && !x.title.toLowerCase().includes(q)) return false
    return true
  })

  const base = useMemo<(Listing | Product)[]>(() => [
    ...listings.filter((l) => l.status === 'published' && !l.historical),
    ...products.filter((p) => p.stock > 0),
  ], [listings, products])

  const results = useMemo(() => {
    const out = apply(filters, base)
    const created = (x: Listing | Product) => (isListing(x) ? x.publishedAt ?? x.createdAt : x.createdAt)
    switch (sort) {
      case 'cheap': out.sort((a, b) => a.priceTiyin - b.priceTiyin); break
      case 'fresh': out.sort((a, b) => created(b).localeCompare(created(a))); break
      case 'popular': out.sort((a, b) => b.stats.views - a.stats.views); break
      default: out.sort((a, b) => Number(!!(isListing(b) && b.boosted)) - Number(!!(isListing(a) && a.boosted)) || Number(isListing(b) && b.priceVerified) - Number(isListing(a) && a.priceVerified) || created(b).localeCompare(created(a)))
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, base, sort, q, now])
  const draftCount = useMemo(() => apply(draft, base).length, [draft, base]) // eslint-disable-line react-hooks/exhaustive-deps

  // infinite scroll
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => { setShown(PAGE) }, [results])
  useEffect(() => {
    const el = sentinel.current; if (!el) return
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown((n) => Math.min(results.length, n + PAGE)) }, { rootMargin: '200px' })
    io.observe(el); return () => io.disconnect()
  }, [results.length])

  const activeCount = [filters.cat, filters.conds.length, filters.region, filters.verified, filters.mall, filters.bts, filters.drops, filters.price[0] > 0 || filters.price[1] < PRICE_MAX].filter(Boolean).length
  const reset = () => { const f: Filters = { cat: null, price: [0, PRICE_MAX], conds: [], region: '', verified: false, mall: false, bts: false, drops: false }; setDraft(f); setFilters(f) }
  const catName = filters.cat ? categories.find((c) => c.id === filters.cat)?.name : null
  const title = filters.mall ? uz.mall.title : catName ?? (q ? `«${q}»` : ms.catalog.title)

  return (
    <Screen
      title={title}
      eyebrow={loading ? undefined : t(uz.search.results, { n: results.length })}
      back={Boolean(filters.cat || q || filters.mall || filters.verified || filters.drops)}
      withTabBar
      right={<Button variant={activeCount ? 'primary' : 'secondary'} size="sm" className="rounded-full" onClick={() => { setDraft(filters); setOpen(true) }} leading={<SlidersHorizontal strokeWidth={1.75} />}>{uz.search.filters}{activeCount ? ` · ${activeCount}` : ''}</Button>}
    >
      <div className="sticky top-0 z-[5] -mx-4 flex items-center gap-2 bg-paper/95 py-2 pl-4 pr-3 backdrop-blur">
        <div role="radiogroup" aria-label={ms.catalog.sortLabel} className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pr-2">
          {([
            ['recommended', uz.search.sort.recommended], ['cheap', uz.search.sort.cheap], ['fresh', uz.search.sort.fresh], ['popular', uz.search.sort.popular],
          ] as [Sort, string][]).map(([value, label]) => (
            <Chip key={value} size="sm" role="radio" aria-checked={sort === value} selected={sort === value} onToggle={() => setSort(value)} className={cn(sort === value ? 'border-ink bg-ink !text-white' : 'border-line bg-card shadow-soft')}>{label}</Chip>
          ))}
        </div>
        <Segmented<'grid' | 'list'> value={view} onChange={setView} aria-label={ms.catalog.view} className="shrink-0 bg-card" options={[
          { value: 'grid', icon: <LayoutGrid strokeWidth={1.75} />, ariaLabel: uz.search.grid }, { value: 'list', icon: <List strokeWidth={1.75} />, ariaLabel: uz.search.list },
        ]} />
      </div>

      {error ? <ErrorState onRetry={reload} /> : loading ? <CardGridSkeleton n={6} cols={view === 'grid' ? 2 : 1} /> : results.length === 0 ? (
        <EmptyState icon="search-x" title={uz.search.noResults} hint={ms.catalog.emptyHint} action={<Button variant="secondary" onClick={reset}>{uz.search.reset}</Button>} />
      ) : (
        <>
          <div className={view === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
            {results.slice(0, shown).map((x) => isListing(x)
              ? <ListingCard key={x.id} listing={x} variant={view} />
              : <ProductCard key={x.id} product={x} variant={view} />)}
          </div>
          <div ref={sentinel} className="py-4 text-center text-[12px] text-ink-3">{shown < results.length ? ms.catalog.loadingMore : ms.catalog.end}</div>
        </>
      )}

      <BottomSheet
        open={open} onOpenChange={setOpen} container={container} snap="full" title={uz.search.filters}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={reset} className="flex-1">{uz.search.reset}</Button>
            <Button variant="gold" className="flex-[2]" onClick={() => { setFilters(draft); setOpen(false) }}>{uz.search.apply} ({draftCount})</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 pt-1">
          <Field label={uz.sell.category}>
            <ChipGroup size="sm" value={draft.cat} onChange={(v) => setDraft({ ...draft, cat: v })} options={categories.filter((c) => !c.parentId).map((c) => ({ value: c.id, label: c.name }))} />
          </Field>
          <Field label={uz.search.priceRange}>
            <RangeSlider min={0} max={PRICE_MAX} step={5_000_000} value={draft.price} onValueChange={(v) => setDraft({ ...draft, price: v })} format={(v) => (v >= PRICE_MAX ? `${formatMoney(PRICE_MAX, { withCurrency: false })}+` : formatMoney(v))} />
          </Field>
          <Field label={ms.catalog.condition}>
            <ChipGroup<Condition> mode="multi" size="sm" value={draft.conds} onChange={(v) => setDraft({ ...draft, conds: v })} options={(['A', 'B', 'C', 'D'] as Condition[]).map((c) => ({ value: c, label: uz.condition[c] }))} />
          </Field>
          <Field label={ms.catalog.region}>
            <Select value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value as RegionId | '' })}>
              <option value="">{ms.catalog.anyRegion}</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <div className="divide-y divide-line rounded-card bg-card px-4 shadow-soft">
            <Switch label={uz.search.onlyVerified} checked={draft.verified} onCheckedChange={(v) => setDraft({ ...draft, verified: v })} />
            <Switch label={uz.search.onlyMall} checked={draft.mall} onCheckedChange={(v) => setDraft({ ...draft, mall: v })} />
            <Switch label={uz.search.hasBts} checked={draft.bts} onCheckedChange={(v) => setDraft({ ...draft, bts: v })} />
            <Switch label={uz.home.priceDrops} checked={draft.drops} onCheckedChange={(v) => setDraft({ ...draft, drops: v })} />
          </div>
        </div>
      </BottomSheet>
    </Screen>
  )
}
