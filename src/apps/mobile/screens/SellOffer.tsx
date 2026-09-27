import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { uz, t } from '@/i18n/uz'
import { AnimatedMoney, Badge, Button, ConfirmDialog, ErrorState, Ledger, LedgerRow, Money, Progress, SealBurst, toast, usePhoneContainer } from '@/design'
import { GoldCoin, NavyCard } from '../components/Ui'
import { ms } from '../strings'
import { Screen } from '../components/Screen'

export default function SellOffer() {
  const { id = '' } = useParams<{ id: string }>()
  const nav = useAppNavigate()
  const container = usePhoneContainer()
  const listing = useStore((s) => s.data.listings.find((l) => l.id === id))
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [burst, setBurst] = useState(false)
  if (!listing) return <Screen back backTo="/sell/my" title={uz.sell.offer.title}><ErrorState title={ms.listing.notFound} onRetry={() => nav('/sell/my')} retryLabel={uz.sell.myListings} /></Screen>
  const l = listing
  const offer = l.offer
  const s = l.suggestion
  const accept = async () => {
    setBusy('accept')
    try { await api.listings.acceptOffer(l.id); setBurst(true) } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error); setBusy(null) }
  }
  const decline = async () => {
    setBusy('decline')
    try { await api.listings.declineOffer(l.id); setConfirm(false); toast.info(uz.sell.offer.declined, { duration: 6000 }); nav('/sell/my') } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error) } finally { setBusy(null) }
  }
  const isOffer = l.status === 'offer_sent' && !!offer

  return (
    <Screen back backTo="/sell/my" title={uz.sell.offer.title} eyebrow={`3/3 · ${uz.sell.step3}`}
      bottom={isOffer ? (
        <div className="flex flex-col gap-2">
          <Button data-testid={TID.mOfferAccept} variant="gold" size="lg" fullWidth onClick={accept} loading={busy === 'accept'}>{uz.sell.offer.accept}</Button>
          <Button data-testid={TID.mOfferDecline} variant="ghost" size="md" fullWidth onClick={() => setConfirm(true)} disabled={busy !== null} className="text-brick">{uz.sell.offer.decline}</Button>
        </div>
      ) : <Button variant="primary" size="lg" fullWidth onClick={() => nav(l.status === 'published' ? `/listing/${l.id}` : '/sell/my')}>{l.status === 'published' ? uz.listing.status.published : uz.sell.myListings}</Button>}>
      <Progress value={3} max={3} size="sm" className="mt-3 [&>div]:bg-gold-fill" />
      <div className="mt-4 flex flex-col gap-4">
        <div className="text-[13px] text-ink-2"><span className="clamp-1 font-medium text-ink">{l.title}</span></div>
        {!isOffer ? (
          <div className="rounded-card bg-card px-4 py-5 text-center shadow-soft">
            <Badge tone={l.status === 'published' ? 'green' : 'neutral'}>{uz.listing.status[l.status]}</Badge>
            <p className="m-0 mt-2 text-[14px] text-ink-2">{l.status === 'declined_by_seller' ? uz.sell.offer.declined : ms.sell.offerStatusOther}</p>
            <div className="mt-2"><Money tiyin={l.priceTiyin} size="xl" softCurrency /></div>
          </div>
        ) : (
          <>
            <NavyCard padding="lg" className="flex flex-col items-center text-center">
              <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,180,0,.4) 0%, rgba(245,180,0,0) 70%)' }} aria-hidden="true" />
              <GoldCoin size={52} className="relative" />
              <div className="relative mt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-white/60">{ms.sell.offerFrom}</div>
              <div className="relative mt-1 text-gold-fill"><AnimatedMoney tiyin={offer.offeredTiyin} size="display" softCurrency duration={1000} className="!text-[38px] text-gold-fill [&>span]:!text-white/60" /></div>
              <p className="relative m-0 mt-2 text-[13.5px] text-white/85">{uz.sell.offer.likely}</p>
              {offer.note && <p className="relative m-0 mt-2 text-[12px] italic text-white/60">«{offer.note}»</p>}
            </NavyCard>
            <Ledger inset title={ms.sell.market} className="!border-0 shadow-soft">
              {s?.breakdown.map((r, i) => <LedgerRow key={i} label={r.label} value={<Money tiyin={r.amountTiyin} size="sm" sign={r.kind === 'adjust'} />} emphasis={r.kind === 'total'} tone={r.kind === 'adjust' ? (r.amountTiyin < 0 ? 'brick' : 'green') : 'default'} />)}
              <LedgerRow label={uz.sell.offer.yourAsk} value={<Money tiyin={l.askingTiyin} size="sm" strike={l.askingTiyin !== offer.offeredTiyin} />} tone="muted" />
              {s && <LedgerRow label={t(ms.sell.comparables, { n: s.comparables.length })} value={`${ms.sell.confidence} ${Math.round(s.confidence * 100)}%`} tone="muted" />}
            </Ledger>
            <Ledger inset className="!border-0 shadow-soft">
              <LedgerRow label={uz.sell.offer.fee} value={<Money tiyin={-offer.feeTiyin} size="sm" />} tone="brick" />
              <LedgerRow label={uz.sell.offer.youGet} value={<Money tiyin={offer.sellerGetsTiyin} size="md" />} emphasis tone="green" />
            </Ledger>
          </>
        )}
      </div>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} container={container} tone="destructive" title={ms.sell.confirmDecline} description={ms.sell.confirmDeclineDesc} confirmLabel={uz.sell.offer.decline} loading={busy === 'decline'} onConfirm={decline} />
      <SealBurst show={burst} label={ms.sell.offerAccepted} sub={uz.listing.priceVerified} icon="stamp" onDone={() => { setBurst(false); nav(`/listing/${l.id}`, { replace: true }) }} />
    </Screen>
  )
}
