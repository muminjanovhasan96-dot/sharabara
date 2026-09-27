import { useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronRight, MapPin, MessageCircle, ShoppingCart, ZoomIn } from 'lucide-react'
import { useStore, useNow } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { cn } from '@/lib/utils'
import { uz, t } from '@/i18n/uz'
import { CONDITION_K } from '@/domain/pricing'
import { Avatar, Badge, BottomSheet, Button, ErrorState, Illustration, Ledger, LedgerRow, Modal, Money, PriceVerified, ProductImage, Skeleton, Stamp, toast, usePhoneContainer } from '@/design'
import type { Listing as L } from '@/domain/types'
import { ms } from '../strings'
import { monthsSince, regionName, timeAgo, useList, useMeId, useRegions, useScreenLoad, useViewLong } from '../lib'
import { Screen, SectionTitle } from '../components/Screen'
import { Carousel, HeartButton, ListingCard, Stars } from '../components/Cards'
import { TileBadge, dropPct } from '../components/Ui'

/* ─── Gallery ────────────────────────────────────────────────────────── */
export function Gallery({ images, sold, title }: { images: string[]; sold?: boolean; title?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState<string | null>(null)
  const container = usePhoneContainer()
  const onScroll = () => { const el = ref.current; if (!el) return; setI(Math.round(el.scrollLeft / el.clientWidth)) }
  const imgs = images.length ? images : ['ill-phone-1']
  return (
    <div className="relative -mx-4">
      <div ref={ref} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" aria-label={ms.listing.gallery}>
        {imgs.map((id, k) => (
          <button key={`${id}-${k}`} type="button" onClick={() => setZoom(id)} aria-label={ms.listing.zoom} className="w-full shrink-0 snap-center">
            <ProductImage id={id} aspect="4/3" rounded={false} fill={0.62} sold={sold && k === 0} title={title} />
          </button>
        ))}
      </div>
      {imgs.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {imgs.map((_, k) => <span key={k} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-4 bg-white' : 'w-1.5 bg-white/50')} />)}
        </div>
      )}
      <span className="pointer-events-none absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-2 shadow-[0_1px_3px_rgba(15,31,58,.18)]"><ZoomIn size={16} strokeWidth={1.75} /></span>
      <Modal open={!!zoom} onOpenChange={() => setZoom(null)} container={container} size="md" title={ms.listing.zoom}>
        <div className="rounded-card bg-paper-2 p-6 text-ink">{zoom && <Illustration id={zoom} className="mx-auto max-h-[60vh]" />}</div>
      </Modal>
    </div>
  )
}

/* ─── Why-fair sheet ─────────────────────────────────────────────────── */
export function WhyFairSheet({ listing, open, onOpenChange }: { listing: L; open: boolean; onOpenChange: (o: boolean) => void }) {
  const container = usePhoneContainer()
  const s = listing.suggestion
  const ref = s ? Math.round(s.marketMedianTiyin * CONDITION_K[listing.condition]) : 0
  const pct = s && ref > 0 ? Math.max(0, Math.round(((ref - listing.priceTiyin) / ref) * 100)) : 0
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} container={container} snap="auto" eyebrow={ms.listing.whySub} title={uz.listing.whyFair}>
      {s ? (
        <div className="flex flex-col gap-3 pb-2">
          <div className="flex items-center justify-between rounded-card bg-green-soft px-4 py-3">
            <div><div className="eyebrow !text-[10px]">{uz.listing.marketAvg}</div><Money tiyin={s.marketMedianTiyin} size="lg" softCurrency /><div className="text-[11px] text-ink-3">{ms.listing.marketMedianNote}</div></div>
            <div className="text-right"><div className="eyebrow !text-[10px]">{ms.listing.priceNow}</div><Money tiyin={listing.priceTiyin} size="lg" softCurrency className="text-green" /><div className="text-[11px] font-semibold text-green">{t(ms.listing.cheaperPct, { pct: `${pct}%` })}</div></div>
          </div>
          <Ledger inset>
            {s.breakdown.length ? s.breakdown.map((r, i) => (
              <LedgerRow key={i} label={r.label} value={<Money tiyin={r.amountTiyin} size="sm" sign={r.kind === 'adjust'} />} emphasis={r.kind === 'total'} tone={r.kind === 'adjust' ? (r.amountTiyin < 0 ? 'brick' : 'green') : 'default'} />
            )) : <LedgerRow label={ms.listing.breakdownEmpty} value="" noDots />}
          </Ledger>
          <div className="flex items-center justify-between text-[12.5px] text-ink-2">
            <span>{t(uz.listing.similarCount, { n: s.comparables.length })}</span>
            <span className="tnum">{ms.sell.confidence}: {Math.round(s.confidence * 100)}%</span>
          </div>
          <p className="m-0 text-[12px] leading-snug text-ink-3">{ms.listing.fairNote}</p>
        </div>
      ) : (
        <p className="text-[14px] text-ink-2">{ms.listing.breakdownEmpty}</p>
      )}
    </BottomSheet>
  )
}

export default function ListingScreen() {
  const { id = '' } = useParams<{ id: string }>()
  const nav = useAppNavigate()
  const now = useNow()
  const meId = useMeId()
  const regions = useRegions()
  const { loading, error, reload } = useScreenLoad([id])
  const listing = useStore((s) => s.data.listings.find((l) => l.id === id))
  const seller = useStore((s) => s.data.users.find((u) => u.id === listing?.sellerId))
  const category = useStore((s) => s.data.categories.find((c) => c.id === listing?.categoryId))
  const inCart = useStore((s) => s.ui.cart.some((c) => c.refId === id))
  const similar = useList((s) => s.data.listings.filter((l) => l.id !== id && l.categoryId === listing?.categoryId && l.status === 'published' && !l.historical).slice(0, 8))
  const [why, setWhy] = useState(false)
  const [busy, setBusy] = useState<'cart' | 'chat' | null>(null)
  useViewLong(listing)

  const ledger = useMemo(() => {
    if (!listing) return []
    const rows: { label: string; value: string }[] = [{ label: uz.condition.label, value: uz.condition[listing.condition] }]
    const bat = listing.attributes.batareya
    if (bat !== undefined && bat !== '') rows.push({ label: ms.listing.battery, value: `${bat}%` })
    for (const [k, v] of Object.entries(listing.attributes)) {
      if (k === 'batareya' || v === '' || v === undefined) continue
      const def = category?.attributes.find((a) => a.key === k)
      rows.push({ label: def?.label ?? k, value: `${v}${def?.unit ?? ''}` })
    }
    if (listing.imei || listing.categoryId === 'telefonlar') rows.push({ label: ms.listing.imei, value: listing.specs?.imeiStatus === 'suspicious' ? uz.listing.imeiSuspicious : listing.specs?.imeiStatus === 'clean' || listing.imei ? uz.listing.imeiClean : '—' })
    rows.push({ label: uz.listing.location, value: [regionName(regions, listing.regionId), listing.district].filter(Boolean).join(', ') })
    rows.push({ label: uz.listing.delivery, value: uz.listing.deliveryBts })
    return rows
  }, [listing, category, regions])

  if (!listing && !loading) return <Screen back title={ms.listing.notFound}><ErrorState title={ms.listing.notFound} hint={ms.listing.notFoundHint} onRetry={() => nav('/catalog')} retryLabel={uz.tabs.catalog} /></Screen>
  if (!listing || (loading && !listing)) return <Screen back><div className="-mx-4"><Skeleton className="aspect-[4/3] w-full rounded-none" height="auto" /></div><div className="mt-4 flex flex-col gap-3"><Skeleton width="40%" height={28} /><Skeleton width="90%" /><Skeleton width="70%" /></div></Screen>

  const l = listing
  const sold = l.status === 'sold' || l.status === 'reserved' || l.status === 'removed' || l.status === 'expired'
  const isMine = l.sellerId === meId
  const drop = l.previousPriceTiyin !== undefined && l.previousPriceTiyin > l.priceTiyin
  const disabled = sold || isMine
  const pct = l.suggestion ? Math.max(0, Math.round(((Math.round(l.suggestion.marketMedianTiyin * CONDITION_K[l.condition]) - l.priceTiyin) / Math.round(l.suggestion.marketMedianTiyin * CONDITION_K[l.condition])) * 100)) : 0

  const addToCart = async () => {
    if (inCart) { nav('/cart'); return }
    setBusy('cart')
    try {
      await api.orders.addToCart({ source: 'listing', refId: l.id, sellerKey: `u:${l.sellerId}`, priceTiyin: l.priceTiyin, title: l.title, image: l.images[0] ?? 'ill-phone-1' })
      toast.success(ms.listing.added, { action: { label: ms.listing.inCartGo, onClick: () => nav('/cart') } })
    } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error) } finally { setBusy(null) }
  }
  const write = async () => {
    setBusy('chat')
    try { const th = await api.listings.openThread(l.id); nav(`/chat/${th.id}`) } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error) } finally { setBusy(null) }
  }

  return (
    <Screen
      back backTo="/catalog"
      title={category?.name}
      right={<HeartButton id={l.id} source="listing" size="md" className="border-transparent shadow-none" />}
      bottom={!isMine && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="lg" onClick={write} loading={busy === 'chat'} disabled={sold} leading={<MessageCircle strokeWidth={1.75} />} className="flex-1">{uz.listing.write}</Button>
          <Button data-testid={TID.mAddToCart} variant={inCart ? 'secondary' : 'gold'} size="lg" onClick={addToCart} loading={busy === 'cart'} disabled={disabled} leading={<ShoppingCart strokeWidth={1.75} />} className="flex-[1.4]">{inCart ? uz.listing.inCart : uz.listing.addToCart}</Button>
        </div>
      )}
    >
      {error && <ErrorState compact onRetry={reload} className="my-3" />}
      <Gallery images={l.images} sold={l.status === 'sold'} title={l.title} />
      <div className="mt-3 flex flex-col gap-3">
        <div className="rounded-card bg-card p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-ink-3">{category?.name}</span>
            {l.boosted && <Badge tone="gold" size="sm">{uz.sell.boosted}</Badge>}
            {l.status === 'reserved' && <Badge tone="blue" size="sm">{uz.listing.status.reserved}</Badge>}
            {l.status === 'sold' && <Stamp size="sm" />}
          </div>
          <h1 className="m-0 mt-1 font-display text-[19px] leading-snug tracking-[-0.01em]">{l.title}</h1>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <Money tiyin={l.priceTiyin} size="display" softCurrency className="!text-[32px] text-ink [&>span]:!text-[14px]" />
            {drop && <><Money tiyin={l.previousPriceTiyin!} size="md" strike /><TileBadge tone="brick">{dropPct(l.previousPriceTiyin!, l.priceTiyin)}</TileBadge></>}
          </div>
          {l.priceVerified && (
            <PriceVerified data-testid={TID.mPriceVerified} className="mt-2.5 !border-transparent !bg-green-soft font-semibold" suffix={pct > 0 ? <span className="!text-green">· {t(uz.listing.cheaperThanMarket, { pct: `${pct}%` })}</span> : undefined} onClick={() => setWhy(true)} />
          )}
          <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-ink-3"><MapPin size={13} strokeWidth={1.9} className="shrink-0" /><span className="clamp-1">{regionName(regions, l.regionId)}{l.district ? `, ${l.district}` : ''} · {timeAgo(l.publishedAt ?? l.createdAt, now)} · {t(ms.listing.stats, { v: l.stats.views, s: l.stats.saves })}</span></div>
        </div>

        {sold && <div className="rounded-card bg-brick-soft px-4 py-3 text-[13.5px] font-medium text-brick">{l.status === 'reserved' ? ms.listing.reservedNote : ms.listing.soldNote}</div>}

        <Ledger inset title={ms.listing.details} className="!border-0 shadow-soft">
          {ledger.map((r) => <LedgerRow key={r.label} label={r.label} value={r.value} tone={r.value === uz.listing.imeiSuspicious ? 'brick' : r.label === ms.listing.imei ? 'green' : 'default'} />)}
        </Ledger>

        <section className="rounded-card bg-card px-4 py-3 shadow-soft">
          <div className="mb-1 text-[13px] font-semibold text-ink">{ms.listing.description}</div>
          <p className="m-0 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">{l.description}</p>
        </section>

        {seller && (
          <button type="button" onClick={() => nav(`/seller/${seller.id}`)} className="flex items-center gap-3 rounded-card bg-card p-3 text-left shadow-soft active:bg-paper-2">
            <Avatar name={seller.name} seed={seller.id} size={56} fill="var(--blue-soft)" className="text-blue" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-ink-3">{uz.listing.seller}</div>
              <div className="flex items-center gap-2"><span className="clamp-1 text-[15px] font-semibold">{seller.name}</span>{seller.verifiedSeller && <Badge tone="green" size="sm">{ms.profile.verified}</Badge>}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-3">
                <Stars value={seller.rating} />
                <span>{t(uz.listing.soldCount, { n: seller.soldCount })}</span>
                <span>{t(uz.listing.memberFor, { n: monthsSince(seller.joinedAt, now) })}</span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={1.9} className="text-ink-3" />
          </button>
        )}

        {similar.length > 0 && (
          <section className="mt-2">
            <SectionTitle action={ms.common.seeAll} onAction={() => nav(`/catalog?cat=${l.categoryId}`)}>{uz.listing.similar}</SectionTitle>
            <Carousel>{similar.map((s) => <ListingCard key={s.id} listing={s} variant="carousel" />)}</Carousel>
          </section>
        )}
      </div>
      <WhyFairSheet listing={l} open={why} onOpenChange={setWhy} />
    </Screen>
  )
}

/** Sotuvchining e’lonlari */
export function SellerScreen() {
  const { userId = '' } = useParams<{ userId: string }>()
  const now = useNow()
  const seller = useStore((s) => s.data.users.find((u) => u.id === userId))
  const listings = useList((s) => s.data.listings.filter((l) => l.sellerId === userId && !l.historical && (l.status === 'published' || l.status === 'sold' || l.status === 'reserved')))
  if (!seller) return <Screen back title={ms.common.notFound}><ErrorState title={ms.common.notFound} /></Screen>
  return (
    <Screen back title={seller.name} eyebrow={uz.listing.seller}>
      <div className="mt-3 flex items-center gap-3 rounded-card bg-card p-3 shadow-soft">
        <Avatar name={seller.name} seed={seller.id} size={56} fill="var(--blue-soft)" className="text-blue" />
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="text-[16px] font-semibold">{seller.name}</span>{seller.verifiedSeller && <Badge tone="green" size="sm">{ms.profile.verified}</Badge>}</div>
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-[12.5px] text-ink-3"><Stars value={seller.rating} /><span>{t(uz.listing.soldCount, { n: seller.soldCount })}</span><span>{t(uz.listing.memberFor, { n: monthsSince(seller.joinedAt, now) })}</span></div>
        </div>
      </div>
      <SectionTitle className="mt-5" sub={`${listings.length}`}>{ms.listing.sellerListings}</SectionTitle>
      <div className="grid grid-cols-2 gap-3">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
    </Screen>
  )
}
