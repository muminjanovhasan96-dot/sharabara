import { useMemo } from 'react'
import { CreditCard } from 'lucide-react'
import { useStore, useNow } from '@/store'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { uz, t } from '@/i18n/uz'
import { formatDemoDate, formatDemoTime, nextFriday } from '@/domain/clock'
import { AnimatedMoney, Badge, Button, ErrorState, toast } from '@/design'
import { EmptyState, GoldCoin, NavyCard, PastelTile } from '../components/Ui'
import type { BadgeTone } from '@/design'
import type { PayoutStatus } from '@/domain/types'
import { ms } from '../strings'
import { useList, useMeId, useScreenLoad } from '../lib'
import { Screen } from '../components/Screen'
import { RowsSkeleton } from '../components/Cards'

const ESCROW = new Set(['packing', 'packed', 'handed_to_bts', 'in_transit', 'at_branch', 'delivered', 'return_requested', 'return_denied'])
const PTONE: Record<PayoutStatus, BadgeTone> = { pending: 'neutral', scheduled: 'blue', awaiting_second_approval: 'gold', paid: 'green' }
const PLABEL: Record<PayoutStatus, string> = { pending: ms.wallet.pending, scheduled: ms.wallet.scheduled, awaiting_second_approval: ms.wallet.awaiting, paid: ms.wallet.paid }

export default function Wallet() {
  const nav = useAppNavigate()
  const meId = useMeId()
  const now = useNow()
  const { loading, error, reload } = useScreenLoad([meId])
  const key = `u:${meId}`
  const orders = useStore((s) => s.data.orders)
  const payouts = useList((s) => s.data.payouts.filter((p) => p.sellerKey === key))
  const kpi = useMemo(() => {
    const subs = orders.flatMap((o) => o.subOrders).filter((so) => so.sellerKey === key)
    const paidSubIds = new Set(payouts.flatMap((p) => p.subOrderIds))
    const pending = subs.filter((so) => ESCROW.has(so.status) && !paidSubIds.has(so.id)).reduce((a, so) => a + so.subtotalTiyin - (so.feeOverride?.amountTiyin ?? so.feeTiyin), 0)
    const available = payouts.filter((p) => p.status !== 'paid').reduce((a, p) => a + p.amountTiyin, 0)
    const paid = payouts.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amountTiyin, 0)
    return { pending, available, paid }
  }, [orders, payouts, key])
  const history = useMemo(() => payouts.slice().sort((a, b) => (b.paidAt ?? b.scheduledFor ?? '').localeCompare(a.paidAt ?? a.scheduledFor ?? '')), [payouts])
  const firstPaid = history.find((p) => p.status === 'paid')?.id

  return (
    <Screen back backTo="/profile" title={uz.wallet.title} withTabBar>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[{ l: uz.wallet.pending, v: kpi.pending, tone: 'text-ink-2' }, { l: uz.wallet.available, v: kpi.available, tone: 'text-blue' }, { l: uz.wallet.paid, v: kpi.paid, tone: 'text-green' }].map((k) => (
          <div key={k.l} className="rounded-card bg-card px-2.5 py-3 shadow-soft">
            <div className="eyebrow clamp-2 !text-[9.5px] leading-tight">{k.l}</div>
            <div className={`mt-1.5 ${k.tone}`}><AnimatedMoney tiyin={k.v} size="md" compact bare className="font-display text-[17px] font-bold" /></div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-card bg-gold-soft px-4 py-2.5 text-[13px] text-ink">
        <span className="font-medium">{uz.wallet.nextPayout}</span><span className="tnum font-bold">{formatDemoDate(nextFriday(now))}</span>
      </div>
      <NavyCard padding="md" className="mt-3 flex items-center gap-3">
        <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,180,0,.35) 0%, rgba(245,180,0,0) 70%)' }} aria-hidden="true" />
        <GoldCoin size={44} Icon={CreditCard} className="relative" />
        <div className="relative min-w-0 flex-1"><div className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/60">{uz.wallet.card}</div><div className="tnum text-[15px] font-semibold text-white">{ms.wallet.card}</div><div className="text-[11.5px] text-white/60">{ms.wallet.cardHint}</div></div>
        <Button variant="gold" size="sm" className="relative" onClick={() => toast.info(ms.wallet.withdrawToast)}>{uz.wallet.withdraw}</Button>
      </NavyCard>
      <p className="m-0 mt-2 text-[11.5px] text-ink-3">{ms.wallet.escrowHint}</p>

      <section className="mt-5">
        <div className="mb-2 text-[17px] font-bold tracking-[-0.01em] text-ink">{uz.wallet.history}</div>
        {error ? <ErrorState onRetry={reload} compact /> : loading ? <RowsSkeleton n={3} /> : history.length === 0 ? (
          <EmptyState compact icon="wallet" title={ms.wallet.noHistory} hint={ms.wallet.noHistoryHint} action={<Button variant="secondary" size="sm" onClick={() => nav('/sell/my')}>{uz.sell.myListings}</Button>} />
        ) : (
          <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-card bg-card p-0 shadow-soft">
            {history.map((p) => (
              <li key={p.id} data-testid={p.status === 'paid' && p.id === firstPaid ? TID.mWalletPaid : undefined} data-id={p.id} className="flex items-center gap-3 px-4 py-3">
                <PastelTile icon={p.status === 'paid' ? 'check' : 'clock'} size={40} tone={p.status === 'paid' ? 'green' : 'gold'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="tnum text-[13px] font-medium">{p.id}</span><Badge tone={PTONE[p.status]} size="sm" dot>{PLABEL[p.status]}</Badge></div>
                  <div className="text-[12px] text-ink-3">{t(ms.wallet.payoutFor, { n: p.subOrderIds.length })} · {p.paidAt ? formatDemoTime(p.paidAt) : p.scheduledFor ? formatDemoDate(`${p.scheduledFor}T12:00:00`) : '—'} · ****{p.cardLast4}</div>
                </div>
                <AnimatedMoney tiyin={p.amountTiyin} size="md" softCurrency className={p.status === 'paid' ? 'text-green' : ''} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  )
}
