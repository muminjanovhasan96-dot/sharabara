import { useMemo, useState } from 'react'
import { ArrowUp, BadgePercent, Eye, Heart, MessageCircle, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useStore, useNow } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { uz, t } from '@/i18n/uz'
import { Badge, BottomSheet, Button, ConfirmDialog, ErrorState, Field, Money, MoneyInput, ProductImage, Sparkline, Tabs, TabsList, TabsTrigger, toast, usePhoneContainer } from '@/design'
import { EmptyState } from '../components/Ui'
import type { BadgeTone } from '@/design'
import type { BoostPackage, Listing, ListingStatus } from '@/domain/types'
import { ms } from '../strings'
import { timeAgo, useList, useMeId, useScreenLoad } from '../lib'
import { Screen } from '../components/Screen'
import { RowsSkeleton } from '../components/Cards'
import { GatewayModal } from '../components/GatewayModal'

const GROUP: Record<string, ListingStatus[]> = {
  active: ['published', 'reserved'],
  review: ['submitted', 'ai_checked', 'in_review', 'accepted'],
  offers: ['offer_sent'],
  sold: ['sold'],
  other: ['draft', 'returned_for_edit', 'rejected_by_admin', 'declined_by_seller', 'expired'],
}
const TONE: Partial<Record<ListingStatus, BadgeTone>> = { published: 'green', reserved: 'blue', offer_sent: 'gold', sold: 'ink', in_review: 'neutral', submitted: 'neutral', ai_checked: 'neutral', accepted: 'green', returned_for_edit: 'brick', rejected_by_admin: 'brick', declined_by_seller: 'neutral', expired: 'neutral', draft: 'outline' }

export default function MyListings() {
  const nav = useAppNavigate()
  const meId = useMeId()
  const now = useNow()
  const container = usePhoneContainer()
  const { loading, error, reload } = useScreenLoad([meId])
  const all = useList((s) => s.data.listings.filter((l) => l.sellerId === meId && !l.historical && l.status !== 'removed').slice().sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt)))
  const packages = useStore((s) => s.data.boostPackages)
  const [tab, setTab] = useState('all')
  const shown = useMemo(() => (tab === 'all' ? all : all.filter((l) => GROUP[tab]?.includes(l.status))), [all, tab])
  const count = (k: string) => (k === 'all' ? all.length : all.filter((l) => GROUP[k].includes(l.status)).length)

  const [boostFor, setBoostFor] = useState<Listing | null>(null)
  const [pkg, setPkg] = useState<BoostPackage | null>(null)
  const [gateway, setGateway] = useState(false)
  const [priceFor, setPriceFor] = useState<Listing | null>(null)
  const [price, setPrice] = useState<number | null>(null)
  const [removeFor, setRemoveFor] = useState<Listing | null>(null)
  const [busy, setBusy] = useState(false)

  const boost = async () => { if (!boostFor || !pkg) return; await api.listings.boost(boostFor.id, pkg.id); setGateway(false); setBoostFor(null); toast.gold(ms.sell.my.boosted) }
  const changePrice = async () => {
    if (!priceFor || !price) return
    setBusy(true)
    try { await api.listings.changePrice(priceFor.id, price); toast.success(ms.sell.my.priceChanged); setPriceFor(null) } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!removeFor) return
    setBusy(true)
    try { await api.listings.remove(removeFor.id); toast(ms.sell.my.removed); setRemoveFor(null) } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error) } finally { setBusy(false) }
  }

  return (
    <Screen back backTo="/sell" title={uz.sell.myListings} withTabBar right={<Button variant="ghost" size="sm" onClick={() => nav('/sell/new')}>{ms.sell.start}</Button>}>
      <Tabs value={tab} onValueChange={setTab} size="sm">
        <TabsList className="-mx-4 mt-1 px-4">
          {(['all', 'active', 'review', 'offers', 'sold', 'other'] as const).map((k) => <TabsTrigger key={k} value={k} count={count(k)}>{ms.sell.my[k]}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div className="pt-3">
        {error ? <ErrorState onRetry={reload} /> : loading ? <RowsSkeleton n={3} /> : shown.length === 0 ? (
          <EmptyState icon="tag" title={ms.sell.my.empty} hint={ms.sell.my.emptyHint} action={<Button variant="gold" onClick={() => nav('/sell/new')}>{ms.sell.start}</Button>} />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {shown.map((l) => {
              const boosted = l.boosted && l.boosted.until > now
              const canEdit = ['published', 'reserved'].includes(l.status)
              const reason = l.rejectReason ?? l.editRequestReason
              return (
                <li key={l.id} className="rounded-card bg-card shadow-soft">
                  <button type="button" onClick={() => nav(l.status === 'offer_sent' ? `/sell/offer/${l.id}` : ['submitted', 'ai_checked', 'in_review'].includes(l.status) ? `/sell/ai/${l.id}` : `/listing/${l.id}`)} className="flex w-full items-start gap-3 p-3 text-left">
                    <div className="w-[72px] shrink-0"><ProductImage id={l.images[0] ?? 'ill-phone-1'} sold={l.status === 'sold'} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5"><Badge tone={TONE[l.status] ?? 'neutral'} size="sm" dot>{uz.listing.status[l.status]}</Badge>{boosted && <Badge tone="gold" size="sm" Icon={ArrowUp}>{uz.sell.boosted}</Badge>}</div>
                      <div className="clamp-1 mt-1 text-[14px] font-medium">{l.title}</div>
                      <div className="mt-0.5 flex items-baseline gap-2"><Money tiyin={l.priceTiyin} size="md" className="font-bold" />{l.previousPriceTiyin && l.previousPriceTiyin > l.priceTiyin && <Money tiyin={l.previousPriceTiyin} size="xs" strike />}<span className="text-[11px] text-ink-3">{timeAgo(l.submittedAt ?? l.createdAt, now)}</span></div>
                      <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-ink-3">
                        <span className="tnum inline-flex items-center gap-1"><Eye size={12} strokeWidth={1.75} />{l.stats.views}</span>
                        <span className="tnum inline-flex items-center gap-1"><Heart size={12} strokeWidth={1.75} />{l.stats.saves}</span>
                        <span className="tnum inline-flex items-center gap-1"><MessageCircle size={12} strokeWidth={1.75} />{l.stats.chats}</span>
                        <span className="ml-auto inline-flex items-center gap-1"><Sparkline values={l.stats.viewsByDay.slice(-7)} width={56} height={16} /><span>{ms.sell.my.views7}</span></span>
                      </div>
                      {reason && <div className="mt-1.5 rounded-[8px] bg-brick-soft px-2 py-1 text-[12px] font-medium text-brick">{ms.sell.my.reason}: {reason}</div>}
                    </div>
                  </button>
                  <div className={cn('flex flex-wrap gap-1 border-t border-line px-2 py-1.5')}>
                    {l.status === 'offer_sent' && <Button variant="gold" size="sm" onClick={() => nav(`/sell/offer/${l.id}`)} leading={<BadgePercent strokeWidth={1.75} />}>{ms.sell.my.offer}</Button>}
                    {canEdit && !boosted && <Button variant="secondary" size="sm" onClick={() => { setBoostFor(l); setPkg(packages[1] ?? packages[0] ?? null) }} leading={<ArrowUp strokeWidth={1.75} />}>{ms.sell.my.boost}</Button>}
                    {canEdit && <Button variant="ghost" size="sm" onClick={() => { setPriceFor(l); setPrice(l.priceTiyin) }} leading={<Pencil strokeWidth={1.75} />}>{ms.sell.my.changePrice}</Button>}
                    {['returned_for_edit', 'rejected_by_admin', 'declined_by_seller', 'expired', 'draft'].includes(l.status) && <Button variant="secondary" size="sm" onClick={() => nav(`/sell/new?id=${l.id}`)} leading={<RefreshCw strokeWidth={1.75} />}>{l.status === 'draft' ? ms.sell.my.continue : ms.sell.my.resubmit}</Button>}
                    {l.status !== 'sold' && l.status !== 'reserved' && <Button variant="ghost" size="sm" onClick={() => setRemoveFor(l)} className="ml-auto text-ink-3" leading={<Trash2 strokeWidth={1.75} />}>{ms.sell.my.remove}</Button>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <BottomSheet open={!!boostFor && !gateway} onOpenChange={(o) => { if (!o) setBoostFor(null) }} container={container} snap="auto" title={ms.sell.my.boostTitle} eyebrow={boostFor?.title}
        footer={<Button variant="gold" fullWidth disabled={!pkg} onClick={() => setGateway(true)}>{uz.checkout.payConfirm}{pkg ? ' · ' : ''}{pkg && <Money tiyin={pkg.priceTiyin} size="sm" bare />}</Button>}>
        <p className="m-0 mb-3 text-[13px] text-ink-2">{ms.sell.my.boostSub}</p>
        <div className="flex flex-col gap-2">
          {packages.map((p) => {
            const sel = pkg?.id === p.id
            return (
              <button key={p.id} type="button" role="radio" aria-checked={sel} onClick={() => setPkg(p)} className={cn('flex items-center gap-3 rounded-card border-[1.5px] bg-card px-4 py-3 text-left shadow-soft', sel ? 'border-blue' : 'border-transparent')}>
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[15px] font-semibold">{p.name}<Badge tone="outline" size="sm">{p.days} kun</Badge></div><div className="text-[12.5px] text-ink-3">{p.description}</div></div>
                <Money tiyin={p.priceTiyin} size="md" />
              </button>
            )
          })}
        </div>
      </BottomSheet>
      {boostFor && pkg && <GatewayModal open={gateway} onOpenChange={(o) => { setGateway(o); if (!o) setBoostFor(null) }} amountTiyin={pkg.priceTiyin} method="payme" onPay={boost} title={`${ms.sell.my.boostTitle} · ${pkg.name}`} />}

      <BottomSheet open={!!priceFor} onOpenChange={(o) => { if (!o) setPriceFor(null) }} container={container} snap="auto" title={ms.sell.my.changePrice} eyebrow={priceFor?.title}
        footer={<Button variant="gold" fullWidth onClick={changePrice} loading={busy} disabled={!price}>{uz.app.save}</Button>}>
        <Field label={ms.sell.my.priceTitle} hint={priceFor ? t(uz.listing.cheaperThanMarket, { pct: '' }).length > 0 ? `${ms.listing.priceNow}: ${Math.trunc(priceFor.priceTiyin / 100).toLocaleString('ru-RU')} so’m` : undefined : undefined}>
          <MoneyInput valueTiyin={price} onChangeTiyin={setPrice} size="lg" autoFocus />
        </Field>
      </BottomSheet>

      <ConfirmDialog open={!!removeFor} onOpenChange={(o) => { if (!o) setRemoveFor(null) }} container={container} tone="destructive" title={ms.sell.my.removeTitle} description={ms.sell.my.removeDesc} confirmLabel={ms.sell.my.remove} loading={busy} onConfirm={remove} />
    </Screen>
  )
}
