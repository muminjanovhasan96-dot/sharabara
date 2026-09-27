import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, ShoppingCart, Truck, Undo2 } from 'lucide-react'
import { useStore } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { uz, t } from '@/i18n/uz'
import { Badge, Button, ErrorState, Ledger, LedgerRow, Money, NumberInput, Seal, toast } from '@/design'
import { TileBadge, dropPct } from '../components/Ui'
import { ms } from '../strings'
import { useList, useScreenLoad } from '../lib'
import { Screen, SectionTitle } from '../components/Screen'
import { Carousel, HeartButton, ProductCard, Stars } from '../components/Cards'
import { Gallery } from './Listing'

export default function ProductScreen() {
  const { id = '' } = useParams<{ id: string }>()
  const nav = useAppNavigate()
  const { error, reload } = useScreenLoad([id])
  const p = useStore((s) => s.data.products.find((x) => x.id === id))
  const company = useStore((s) => s.data.companies.find((c) => c.id === p?.companyId))
  const category = useStore((s) => s.data.categories.find((c) => c.id === p?.categoryId))
  const inCart = useStore((s) => s.ui.cart.find((c) => c.refId === id))
  const others = useList((s) => s.data.products.filter((x) => x.companyId === p?.companyId && x.id !== id && x.stock > 0).slice(0, 8))
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)
  if (!p) return <Screen back title={ms.product.notFound}><ErrorState title={ms.product.notFound} onRetry={() => nav('/mall')} retryLabel={uz.mall.title} /></Screen>
  const out = p.stock <= 0
  const drop = p.previousPriceTiyin !== undefined && p.previousPriceTiyin > p.priceTiyin
  const add = async () => {
    if (inCart) { nav('/cart'); return }
    setBusy(true)
    try {
      await api.orders.addToCart({ source: 'product', refId: p.id, sellerKey: `c:${p.companyId}`, priceTiyin: p.priceTiyin, title: p.title, image: p.images[0] ?? 'ill-phone-1' }, qty)
      toast.success(ms.listing.added, { action: { label: ms.listing.inCartGo, onClick: () => nav('/cart') } })
    } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error) } finally { setBusy(false) }
  }
  return (
    <Screen
      back backTo="/mall" title={category?.name} eyebrow={uz.mall.title}
      right={<HeartButton id={p.id} source="product" size="md" className="border-transparent shadow-none" />}
      bottom={
        <div className="flex items-center gap-3">
          {!inCart && <NumberInput value={qty} onChange={setQty} min={1} max={Math.max(1, p.stock)} aria-label={ms.product.qty} />}
          <Button data-testid={TID.mAddToCart} variant={inCart ? 'secondary' : 'gold'} size="lg" onClick={add} loading={busy} disabled={out} leading={<ShoppingCart strokeWidth={1.75} />} className="flex-1">{inCart ? uz.listing.inCart : uz.listing.addToCart}</Button>
        </div>
      }
    >
      {error && <ErrorState compact onRetry={reload} className="my-3" />}
      <Gallery images={p.images} title={p.title} />
      <div className="mt-3 flex flex-col gap-3">
        <div className="rounded-card bg-card p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-1.5">
            <TileBadge tone="blue">{uz.mall.official}</TileBadge>
            {p.promo && <TileBadge tone="gold">{p.promo.label}</TileBadge>}
            {p.check === 'passed' && <Badge tone="green" size="sm" Icon={ShieldCheck}>{uz.listing.priceVerified}</Badge>}
          </div>
          <h1 className="m-0 mt-1.5 font-display text-[19px] leading-snug tracking-[-0.01em]">{p.title}</h1>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5">
            <Money tiyin={p.priceTiyin} size="display" softCurrency className="!text-[32px] text-ink [&>span]:!text-[14px]" />
            {drop && <><Money tiyin={p.previousPriceTiyin!} size="md" strike /><TileBadge tone="brick">{dropPct(p.previousPriceTiyin!, p.priceTiyin)}</TileBadge></>}
          </div>
          <div className="mt-1.5 text-[13px]">
            {out ? <span className="font-semibold text-brick">{ms.product.outOfStock}</span>
              : p.stock <= 5 ? <Badge tone="brick">{t(uz.mall.stockLeft, { n: p.stock })}</Badge>
              : <span className="text-green">{ms.product.inStock} · {p.stock} {ms.common.pcs}</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[{ I: ShieldCheck, l: ms.product.warranty, v: t(uz.mall.warranty, { n: p.warrantyMonths }) }, { I: Undo2, l: ms.product.returns, v: t(uz.mall.returnDays, { n: p.returnDays }) }, { I: Truck, l: ms.product.shipping, v: t(uz.mall.shipSpeed, { n: company?.shipSpeedDays ?? 2 }) }].map((x) => (
            <div key={x.l} className="flex flex-col items-center gap-1 rounded-card bg-card p-2.5 text-center shadow-soft">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-green-soft text-green"><x.I size={16} strokeWidth={1.9} /></span>
              <span className="eyebrow !text-[9.5px]">{x.l}</span>
              <span className="text-[12px] leading-tight text-ink">{x.v}</span>
            </div>
          ))}
        </div>

        <Ledger inset title={ms.listing.details} className="!border-0 shadow-soft">
          {Object.entries(p.attributes).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => {
            const def = category?.attributes.find((a) => a.key === k)
            return <LedgerRow key={k} label={def?.label ?? k} value={`${v}${def?.unit ?? ''}`} />
          })}
          <LedgerRow label="SKU" value={p.sku} />
        </Ledger>

        <section className="rounded-card bg-card px-4 py-3 shadow-soft"><div className="mb-1 text-[13px] font-semibold text-ink">{ms.listing.description}</div><p className="m-0 text-[14.5px] leading-relaxed text-ink-2">{p.description}</p></section>

        {company && (
          <button type="button" onClick={() => nav(`/store/${company.id}`)} className="flex items-center gap-3 rounded-card bg-card p-3 text-left shadow-soft active:bg-paper-2">
            <Seal icon={company.sealIcon} size={56} variant="ink" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-ink-3">{uz.mall.store}</div>
              <div className="clamp-1 text-[15px] font-semibold">{company.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-3"><Stars value={company.rating} /><span>{t(uz.mall.shipSpeed, { n: company.shipSpeedDays })}</span></div>
            </div>
            <span className="text-[13px] font-semibold text-blue">{ms.product.toStore}</span>
          </button>
        )}

        {others.length > 0 && (
          <section className="mt-2">
            <SectionTitle>{ms.product.fromStore} {company?.name}</SectionTitle>
            <Carousel>{others.map((x) => <ProductCard key={x.id} product={x} variant="carousel" />)}</Carousel>
          </section>
        )}
      </div>
    </Screen>
  )
}
