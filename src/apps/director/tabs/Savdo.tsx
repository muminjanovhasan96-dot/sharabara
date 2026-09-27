import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartTheme } from '@/design'
import { useNow, useStore } from '@/store'
import { formatMoneyCompact } from '@/domain/money'
import { formatDemoTime } from '@/domain/clock'
import type { Order } from '@/domain/types'
import { computeChannels, computeOverview, computeSales } from '../lib/compute'
import { useDirector } from '../lib/ctx'
import { Bars, C, CHANNEL_COLOR, ChartTip, Empty, Legend, List, Panel, RankChip, Row, compact } from '../components/ui'
import { OrderSheet, SubBadge } from '../components/OrderSheet'
import { D } from '../strings'

const NAMES = { listings: D.overview.listings, mall: D.overview.mall }
const pct = (v: number) => `${Math.round(v * 100)} %`
const cmp = compact

export function Savdo() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const { period } = useDirector()
  const sales = useMemo(() => computeSales(data, now, period), [data, now, period])
  const ov = useMemo(() => computeOverview(data, now, period), [data, now, period])
  const { rows: channels, fallback: chFallback } = useMemo(() => computeChannels(data, now, period, ov.revenue), [data, now, period, ov.revenue])
  const [sel, setSel] = useState<Order | null>(null)
  const scope = sales.fallback ? D.periodLong.oy : D.periodLong[period]
  const right = (share: number, v: number) => <><span className="text-ink-3">{pct(share)}</span> · <span className="font-semibold text-ink">{cmp(v)}</span></>

  return (
    <div className="flex flex-col gap-3 @3xl:gap-4">
      <Panel eyebrow={D.sales.chart30} hint={`${D.overview.mall} · ${D.overview.listings}`} bodyClassName="px-1 pb-2 pt-1"
        actions={<Legend items={[{ label: D.overview.mall, color: C.blue }, { label: D.overview.listings, color: C.navy }]} className="hidden @md:flex" />}>
        <div className="h-[200px] @3xl:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sales.chart30} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sv-mall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.blue} stopOpacity={0.45} /><stop offset="1" stopColor={C.blue} stopOpacity={0.08} /></linearGradient>
                <linearGradient id="sv-list" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.navy} stopOpacity={0.3} /><stop offset="1" stopColor={C.navy} stopOpacity={0.05} /></linearGradient>
              </defs>
              <CartesianGrid vertical={false} {...chartTheme.grid} />
              <XAxis dataKey="label" tick={chartTheme.axisTick} axisLine={chartTheme.axisLine} tickLine={false} interval={6} />
              <YAxis tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => formatMoneyCompact(v)} />
              <Tooltip cursor={{ stroke: 'var(--blue)', strokeWidth: 1, strokeDasharray: '3 3' }} content={(p) => <ChartTip {...p} names={NAMES} />} />
              <Area type="monotone" dataKey="mall" stackId="a" stroke={C.blue} fill="url(#sv-mall)" strokeWidth={2} isAnimationActive={false} />
              <Area type="monotone" dataKey="listings" stackId="a" stroke={C.navy} fill="url(#sv-list)" strokeWidth={1.75} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <Legend items={[{ label: D.overview.mall, color: C.blue }, { label: D.overview.listings, color: C.navy }]} className="mt-1 px-3 @md:hidden" />
      </Panel>

      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-2 @3xl:gap-4">
        <Panel eyebrow={D.sales.channels} hint={chFallback ? D.periodLong.oy : D.periodLong[period]}>
          <Bars rows={channels.map((c) => ({ id: c.channel, label: c.label, value: c.amount, color: CHANNEL_COLOR[c.channel], right: right(c.share, c.amount) }))} />
        </Panel>
        <Panel eyebrow={D.sales.byRegion} hint={D.periodLong[period]}>
          <Bars rows={sales.regions.slice(0, 8).map((r) => ({ id: r.id, label: r.label, value: r.value, right: right(r.share ?? 0, r.value) }))} tone="ink" />
        </Panel>
        <Panel eyebrow={D.sales.topProducts} hint={scope} padding={false}>
          {sales.topProducts.length === 0 ? <Empty /> : (
            <List className="px-4">
              {sales.topProducts.map((p, i) => (
                <Row key={p.id + i} leading={<RankChip n={i + 1} />} title={p.label} sub={`${p.count} ${D.pcs} ${D.sales.sold}`} right={cmp(p.value)} />
              ))}
            </List>
          )}
        </Panel>
        <div className="flex flex-col gap-3 @3xl:gap-4">
          <Panel eyebrow={D.sales.topCompanies} hint={scope} padding={false}>
            {sales.topCompanies.length === 0 ? <Empty /> : (
              <List className="px-4">
                {sales.topCompanies.map((c, i) => (
                  <Row key={c.id} leading={<RankChip n={i + 1} />} title={c.label} sub={`${c.count} ${D.orders} · ${D.sales.returnRate} ${pct(c.returnRate)}`} right={cmp(c.value)} />
                ))}
              </List>
            )}
          </Panel>
          <Panel eyebrow={D.sales.topSellers} hint={scope} padding={false}>
            {sales.topSellers.length === 0 ? <Empty /> : (
              <List className="px-4">
                {sales.topSellers.map((c, i) => (
                  <Row key={c.id} leading={<RankChip n={i + 1} />} title={c.label} sub={`${c.count} ${D.orders}`} right={cmp(c.value)} />
                ))}
              </List>
            )}
          </Panel>
        </div>
        <Panel eyebrow={D.sales.categories} hint={scope}>
          <Bars rows={sales.categories.map((c) => ({ id: c.id, label: c.label, value: c.value, right: right(c.share ?? 0, c.value) }))} tone="blue" />
        </Panel>
        <Panel eyebrow={D.sales.recentOrders} hint="so’nggi 20" padding={false}>
          <List className="px-4">
            {sales.recentOrders.map((o) => (
              <Row key={o.id} onClick={() => setSel(o)} title={o.subOrders[0]?.items[0]?.title} sub={`${o.id} · ${formatDemoTime(o.createdAt)} · ${D.channel[o.channel]}`} right={cmp(o.totalTiyin)} rightSub={<SubBadge status={o.subOrders[0]?.status ?? 'packing'} />} />
            ))}
          </List>
        </Panel>
      </div>
      <OrderSheet order={sel} onClose={() => setSel(null)} />
    </div>
  )
}
