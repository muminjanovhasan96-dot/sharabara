import { type HTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Heart, Star, Store } from 'lucide-react'
import { cn, SPRING, haptic } from '@/lib/utils'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { uz } from '@/i18n/uz'
import { api } from '@/api'
import { useStore, useNow } from '@/store'
import { Money, PriceVerified, ProductImage, Skeleton } from '@/design'
import type { Listing, Product } from '@/domain/types'
import { ms } from '../strings'
import { regionName, timeAgo, useRegions } from '../lib'
import { TileBadge, dropPct } from './Ui'

/* ─── Heart ──────────────────────────────────────────────────────────── */
export function HeartButton({ id, source, size = 'sm', className }: { id: string; source: 'listing' | 'product'; size?: 'sm' | 'md'; className?: string }) {
  const saved = useStore((s) => (source === 'listing' ? s.ui.savedListingIds : s.ui.savedProductIds).includes(id))
  const reduce = useReducedMotion()
  const onClick = (e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); haptic(10); void api.listings.toggleSave(id, source) }
  return (
    <motion.button
      type="button"
      aria-pressed={saved}
      aria-label={uz.listing.save}
      onClick={onClick}
      whileTap={reduce ? undefined : { scale: 0.88 }}
      transition={SPRING}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-white text-ink-2 shadow-[0_1px_3px_rgba(15,31,58,.18)]',
        size === 'sm' ? 'h-8 w-8' : 'h-11 w-11',
        saved && 'text-brick',
        className,
      )}
    >
      <Heart size={size === 'sm' ? 16 : 20} strokeWidth={1.9} fill={saved ? 'currentColor' : 'none'} />
    </motion.button>
  )
}

/* ─── Stars ──────────────────────────────────────────────────────────── */
export function Stars({ value, size = 13, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-gold-fill', className)} aria-label={`${value} ${ms.common.star}`}>
      <Star size={size} strokeWidth={1.75} fill="currentColor" />
      <span className="tnum text-[12.5px] font-semibold text-ink">{value.toFixed(1).replace('.', ',')}</span>
    </span>
  )
}

/* ─── Price block (19px navy + small so’m + struck old) ──────────────── */
function Price({ tiyin, prev, size = 'card' }: { tiyin: number; prev?: number; size?: 'card' | 'list' }) {
  return (
    <div className="flex flex-col items-start">
      <Money tiyin={tiyin} size="lg" softCurrency className={cn('font-extrabold leading-[1.15] tracking-[-0.02em] text-ink [&>span]:text-[11px] [&>span]:font-medium', size === 'card' ? 'text-[19px]' : 'text-[18px]')} />
      {prev !== undefined && prev > tiyin && <Money tiyin={prev} size="xs" strike className="leading-[1.2] decoration-ink-3/70" />}
    </div>
  )
}

const CARD = 'cursor-pointer rounded-card bg-card p-2 shadow-soft'

/* ─── ListingCard ────────────────────────────────────────────────────── */
export interface ListingCardProps {
  listing: Listing
  variant?: 'grid' | 'list' | 'carousel'
  reason?: string
  className?: string
}

export function ListingCard({ listing: l, variant = 'grid', reason, className }: ListingCardProps) {
  const nav = useAppNavigate()
  const regions = useRegions()
  const now = useNow()
  const reduce = useReducedMotion()
  const sold = l.status === 'sold'
  const drop = l.previousPriceTiyin !== undefined && l.previousPriceTiyin > l.priceTiyin
  const open = () => {
    void api.listings.trackEvent({ kind: 'view', itemId: l.id, source: 'listing', categoryId: l.categoryId, priceTiyin: l.priceTiyin, regionId: l.regionId, model: l.specs?.model })
    nav(`/listing/${l.id}`)
  }
  const meta = `${regionName(regions, l.regionId)} · ${timeAgo(l.publishedAt ?? l.createdAt, now)}`
  // plitka ustida: chegirma + tekshirilgan (ikkalasi ham sig’adi); sotilganda tekshirilgan pastda kichik chip bo’lib qoladi
  const tile = !sold && (
    <span className="flex flex-col items-start gap-1">
      {drop && <TileBadge tone="brick">{dropPct(l.previousPriceTiyin!, l.priceTiyin)}</TileBadge>}
      {l.priceVerified && <TileBadge tone="green">{uz.listing.priceVerified}</TileBadge>}
      {l.boosted && <TileBadge tone="gold">{uz.sell.boosted}</TileBadge>}
    </span>
  )
  const chipBelow = l.priceVerified && sold

  if (variant === 'list') {
    return (
      <motion.article
        data-testid={TID.mListingCard} data-id={l.id}
        role="button" tabIndex={0}
        onClick={open} onKeyDown={(e) => { if (e.key === 'Enter') open() }}
        whileTap={reduce ? undefined : { scale: 0.985 }} transition={SPRING}
        className={cn(CARD, 'flex gap-3 p-2.5', className)}
      >
        <ProductImage id={l.images[0] ?? 'ill-phone-1'} sold={sold} className="w-[108px] shrink-0" fill={0.7} badge={tile} />
        <div className="flex min-w-0 flex-1 flex-col">
          {reason && <div className="clamp-1 text-[11px] font-semibold text-[#5470a8]">{reason}</div>}
          <Price tiyin={l.priceTiyin} prev={drop ? l.previousPriceTiyin : undefined} size="list" />
          <div className="clamp-2 mt-0.5 text-[14px] leading-[1.25] text-ink">{l.title}</div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <span className="clamp-1 text-[12px] text-ink-3">{meta}</span>
            {chipBelow && <PriceVerified size="sm" />}
          </div>
        </div>
        <HeartButton id={l.id} source="listing" className="self-start" />
      </motion.article>
    )
  }
  return (
    <motion.article
      data-testid={TID.mListingCard} data-id={l.id}
      role="button" tabIndex={0}
      onClick={open} onKeyDown={(e) => { if (e.key === 'Enter') open() }}
      whileTap={reduce ? undefined : { scale: 0.97 }} transition={SPRING}
      className={cn(CARD, 'flex flex-col', variant === 'carousel' && 'w-[164px] shrink-0 snap-start', className)}
    >
      <ProductImage
        id={l.images[0] ?? 'ill-phone-1'}
        sold={sold}
        badge={tile}
        corner={<HeartButton id={l.id} source="listing" />}
      />
      <div className="flex flex-1 flex-col px-1 pb-1 pt-2">
        {reason && <div className="clamp-1 mb-0.5 text-[11px] font-semibold text-[#5470a8]">{reason}</div>}
        <Price tiyin={l.priceTiyin} prev={drop ? l.previousPriceTiyin : undefined} />
        <div className="clamp-2 mt-1 min-h-[2.5em] text-[14px] leading-[1.25] text-ink">{l.title}</div>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="clamp-1 text-[12px] text-ink-3">{meta}</span>
        </div>
        {chipBelow && <PriceVerified size="sm" className="mt-1.5 self-start" />}
      </div>
    </motion.article>
  )
}

/* ─── ProductCard (Mall) ─────────────────────────────────────────────── */
export function ProductCard({ product: p, variant = 'grid', reason, className }: { product: Product; variant?: 'grid' | 'list' | 'carousel'; reason?: string; className?: string }) {
  const nav = useAppNavigate()
  const reduce = useReducedMotion()
  const company = useStore((s) => s.data.companies.find((c) => c.id === p.companyId))
  const open = () => {
    void api.listings.trackEvent({ kind: 'view', itemId: p.id, source: 'product', categoryId: p.categoryId, priceTiyin: p.priceTiyin })
    nav(`/product/${p.id}`)
  }
  const drop = p.previousPriceTiyin !== undefined && p.previousPriceTiyin > p.priceTiyin
  const out = p.stock <= 0
  const list = variant === 'list'
  const tile = (
    <span className="flex flex-col items-start gap-1">
      <TileBadge tone="blue">{uz.mall.official}</TileBadge>
      {drop && <TileBadge tone="brick">{dropPct(p.previousPriceTiyin!, p.priceTiyin)}</TileBadge>}
      {!drop && p.promo && <TileBadge tone="gold">{p.promo.label}</TileBadge>}
    </span>
  )
  return (
    <motion.article
      data-testid="m-product-card" data-id={p.id}
      role="button" tabIndex={0}
      onClick={open} onKeyDown={(e) => { if (e.key === 'Enter') open() }}
      whileTap={reduce ? undefined : { scale: 0.97 }} transition={SPRING}
      className={cn(CARD, list ? 'flex gap-3 p-2.5' : 'flex flex-col', variant === 'carousel' && 'w-[164px] shrink-0 snap-start', className)}
    >
      <ProductImage
        id={p.images[0] ?? 'ill-phone-1'}
        className={list ? 'w-[108px] shrink-0' : undefined}
        badge={tile}
        corner={list ? undefined : <HeartButton id={p.id} source="product" />}
      >
        {out && <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-center text-[11px] font-semibold text-white">{ms.product.outOfStock}</span>}
      </ProductImage>
      <div className="flex min-w-0 flex-1 flex-col px-1 pb-1 pt-2">
        {reason && <div className="clamp-1 mb-0.5 text-[11px] font-semibold text-[#5470a8]">{reason}</div>}
        <Price tiyin={p.priceTiyin} prev={drop ? p.previousPriceTiyin : undefined} size={list ? 'list' : 'card'} />
        <div className={cn('clamp-2 mt-1 text-[14px] leading-[1.25] text-ink', !list && 'min-h-[2.5em]')}>{p.title}</div>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-3">
          <Store size={12} strokeWidth={1.75} className="shrink-0 text-blue" />
          <span className="clamp-1">{company?.name}</span>
        </div>
        {p.stock > 0 && p.stock <= 5 && <span className="mt-1 text-[11.5px] font-semibold text-brick">{uz.mall.stockLeft.replace('{n}', String(p.stock))}</span>}
      </div>
    </motion.article>
  )
}

/* ─── Skeletons ──────────────────────────────────────────────────────── */
/** Karta shakli: kvadrat plitka + narx + 2 qator sarlavha + meta. Balandlik haqiqiy kartaga teng (CLS ≈ 0). */
export function CardSkeleton({ className, minH }: { className?: string; minH?: number }) {
  return (
    <div className={cn('rounded-card bg-card p-2 shadow-soft', className)} style={minH ? { minHeight: minH } : undefined} aria-hidden="true">
      <Skeleton height="auto" className="aspect-square w-full rounded-[14px]" />
      <div className="mt-2 flex flex-col gap-1.5 px-1 pb-1">
        <Skeleton height={18} width="60%" />
        <Skeleton height={12} width="92%" className="mt-1" />
        <Skeleton height={12} width="70%" />
        <Skeleton height={10} width="45%" className="mt-0.5" />
      </div>
    </div>
  )
}
export const GRID_CARD_MIN_H = 273
export const CAROUSEL_CARD_H = 278

export function CardGridSkeleton({ n = 4, cols = 2 }: { n?: number; cols?: 1 | 2 }) {
  return (
    <div className={cn('grid gap-3', cols === 2 ? 'grid-cols-2' : 'grid-cols-1')} aria-busy="true">
      {Array.from({ length: n }, (_, i) => <CardSkeleton key={i} minH={cols === 2 ? GRID_CARD_MIN_H : undefined} />)}
    </div>
  )
}
export function CarouselSkeleton({ n = 3, h = CAROUSEL_CARD_H }: { n?: number; h?: number }) {
  return (
    <Carousel aria-busy="true">
      {Array.from({ length: n }, (_, i) => <CardSkeleton key={i} className="w-[164px] shrink-0" minH={h} />)}
    </Carousel>
  )
}
export function RowsSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-card bg-card p-3 shadow-soft">
          <Skeleton width={64} height={64} className="rounded-[12px]" />
          <div className="flex flex-1 flex-col gap-2 pt-1"><Skeleton width="70%" /><Skeleton width="45%" /><Skeleton width="30%" height={10} /></div>
        </div>
      ))}
    </div>
  )
}

export function Carousel({ children, className, ...rest }: { children: ReactNode; className?: string } & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'>) {
  return (
    <div className={cn('no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 pt-0.5', className)} {...rest}>
      {children}
    </div>
  )
}
