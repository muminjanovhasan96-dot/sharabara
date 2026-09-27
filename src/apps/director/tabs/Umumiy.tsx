import { useMemo } from 'react'
import { Banknote, ChevronRight, CreditCard, LockKeyhole, PackageX, Percent, Receipt, ShoppingBag, Tag, TriangleAlert, Wallet } from 'lucide-react'
import { Card } from '@/design'
import { cn } from '@/lib/utils'
import { useNow, useStore } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import type { AuditEntry } from '@/domain/types'
import { computeCash, computeChannels, computeFeed, computeOverview, computeProblems, computeSales, computeStock } from '../lib/compute'
import { useDirector } from '../lib/ctx'
import { AdminLink, BigMoney, CHANNEL_COLOR, CountPill, DeltaPill, Donut, Empty, IconChip, Panel, RankChip, Row, SmoothSpark, Stat, TimelineList, compact, compactParts, type DotTone } from '../components/ui'
import { D, tt } from '../strings'

const cmp = compact
const FEED_TONE: Record<AuditEntry['kind'], DotTone> = { money: 'gold', price: 'gold', fee: 'brick', auth: 'brick', status: 'blue', data: 'muted' }

export function Umumiy() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const { period, go } = useDirector()
  const ov = useMemo(() => computeOverview(data, now, period), [data, now, period])
  const { rows: channels, fallback: chFallback } = useMemo(() => computeChannels(data, now, period, ov.revenue), [data, now, period, ov.revenue])
  const cash = useMemo(() => computeCash(data, now, period, ov.revenue), [data, now, period, ov.revenue])
  const sales = useMemo(() => computeSales(data, now, period), [data, now, period])
  const stock = useMemo(() => computeStock(data, now), [data, now])
  const feed = useMemo(() => computeFeed(data, 12), [data])
  const problems = useMemo(() => computeProblems(data, now).filter((g) => g.items.length > 0), [data, now])
  const problemTotal = problems.reduce((a, g) => a + g.items.length, 0)
  const mallShare = ov.mall + ov.listings ? ov.mall / (ov.mall + ov.listings) : 0
  const [centerNum, centerUnit] = compactParts(ov.revenue)
  const topScope = sales.fallback ? D.periodLong.oy : D.periodLong[period]

  return (
    <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-3 @3xl:gap-4">
      {/* Hero — bugungi savdo */}
      <Card padding="none" className="p-4 @3xl:col-span-2 @3xl:order-1 @3xl:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-ink-3">{D.overview.salesHero[period]}</div>
            <div className="mt-1"><BigMoney tiyin={ov.revenue} size="display" /></div>
            <DeltaPill className="mt-3" delta={ov.revenueDelta} label={D.vsPrev[period]} />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 pt-1">
            <SmoothSpark values={ov.spark} width={124} height={46} id="hero-spark" className="@3xl:hidden" />
            <SmoothSpark values={ov.spark} width={220} height={64} id="hero-spark-lg" className="hidden @3xl:block" />
            <span className="text-[11px] text-ink-3">{D.overview.days14}</span>
          </div>
        </div>
        <div className="mt-4 border-t border-line pt-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-3"><span className="h-2 w-2 rounded-[2px] bg-blue" aria-hidden="true" />{D.overview.mall}</div>
              <div className="mt-1 flex items-baseline gap-1.5"><BigMoney tiyin={ov.mall} size="lg" /><span className="tnum text-[12px] text-ink-3">· {Math.round(mallShare * 100)} %</span></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-3"><span className="h-2 w-2 rounded-[2px] bg-ink" aria-hidden="true" />{D.overview.listings}</div>
              <div className="mt-1 flex items-baseline gap-1.5"><BigMoney tiyin={ov.listings} size="lg" /><span className="tnum text-[12px] text-ink-3">· {Math.round((1 - mallShare) * 100)} %</span></div>
            </div>
          </div>
          <div className="mt-2.5 flex h-[7px] gap-0.5 overflow-hidden rounded-full bg-paper-2" aria-hidden="true">
            <div className="h-full rounded-full bg-blue" style={{ width: `${Math.max(2, mallShare * 100)}%` }} />
            <div className="h-full flex-1 rounded-full bg-ink" />
          </div>
        </div>
      </Card>

      {/* Stat tiles 2×3 */}
      <div className="grid grid-cols-2 gap-3 @3xl:order-3 @3xl:col-span-3 @3xl:grid-cols-3 @3xl:gap-4 @5xl:grid-cols-6">
        <Stat label={D.overview.orders} value={ov.orders} icon={ShoppingBag} chip="blue" delta={ov.ordersDelta} deltaLabel={ov.ordersDelta !== undefined ? undefined : D.periodLong[period]} onClick={() => go('savdo')} />
        <Stat label={D.overview.avgCheck} value={ov.avgCheck} money icon={Receipt} chip="green" onClick={() => go('savdo')} />
        <Stat label={D.overview.activeListings} value={ov.activeListings} icon={Tag} chip="gold" suffix="e’lon" />
        <Stat label={D.overview.commission} value={ov.commission} money icon={Percent} chip="gold" delta={ov.commissionDelta} onClick={() => go('pul')} />
        <Stat label={D.overview.escrow} value={ov.escrow} money icon={LockKeyhole} chip="blue" hint={D.overview.escrowHint} onClick={() => go('pul')} />
        <Stat label={D.overview.paidOut[period]} value={ov.paidOut} money icon={Banknote} chip="green" hint={ov.paidOutCount ? `${ov.paidOutCount} ta to’lov` : D.overview.paidOutHint} onClick={() => go('pul')} />
      </div>

      {/* Kanallar */}
      <Panel eyebrow={D.overview.channelsRevenue} hint={chFallback ? `${D.overview.channelsHint} · ${D.periodLong.oy}` : D.overview.channelsHint} className="@3xl:order-2">
        <div className="flex items-center gap-3 @md:gap-4">
          <Donut data={channels.map((c) => ({ key: c.channel, label: c.label, value: c.amount, color: CHANNEL_COLOR[c.channel] }))} className="w-[112px] @md:w-[128px] @3xl:w-[136px]">
            <div>
              <div className="tnum font-display text-[17px] font-extrabold leading-none text-ink @3xl:text-[20px]">{centerNum}</div>
              <div className="mt-0.5 text-[10.5px] text-ink-3">{centerUnit ? `${centerUnit} so’m` : 'so’m'}</div>
            </div>
          </Donut>
          <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-2 p-0 @3xl:gap-3.5">
            {channels.map((c) => (
              <li key={c.channel} className="flex items-center gap-2 text-[13px] @3xl:text-[12.5px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: CHANNEL_COLOR[c.channel] }} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-medium text-ink" title={c.orders ? `${c.orders} ${D.orders}` : undefined}>{c.label}</span>
                <span className="tnum shrink-0 font-bold text-ink">{cmp(c.amount)}</span>
                <span className="tnum w-[34px] shrink-0 text-right text-[12px] text-ink-3">{Math.round(c.share * 100)} %</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      {/* Chap ustun: kassa, ombor, top tovarlar */}
      <div className="flex flex-col gap-3 @3xl:order-4 @3xl:gap-4">
        <Card padding="none" className="grid grid-cols-2 gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <IconChip icon={Wallet} tone="gold" size={36} />
            <div className="min-w-0">
              <div className="truncate text-[11px] font-medium text-ink-3">{D.overview.cashCash}</div>
              <div className="tnum truncate font-display text-[15px] font-extrabold text-ink">{cmp(cash.cash)}</div>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2.5">
            <IconChip icon={CreditCard} tone="blue" size={36} />
            <div className="min-w-0">
              <div className="truncate text-[11px] font-medium text-ink-3">{D.overview.cashCard}</div>
              <div className="tnum truncate font-display text-[15px] font-extrabold text-ink">{cmp(cash.card)}</div>
            </div>
          </div>
          {cash.fallback && <div className="col-span-2 -mt-1 text-[11px] text-ink-3">{D.periodLong.oy} ulushi bo’yicha</div>}
        </Card>

        <Panel eyebrow={D.overview.stockAlerts} actions={<CountPill n={stock.low.length} tone={stock.low.some((l) => l.qty === 0) ? 'brick' : 'gold'} />} padding={false}>
          {stock.low.length === 0 ? <Empty text={D.overview.attentionOk} /> : (
            <ul className="m-0 list-none divide-y divide-line p-0">
              {stock.low.slice(0, 4).map((l) => {
                const out = l.qty === 0
                return (
                  <li key={l.productId} className="flex items-center gap-3 px-4 py-2.5">
                    {out ? <PackageX size={18} strokeWidth={1.9} className="shrink-0 text-brick" aria-hidden="true" /> : <TriangleAlert size={18} strokeWidth={1.9} className="shrink-0 text-gold" aria-hidden="true" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-ink">{l.title}</div>
                      <div className={cn('truncate text-[11.5px]', out ? 'text-brick' : 'text-ink-3')}>
                        {out ? D.overview.outOfStock : tt(D.overview.leftPcs, { n: l.qty })}
                        {' · '}{l.waiting ? tt(D.overview.waitingOrders, { n: l.waiting }) : out ? l.company : l.daysLeft}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {stock.low.length > 4 && (
            <button type="button" onClick={() => go('ombor')} className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-[12.5px] font-semibold text-blue hover:bg-paper-2">
              {D.overview.seeAll}<ChevronRight size={15} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </Panel>

        <Panel eyebrow={`${D.overview.topProducts} · ${topScope}`} padding={false}>
          {sales.topProducts.length === 0 ? <Empty /> : (
            <div className="divide-y divide-line px-4">
              {sales.topProducts.slice(0, 5).map((p, i) => (
                <Row key={p.id + i} leading={<RankChip n={i + 1} />} title={p.label} sub={`${p.count} ${D.pcs} ${D.sales.sold}`} right={cmp(p.value)} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Lenta */}
      <Panel eyebrow={D.overview.feed} hint={D.overview.feedHint} bodyClassName="px-4 pb-3 pt-1" className="@3xl:order-5">
        <TimelineList items={feed.map((f) => ({
          id: f.id, tone: FEED_TONE[f.kind] ?? 'muted', text: f.text,
          meta: <><span className="tnum">{formatDemoTime(f.at)}</span>{f.to && <AdminLink to={f.to} className="!text-[11.5px]" />}</>,
        }))} />
      </Panel>

      {/* Diqqat */}
      <Panel eyebrow={D.overview.attention} hint={problems.length ? tt(D.overview.issues, { n: problemTotal }) : D.overview.attentionOk}
        actions={problemTotal ? <CountPill n={problemTotal} tone={problems.some((g) => g.items.some((i) => i.tone === 'brick')) ? 'brick' : 'gold'} /> : undefined} padding={false} className="@3xl:order-6">
        {problems.length === 0 ? <Empty text={D.overview.attentionOk} /> : (
          <ul className="m-0 list-none divide-y divide-line p-0">
            {problems.map((g) => (
              <li key={g.key}>
                <button type="button" onClick={() => go('muammolar', { f: g.key })} className="flex min-h-[48px] w-full items-center gap-3 px-4 py-2 text-left hover:bg-paper-2">
                  <CountPill n={g.items.length} tone={g.items.some((i) => i.tone === 'brick') ? 'brick' : 'gold'} className="h-7 min-w-7 text-[12.5px]" />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{g.label}</span>
                  <span className="text-[12px] font-semibold text-blue">{D.open}</span>
                  <ChevronRight size={16} strokeWidth={2} className="-ml-1 text-blue" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
