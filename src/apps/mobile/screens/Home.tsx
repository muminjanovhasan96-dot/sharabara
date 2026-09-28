import { useMemo, useState } from 'react'
import { Bell, Camera, Check, ChevronDown, ChevronRight, MapPin, Search } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useStore, useNow } from '@/store'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { cn, SPRING } from '@/lib/utils'
import { uz, t } from '@/i18n/uz'
import { groupDigits } from '@/domain/money'
import { rankFeed } from '@/domain/recs'
import { Badge, BottomSheet, Button, ErrorState, Seal, usePhoneContainer } from '@/design'
import type { Listing, Product, RegionId } from '@/domain/types'
import { ms } from '../strings'
import { regionName, useMe, useMeId, useScreenLoad } from '../lib'
import { SectionTitle } from '../components/Screen'
import { CAROUSEL_CARD_H, CardGridSkeleton, Carousel, CarouselSkeleton, ListingCard, ProductCard } from '../components/Cards'
import { PullToRefresh } from '../components/PullToRefresh'
import { EmptyState, GoldCoin, NavyCard, PastelTile, categoryTone } from '../components/Ui'

const shortRegion = (name: string) => name.replace(' shahri', '').replace(' viloyati', '')

export default function Home() {
  const nav = useAppNavigate()
  const meId = useMeId()
  const me = useMe()
  const now = useNow()
  const reduce = useReducedMotion()
  const container = usePhoneContainer()
  const [region, setRegion] = useState<RegionId | null>(null)
  const [pick, setPick] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { loading, error, reload } = useScreenLoad([meId])

  const regions = useStore((s) => s.data.regions)
  const categories = useStore((s) => s.data.categories)
  const version = useStore((s) => s.version)
  const unread = useStore((s) => s.data.notifications.filter((n) => n.userId === s.session.userId && !n.read).length)

  // memo by store version: rankFeed is pure; data comes from the store snapshot
  const { forYou, verified, drops, mall, fresh, personal, verifiedCount } = useMemo(() => {
    const d = useStore.getState().data
    const listings = region ? d.listings.filter((l) => l.regionId === region) : d.listings
    const live = listings.filter((l) => l.status === 'published' && !l.historical)
    const byDate = (a: Listing, b: Listing) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    const feed = rankFeed({ userId: meId, events: d.events, listings, products: d.products, now, limit: 36 })
    const byL = new Map(d.listings.map((l) => [l.id, l])); const byP = new Map(d.products.map((p) => [p.id, p]))
    const items = feed.map((f) => ({ f, item: f.source === 'listing' ? byL.get(f.id) : byP.get(f.id) })).filter((x) => x.item)
    const personalItems = items.filter((x) => x.f.bucket === 'personal')
    const forYou = (personalItems.length ? personalItems : items).slice(0, 12)
    const verified = live.filter((l) => l.priceVerified).sort(byDate).slice(0, 10)
    const drops = live.filter((l) => l.previousPriceTiyin !== undefined && l.previousPriceTiyin > l.priceTiyin).slice(0, 10)
    const mall: Product[] = d.products.filter((p) => p.stock > 0).slice().sort((a, b) => b.stats.views - a.stats.views).slice(0, 10)
    const fresh = live.slice().sort(byDate).slice(0, 20)
    const verifiedCount = d.listings.filter((l) => l.priceVerified).length
    return { forYou, verified, drops, mall, fresh, personal: personalItems.length > 0, verifiedCount }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId, now, region, version])

  const refresh = async () => { setRefreshing(true); reload(); await new Promise((r) => setTimeout(r, 900)); setRefreshing(false) }
  const regionLabel = region ? shortRegion(regionName(regions, region)) : ms.home.allRegions
  const topCats = categories.filter((c) => !c.parentId).slice(0, 8)

  return (
    <div className="flex h-full flex-col">
      <header className="pt-safe shrink-0 bg-paper px-4 pb-3 pt-2">
        <div className="flex h-10 items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPick(true)}
            aria-haspopup="dialog"
            className="-ml-1 inline-flex h-10 min-w-0 items-center gap-1 rounded-full pl-1 pr-2 text-[15px] font-semibold text-ink active:bg-paper-2"
          >
            <MapPin size={17} strokeWidth={2} className="shrink-0 text-gold" />
            <span className="clamp-1">{regionLabel}</span>
            <ChevronDown size={16} strokeWidth={2} className="shrink-0 text-ink-3" />
          </button>
          <button type="button" onClick={() => nav('/notifications')} aria-label={unread > 0 ? `${uz.notif.title} ${unread}` : uz.notif.title} className="relative -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink active:bg-paper-2">
            <Bell size={23} strokeWidth={1.9} />
            {unread > 0 && <span className="tnum absolute right-0.5 top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brick px-1 text-[10.5px] font-bold text-white ring-2 ring-paper">{unread}</span>}
          </button>
        </div>
        <div className="mt-1.5 flex h-11 items-center gap-2 rounded-[14px] bg-card pl-3.5 pr-1 shadow-soft">
          <button type="button" onClick={() => nav('/search')} className="flex h-full min-w-0 flex-1 items-center gap-2.5 text-left text-[15px] text-ink-3">
            <Search size={19} strokeWidth={1.9} className="shrink-0 text-ink-2" />
            <span className="clamp-1">{uz.search.placeholder}</span>
          </button>
          <button type="button" onClick={() => nav('/search')} aria-label={ms.home.camera} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 active:bg-paper-2">
            <Camera size={19} strokeWidth={1.9} />
          </button>
        </div>
      </header>

      <PullToRefresh onRefresh={refresh} refreshing={refreshing} className="px-4 pb-6">
        {/* Hero: Narx bilan yutamiz */}
        <NavyCard
          padding="none" role="button" tabIndex={0}
          onClick={() => nav('/catalog?verified=1')} onKeyDown={(e) => { if (e.key === 'Enter') nav('/catalog?verified=1') }}
          className="paper-texture flex min-h-[124px] cursor-pointer items-center justify-between gap-3 py-4 pl-[18px] pr-4"
        >
          <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,180,0,.42) 0%, rgba(245,180,0,0) 70%)' }} aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(227,190,74,.22) 0%, rgba(227,190,74,0) 70%)' }} aria-hidden="true" />
          <div className="relative min-w-0 flex-1">
            <div className="font-display text-[21px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">{ms.home.heroTitle}</div>
            <div className="tnum mt-1 text-[12.5px] text-white/70">{t(ms.home.heroSub, { n: groupDigits(verifiedCount) })}</div>
            <Button variant="gold" size="sm" className="mt-3 h-[34px] rounded-[10px] px-3 text-[12.5px]" trailing={<ChevronRight strokeWidth={2.5} />} onClick={(e) => { e.stopPropagation(); nav('/catalog?verified=1') }}>
              {ms.home.heroCta}
            </Button>
          </div>
          <GoldCoin size={72} className="relative mr-1" />
        </NavyCard>

        {/* Kategoriya plitkalari: 2 qator × 4 */}
        <section className="mt-4 grid grid-cols-4 gap-x-2 gap-y-3" aria-label={uz.home.categories}>
          {topCats.map((c, i) => {
            const tone = categoryTone(c.id, i)
            return (
              <motion.button key={c.id} type="button" whileTap={reduce ? undefined : { scale: 0.94 }} transition={SPRING} onClick={() => nav(`/catalog?cat=${c.id}`)} className="flex min-w-0 flex-col items-center gap-1.5">
                <PastelTile icon={c.icon} tone={tone} size={66} iconSize={28} />
                <span className="clamp-2 w-full text-center text-[12px] font-medium leading-[15px] text-ink">{c.name}</span>
              </motion.button>
            )
          })}
        </section>

        {error && <ErrorState compact onRetry={reload} className="my-3" />}

        {/* Siz uchun tanlandi */}
        <section data-testid={TID.mForYou} className="mt-6">
          <SectionTitle action={uz.home.seeAll} onAction={() => nav('/catalog')}>{personal ? uz.home.forYou : ms.home.generic}</SectionTitle>
          {loading ? <CarouselSkeleton h={CAROUSEL_CARD_H + 16} /> : forYou.length === 0 ? (
            <EmptyState compact icon="sparkles" title={ms.home.noFeed} hint={ms.home.noFeedHint} />
          ) : (
            <Carousel>
              {forYou.map(({ f, item }) => f.source === 'listing'
                ? <ListingCard key={f.id} listing={item as never} variant="carousel" reason={f.reason} />
                : <ProductCard key={f.id} product={item as never} variant="carousel" reason={f.reason} />)}
            </Carousel>
          )}
        </section>

        {/* Sharabara Mall banneri */}
        <button type="button" onClick={() => nav('/mall')} className="mt-5 flex w-full items-center gap-3 rounded-card border border-line bg-card p-3 text-left shadow-soft active:scale-[.99]">
          <Seal size={40} variant="gold" icon="store" />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[15px] leading-tight text-ink">{ms.home.mallBannerTitle}</span>
            <span className="clamp-2 mt-0.5 block text-[12px] leading-[1.3] text-ink-2">{ms.home.mallBannerSub}</span>
          </span>
          <ChevronRight size={18} strokeWidth={2} className="shrink-0 text-ink-3" />
        </button>

        {/* Narx tekshirilgan */}
        <section className="mt-6">
          <SectionTitle sub={ms.home.verifiedSub} action={uz.home.seeAll} onAction={() => nav('/catalog?verified=1')}>{ms.home.verified}</SectionTitle>
          {loading ? <CarouselSkeleton /> : verified.length === 0 ? (
            <EmptyState compact icon="shield-check" tone="green" title={ms.home.noFeed} />
          ) : (
            <Carousel>{verified.map((l) => <ListingCard key={l.id} listing={l} variant="carousel" />)}</Carousel>
          )}
        </section>

        {/* Narxi tushganlar */}
        {(loading || drops.length > 0) && (
          <section className="mt-6">
            <SectionTitle sub={ms.home.dropsSub} action={uz.home.seeAll} onAction={() => nav('/catalog?drops=1')}>{uz.home.priceDrops}</SectionTitle>
            {loading ? <CarouselSkeleton /> : <Carousel>{drops.map((l) => <ListingCard key={l.id} listing={l} variant="carousel" />)}</Carousel>}
          </section>
        )}

        {/* Sharabara Mall */}
        <section className="mt-6">
          <SectionTitle sub={ms.home.mallSub} action={uz.home.seeAll} onAction={() => nav('/mall')}>{uz.mall.title}</SectionTitle>
          {loading ? <CarouselSkeleton /> : <Carousel>{mall.map((p) => <ProductCard key={p.id} product={p} variant="carousel" />)}</Carousel>}
        </section>

        {/* Yangi e’lonlar */}
        <section className="mt-6">
          <SectionTitle action={uz.home.seeAll} onAction={() => nav('/catalog')}>{ms.home.fresh}</SectionTitle>
          {loading ? <CardGridSkeleton n={4} /> : (
            <div className="grid grid-cols-2 gap-3">{fresh.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
          )}
          <div className="mt-5 flex justify-center">
            <Button variant="secondary" onClick={() => nav('/catalog')}>{ms.common.showMore}</Button>
          </div>
        </section>
        <div className={cn('mt-6 text-center text-[11px] text-ink-3')}><Badge tone="outline" size="sm">{uz.app.demo}</Badge></div>
      </PullToRefresh>

      {/* Viloyat tanlash */}
      <BottomSheet open={pick} onOpenChange={setPick} container={container} snap="auto" title={ms.home.pickRegion}>
        <ul className="m-0 -mx-1 list-none p-0 pb-2">
          {[{ id: null as RegionId | null, name: ms.home.allRegions }, ...regions.map((r) => ({ id: r.id as RegionId | null, name: r.name }))].map((r) => {
            const sel = region === r.id
            const mine = r.id === me.regionId
            return (
              <li key={r.id ?? 'all'}>
                <button type="button" role="radio" aria-checked={sel} onClick={() => { setRegion(r.id); setPick(false) }} className={cn('flex min-h-[48px] w-full items-center gap-3 rounded-[12px] px-3 text-left text-[15px]', sel ? 'bg-blue-soft font-semibold text-blue' : 'text-ink active:bg-paper-2')}>
                  <MapPin size={16} strokeWidth={1.9} className={sel ? 'text-blue' : 'text-ink-3'} />
                  <span className="min-w-0 flex-1">{r.name}</span>
                  {mine && <Badge tone="gold" size="sm">{ms.home.yourRegion}</Badge>}
                  {sel && <Check size={18} strokeWidth={2.4} />}
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>
    </div>
  )
}
