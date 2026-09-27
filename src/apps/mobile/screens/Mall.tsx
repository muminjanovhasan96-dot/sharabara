import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Store as StoreIcon, Truck } from 'lucide-react'
import { useStore, useNow } from '@/store'
import { useAppNavigate } from '@/lib/router'
import { uz, t } from '@/i18n/uz'
import { Badge, Card, ErrorState, Seal, Tabs, TabsList, TabsTrigger } from '@/design'
import { GoldCoin, NavyCard } from '../components/Ui'
import { ms } from '../strings'
import { monthsSince, useList, useScreenLoad } from '../lib'
import { Screen, SectionTitle } from '../components/Screen'
import { CardGridSkeleton, Carousel, ProductCard, Stars } from '../components/Cards'

export default function Mall() {
  const nav = useAppNavigate()
  const { loading, error, reload } = useScreenLoad()
  const companies = useList((s) => s.data.companies.filter((c) => c.status === 'active'))
  const products = useStore((s) => s.data.products)
  const campaigns = useList((s) => s.data.campaigns.filter((c) => c.status === 'sent'))
  const promos = useMemo(() => products.filter((p) => p.promo && p.stock > 0).slice(0, 10), [products])
  const grid = useMemo(() => products.filter((p) => p.stock > 0).sort((a, b) => b.stats.views - a.stats.views).slice(0, 30), [products])
  return (
    <Screen
      withTabBar
      header={
        <header className="pt-safe relative shrink-0 overflow-hidden px-4 pb-4 pt-3 text-white" style={{ background: 'linear-gradient(112deg, #0f1f3a 0%, #17305a 62%, #1d3a6b 100%)' }}>
          <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,180,0,.22) 0%, rgba(245,180,0,0) 70%)' }} aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <button type="button" onClick={() => nav('/')} className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10" aria-label={ms.common.back}>
              <span className="text-[22px] leading-none">‹</span>
            </button>
            <GoldCoin size={40} Icon={StoreIcon} />
            <div className="min-w-0">
              <h1 className="m-0 font-display text-[20px] leading-tight text-white">{uz.mall.title}</h1>
              <p className="m-0 mt-0.5 text-[12.5px] text-white/70">{uz.mall.subtitle}</p>
            </div>
          </div>
        </header>
      }
    >
      {error && <ErrorState compact onRetry={reload} className="mt-3" />}
      <section className="mt-4">
        <SectionTitle>{ms.mall.companies}</SectionTitle>
        <Carousel>
          {companies.map((c) => (
            <Card key={c.id} interactive onClick={() => nav(`/store/${c.id}`)} padding="sm" className="flex w-[220px] shrink-0 snap-start items-center gap-3 border-transparent">
              <Seal icon={c.sealIcon} size={56} variant="ink" />
              <div className="min-w-0">
                <div className="clamp-1 text-[14px] font-semibold">{c.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-3"><Stars value={c.rating} /></div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-ink-3"><Truck size={12} strokeWidth={1.75} />{t(uz.mall.shipSpeed, { n: c.shipSpeedDays })}</div>
              </div>
            </Card>
          ))}
        </Carousel>
      </section>

      {campaigns.length > 0 && (
        <section className="mt-5">
          <SectionTitle>{ms.mall.promos}</SectionTitle>
          <Carousel>
            {campaigns.map((c) => (
              <NavyCard key={c.id} padding="md" className="w-[260px] shrink-0 snap-start">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-gold-fill">{c.kind === 'push' ? 'Push' : 'Banner'}</div>
                <div className="mt-1 font-display text-[16px] leading-tight text-white">{c.title}</div>
                <p className="m-0 mt-1 clamp-2 text-[12.5px] text-white/75">{c.body}</p>
              </NavyCard>
            ))}
          </Carousel>
        </section>
      )}

      {promos.length > 0 && (
        <section className="mt-5">
          <SectionTitle action={ms.common.seeAll} onAction={() => nav('/catalog?mall=1&drops=1')}>{uz.home.priceDrops}</SectionTitle>
          {loading ? <CardGridSkeleton n={2} /> : <Carousel>{promos.map((p) => <ProductCard key={p.id} product={p} variant="carousel" />)}</Carousel>}
        </section>
      )}

      <section className="mt-6">
        <SectionTitle action={ms.common.seeAll} onAction={() => nav('/catalog?mall=1')}>{ms.mall.products}</SectionTitle>
        {loading ? <CardGridSkeleton n={6} /> : (
          <div className="grid grid-cols-2 gap-3">{grid.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </section>
    </Screen>
  )
}

export function Store() {
  const { companyId = '' } = useParams<{ companyId: string }>()
  const now = useNow()
  return <StoreInner id={companyId} now={now} />
}

export function StoreInner({ id, now }: { id: string; now: string }) {
  const nav = useAppNavigate()
  const rnav = useNavigate()
  const { loading, error, reload } = useScreenLoad([id])
  const company = useStore((s) => s.data.companies.find((c) => c.id === id))
  const products = useList((s) => s.data.products.filter((p) => p.companyId === id))
  const categories = useStore((s) => s.data.categories)
  const orders = useStore((s) => s.data.orders)
  const sold = useMemo(() => orders.reduce((a, o) => a + o.subOrders.filter((so) => so.sellerKey === `c:${id}` && !['cancelled', 'refunded'].includes(so.status)).reduce((b, so) => b + so.items.reduce((c, i) => c + i.qty, 0), 0), 0), [orders, id])
  const cats = useMemo(() => categories.filter((c) => products.some((p) => p.categoryId === c.id)), [categories, products])
  const [tab, setTab] = useState('all')
  const shown = useMemo(() => products.filter((p) => tab === 'all' || p.categoryId === tab), [products, tab])
  if (!company) return <Screen back title={ms.product.notFound}><ErrorState title={ms.product.notFound} onRetry={() => nav('/mall')} retryLabel={uz.mall.title} /></Screen>
  return (
    <Screen
      header={
        <header className="pt-safe shrink-0 px-4 pb-4 pt-2 text-white" style={{ background: 'linear-gradient(112deg, #0f1f3a 0%, #17305a 62%, #1d3a6b 100%)' }}>
          <button type="button" onClick={() => (window.history.length > 1 ? rnav(-1) : nav('/mall'))} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full px-2 text-[14px] hover:bg-white/10">‹ {ms.common.back}</button>
          <div className="mt-1 flex items-center gap-3">
            <Seal icon={company.sealIcon} size={56} variant="gold" ticks />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h1 className="m-0 clamp-1 font-display text-[19px] leading-tight text-white">{company.name}</h1><Badge tone="blue" size="sm" className="!bg-blue !text-white">{uz.mall.official}</Badge></div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-white/75">
                <span className="inline-flex items-center gap-1 text-gold-fill">★ <span className="tnum text-white">{company.rating.toFixed(1).replace('.', ',')}</span></span>
                <span className="tnum">{sold} {ms.mall.sold}</span>
                <span className="inline-flex items-center gap-1"><Truck size={12} strokeWidth={1.75} />{t(uz.mall.shipSpeed, { n: company.shipSpeedDays })}</span>
              </div>
            </div>
          </div>
          <p className="m-0 mt-3 text-[13px] leading-snug text-white/80">{company.description}</p>
          <div className="mt-2 text-[11.5px] text-white/55">{t(ms.mall.joined, { n: monthsSince(company.joinedAt, now) })} · {company.lateShipments} {ms.mall.lateShipments} · {Math.round(company.returnsRate * 1000) / 10}% {ms.mall.returnsRate}</div>
        </header>
      }
    >
      {error && <ErrorState compact onRetry={reload} className="mt-3" />}
      {products.some((p) => p.promo) && (
        <section className="mt-4">
          <SectionTitle>{ms.mall.promos}</SectionTitle>
          <Carousel>{products.filter((p) => p.promo).slice(0, 8).map((p) => <ProductCard key={p.id} product={p} variant="carousel" />)}</Carousel>
        </section>
      )}
      <section className="mt-4">
        <Tabs value={tab} onValueChange={setTab} size="sm">
          <TabsList className="-mx-4 px-4">
            <TabsTrigger value="all" count={products.length}>{ms.mall.allProducts}</TabsTrigger>
            {cats.map((c) => <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="mt-3">
          {loading ? <CardGridSkeleton n={4} /> : <div className="grid grid-cols-2 gap-3">{shown.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
        </div>
      </section>
    </Screen>
  )
}
