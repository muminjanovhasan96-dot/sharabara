import { useMemo, useState } from 'react'
import { Banknote, Check, Clock, CreditCard, LocateFixed, MapPin, Smartphone } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useStore, useNow } from '@/store'
import { api, DELIVERY_FEE } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { cn, SPRING } from '@/lib/utils'
import { uz, t } from '@/i18n/uz'
import { formatDemoTime } from '@/domain/clock'
import { AnimatedMoney, Badge, Button, Field, Input, Ledger, LedgerRow, Money, Progress, SealBurst, Segmented, ProductImage } from '@/design'
import { EmptyState, StepDot } from '../components/Ui'
import type { BtsBranch, DeliveryMethod, Order, PaymentMethod } from '@/domain/types'
import { ms } from '../strings'
import { distanceKm, useMe, useRegions } from '../lib'
import { Screen } from '../components/Screen'
import { lazy, Suspense } from 'react'
const BranchMap = lazy(() => import('../components/BranchMap').then((m) => ({ default: m.BranchMap })))
import { GatewayModal } from '../components/GatewayModal'

type Step = 1 | 2 | 3

export default function Checkout() {
  const nav = useAppNavigate()
  const me = useMe()
  const now = useNow()
  const regions = useRegions()
  const reduce = useReducedMotion()
  const cart = useStore((s) => s.ui.cart)
  const branches = useStore((s) => s.data.branches)
  const [step, setStep] = useState<Step>(1)
  const [method, setMethod] = useState<DeliveryMethod>('bts_branch')
  const [pay, setPay] = useState<PaymentMethod>('payme')
  const [gateway, setGateway] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [burst, setBurst] = useState(false)
  const [locating, setLocating] = useState(false)
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null)

  const myRegion = regions.find((r) => r.id === me.regionId) ?? regions[0]
  const origin = useMemo(() => user ?? { lat: myRegion.lat, lng: myRegion.lng }, [user, myRegion])
  const sorted = useMemo(() => {
    const isMarkaz = (b: BtsBranch) => /markaz/i.test(b.id)
    return branches.map((b) => ({ b, km: distanceKm(origin, b) }))
      .sort((x, y) => Number(x.b.regionId !== me.regionId) - Number(y.b.regionId !== me.regionId) || Number(!isMarkaz(x.b)) - Number(!isMarkaz(y.b)) || x.km - y.km)
  }, [branches, origin, me.regionId])
  const [branchId, setBranchId] = useState<string | null>(() => sorted[0]?.b.id ?? null)
  const [address, setAddress] = useState(() => (me.regionId === 'toshkent_sh' ? 'Toshkent, ' : `${myRegion.name}, `))

  const selected = branches.find((b) => b.id === branchId) ?? null
  const center: [number, number] = selected && method === 'bts_branch' ? [selected.lat, selected.lng] : [origin.lat, origin.lng]
  const itemsTiyin = cart.reduce((a, c) => a + c.priceTiyin * c.qty, 0)
  const total = itemsTiyin + DELIVERY_FEE[method]
  const groups = new Set(cart.map((c) => c.sellerKey)).size

  const locate = () => {
    setLocating(true)
    const fallback = () => { setUser({ lat: myRegion.lat, lng: myRegion.lng }); setLocating(false) }
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      let done = false
      const tm = setTimeout(() => { if (!done) { done = true; fallback() } }, 3000)
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (done) return; done = true; clearTimeout(tm); setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
        () => { if (done) return; done = true; clearTimeout(tm); fallback() },
        { timeout: 3000, maximumAge: 60_000 },
      )
    } else fallback()
  }

  const doPay = async () => {
    const o = await api.orders.checkout({ delivery: method, branchId: method === 'bts_branch' ? branchId ?? undefined : undefined, address: method === 'courier_tashkent' ? address : undefined, payment: pay })
    setOrder(o); setGateway(false); setStep(3); setBurst(true)
  }

  if (cart.length === 0 && !order) {
    return <Screen back backTo="/cart" title={ms.checkout.title}><EmptyState icon="shopping-cart" title={uz.cart.empty} hint={ms.checkout.emptyCart} action={<Button variant="secondary" onClick={() => nav('/catalog')}>{ms.cart.goCatalog}</Button>} /></Screen>
  }

  const canNext = method !== 'bts_branch' || !!branchId
  const stepLabel = [uz.checkout.step1, uz.checkout.step2, uz.checkout.step3][step - 1]

  return (
    <Screen
      back={step < 3} backTo="/cart"
      title={step === 3 ? uz.checkout.orderAccepted : ms.checkout.title}
      eyebrow={`${t(ms.checkout.stepOf, { i: step, n: 3 })} · ${stepLabel}`}
      header={step === 3 ? <header className="pt-safe h-2" /> : undefined}
      bottom={step === 1 ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0"><div className="eyebrow !text-[10px]">{ms.checkout.orderTotal}</div><Money tiyin={total} size="lg" softCurrency /></div>
          <Button variant="primary" size="lg" className="flex-1" disabled={!canNext} onClick={() => setStep(2)}>{uz.app.next} · {uz.checkout.step2}</Button>
        </div>
      ) : step === 2 ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0"><div className="eyebrow !text-[10px]">{uz.cart.total}</div><Money tiyin={total} size="lg" softCurrency /></div>
          <Button data-testid={gateway ? undefined : TID.mPayConfirm} variant="gold" size="lg" className="flex-1" onClick={() => setGateway(true)}>{uz.checkout.payConfirm}</Button>
        </div>
      ) : undefined}
    >
      {step < 3 && <Progress value={step} max={3} size="sm" tone="gold" className="mt-3 [&>div]:bg-gold-fill" label={stepLabel} />}

      {step === 1 && (
        <div className="flex flex-col gap-4 pt-4">
          <Segmented<DeliveryMethod> fullWidth size="md" value={method} onChange={setMethod} className="bg-card shadow-soft [&_[aria-checked=true]]:!text-white [&_[aria-checked=true]>span:first-child]:!bg-ink" options={[
            { value: 'bts_branch', label: uz.checkout.method.bts_branch }, { value: 'courier_tashkent', label: 'Kuryer' }, { value: 'pickup', label: 'O’zim' },
          ]} />
          {method === 'bts_branch' && (
            <>
              <Suspense fallback={<div className="skeleton h-[220px] rounded-card" />}><BranchMap regions={regions} branches={branches} selectedId={branchId} onSelect={setBranchId} center={center} zoom={selected ? 12 : 6} user={user} className="h-[220px] overflow-hidden rounded-card border border-line" /></Suspense>
              <div className="flex items-center justify-between gap-2">
                <Button variant="secondary" size="sm" onClick={locate} loading={locating} leading={<LocateFixed strokeWidth={1.75} />}>{locating ? ms.checkout.locating : uz.checkout.myLocation}</Button>
                <span className="text-[12px] text-ink-3">{user ? ms.checkout.located : myRegion.name}</span>
              </div>
              <div>
                <div className="eyebrow mb-1.5">{ms.checkout.branchesNear}</div>
                <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-card bg-card p-0 shadow-soft">
                  {sorted.slice(0, 12).map(({ b, km }, i) => {
                    const sel = b.id === branchId
                    return (
                      <li key={b.id}>
                        <button type="button" data-testid={TID.mBranch} data-id={b.id} aria-pressed={sel} onClick={() => setBranchId(b.id)} className={cn('flex w-full items-start gap-3 px-3 py-3 text-left', sel && 'bg-blue-soft/70')}>
                          <span className={cn('mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]', sel ? 'bg-blue text-white' : 'bg-paper-2 text-ink-2')}>{sel ? <Check size={16} strokeWidth={2.5} /> : <MapPin size={16} strokeWidth={1.75} />}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2"><span className="clamp-1 text-[14px] font-semibold">{b.name}</span>{i === 0 && <Badge tone="green" size="sm">{uz.checkout.nearest}</Badge>}</span>
                            <span className="block text-[12px] text-ink-3">{b.address}</span>
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-ink-3"><Clock size={11} strokeWidth={1.75} />{b.hours}</span>
                          </span>
                          <span className="tnum shrink-0 text-[12.5px] font-semibold text-ink-2">{t(uz.checkout.km, { n: km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km) })}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          )}
          {method === 'courier_tashkent' && (
            <>
              <Field label={ms.checkout.address} required><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={ms.checkout.addressPlaceholder} /></Field>
              <p className="m-0 text-[13px] text-ink-2">{ms.checkout.courierNote}</p>
            </>
          )}
          {method === 'pickup' && <p className="m-0 rounded-card bg-card px-4 py-3 text-[13.5px] text-ink-2 shadow-soft">{ms.checkout.pickupNote}</p>}
          <Ledger inset className="!border-0 shadow-soft">
            <LedgerRow label={ms.checkout.items} value={<Money tiyin={itemsTiyin} size="sm" />} sub={groups > 1 ? t(uz.cart.splitNote, { n: groups }) : undefined} />
            <LedgerRow label={uz.checkout.deliveryFee} value={<Money tiyin={DELIVERY_FEE[method]} size="sm" />} />
            <LedgerRow label={uz.cart.total} value={<Money tiyin={total} size="md" />} emphasis />
          </Ledger>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4 pt-4">
          <div className="text-[15px] font-semibold text-ink">{ms.checkout.payMethod}</div>
          <div className="flex flex-col gap-2">
            {([
              { v: 'payme' as PaymentMethod, label: uz.checkout.pay.payme, I: CreditCard, tid: TID.mPayPayme },
              { v: 'click' as PaymentMethod, label: uz.checkout.pay.click, I: Smartphone, tid: 'm-pay-click' },
              ...(me.cashOnDelivery ? [{ v: 'cash' as PaymentMethod, label: uz.checkout.pay.cash, I: Banknote, tid: 'm-pay-cash' }] : []),
            ]).map((o) => {
              const sel = pay === o.v
              return (
                <motion.button key={o.v} type="button" data-testid={o.tid} role="radio" aria-checked={sel} onClick={() => setPay(o.v)} whileTap={reduce ? undefined : { scale: 0.985 }} transition={SPRING}
                  className={cn('flex min-h-[60px] items-center gap-3 rounded-card border-[1.5px] bg-card px-4 text-left shadow-soft', sel ? 'border-blue' : 'border-transparent')}>
                  <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-[12px]', sel ? 'bg-blue text-white' : 'bg-blue-soft text-blue')}><o.I size={18} strokeWidth={1.9} /></span>
                  <span className="flex-1 text-[15px] font-semibold">{o.label}</span>
                  <span className={cn('inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-2', sel ? 'border-blue bg-blue text-white' : 'border-line-strong')}>{sel && <Check size={13} strokeWidth={3} />}</span>
                </motion.button>
              )
            })}
          </div>
          <div className="flex items-start gap-2 rounded-card bg-green-soft px-4 py-3 text-[13px] font-medium text-green"><Badge tone="green" size="sm">{ms.checkout.escrowShort}</Badge><span>{uz.checkout.escrowNote}</span></div>
          <Ledger inset title={ms.checkout.summary} className="!border-0 shadow-soft">
            {cart.map((c) => <LedgerRow key={c.key} label={<span className="clamp-1 max-w-[180px]">{c.title}{c.qty > 1 ? ` ×${c.qty}` : ''}</span>} value={<Money tiyin={c.priceTiyin * c.qty} size="sm" />} />)}
            <LedgerRow label={uz.checkout.deliveryFee} value={<Money tiyin={DELIVERY_FEE[method]} size="sm" />} sub={method === 'bts_branch' ? selected?.name : method === 'courier_tashkent' ? address : uz.checkout.method.pickup} />
            <LedgerRow label={uz.cart.total} value={<Money tiyin={total} size="md" />} emphasis />
          </Ledger>
          <GatewayModal open={gateway} onOpenChange={setGateway} amountTiyin={total} method={pay} onPay={doPay} confirmTestId={TID.mPayConfirm} />
        </div>
      )}

      {step === 3 && order && (
        <div data-testid={TID.mOrderAccepted} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col items-center rounded-card bg-card px-4 py-6 text-center shadow-soft">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green text-white shadow-[0_10px_24px_-10px_rgba(30,158,106,.8)]"><Check size={32} strokeWidth={3} /></span>
            <div className="tnum mt-3 text-[12px] font-medium text-ink-3">{uz.checkout.orderNo} {order.id}</div>
            <h1 className="m-0 mt-1 font-display text-[22px] leading-tight">{uz.checkout.orderAccepted}</h1>
            <div className="mt-2 text-ink"><AnimatedMoney tiyin={order.totalTiyin} size="display" softCurrency duration={900} /></div>
            <div className="mt-1 text-[12px] text-ink-3">{formatDemoTime(now)} · {uz.checkout.pay[order.payment.method]}{order.payment.txId ? ` · ${order.payment.txId}` : ''}</div>
          </div>
          <div className="flex flex-col gap-2">
            {order.subOrders.flatMap((so) => so.items).map((c) => (
              <div key={c.key} className="flex items-center gap-3 rounded-card bg-card p-2.5 shadow-soft"><div className="w-12"><ProductImage id={c.image} /></div><div className="clamp-2 flex-1 text-[13px]">{c.title}</div><Money tiyin={c.priceTiyin * c.qty} size="sm" /></div>
            ))}
          </div>
          <Ledger inset className="!border-0 shadow-soft">
            <LedgerRow label={ms.checkout.items} value={<Money tiyin={order.itemsTiyin} size="sm" />} />
            <LedgerRow label={uz.checkout.deliveryFee} value={<Money tiyin={order.delivery.feeTiyin} size="sm" />} sub={selected && order.delivery.method === 'bts_branch' ? selected.name : undefined} />
            <LedgerRow label={uz.cart.total} value={<Money tiyin={order.totalTiyin} size="md" />} emphasis />
          </Ledger>
          <section className="rounded-card bg-card px-4 py-3 shadow-soft">
            <div className="mb-2 text-[15px] font-semibold text-ink">{uz.checkout.whatNext}</div>
            <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
              {uz.checkout.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-ink-2"><StepDot n={i + 1} size={26} /><span className="pt-0.5">{s}</span></li>
              ))}
            </ol>
          </section>
          <div className="flex flex-col gap-2 pt-1">
            <Button variant="primary" size="lg" fullWidth onClick={() => nav(`/orders/${order.id}`)}>{uz.checkout.toOrders}</Button>
            <Button variant="secondary" size="lg" fullWidth onClick={() => nav('/')}>{uz.checkout.continueShopping}</Button>
          </div>
        </div>
      )}
      <SealBurst show={burst} label={uz.checkout.orderAccepted} sub={order ? `${uz.checkout.orderNo} ${order.id}` : undefined} onDone={() => setBurst(false)} />
    </Screen>
  )
}
