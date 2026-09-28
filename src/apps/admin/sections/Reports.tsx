import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, type TooltipContentProps } from 'recharts'
import { EmptyState, Field, Money, Skeleton, chartTheme, DateInput } from '@/design'
import { useNow, useStore } from '@/store'
import { dateKey, addDays } from '@/domain/clock'
import { formatMoney, formatMoneyCompact } from '@/domain/money'
import { AC, AC_GRID, BarList, Kpi, LegendPills, Panel, SampleBadge } from '../components/ui'
import { useSectionLoading } from '../lib/hooks'
import { mean, sum } from '../lib/format'
import { A } from '../strings'

export function Reports() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const loading = useSectionLoading()
  const [from, setFrom] = useState(dateKey(addDays(now, -13)))
  const [to, setTo] = useState(dateKey(now))
  const stats = useMemo(() => data.dailyStats.filter((s) => s.date >= from && s.date <= to), [data.dailyStats, from, to])
  const sales = stats.map((s) => ({ date: s.date.slice(5).replace('-', '.'), listings: s.listingsSalesTiyin, mall: s.mallSalesTiyin, review: s.avgReviewMinutes }))
  const sources = useMemo(() => {
    const tot = sum(stats.map((s) => s.listingsSalesTiyin + s.mallSalesTiyin)) || 1
    const comm = sum(stats.map((s) => s.commissionTiyin))
    const lShare = sum(stats.map((s) => s.listingsSalesTiyin)) / tot
    const inRange = (at: string) => { const d = dateKey(at); return d >= from && d <= to }
    const boost = sum(data.transactions.filter((t) => t.kind === 'boost' && inRange(t.at)).map((t) => t.amountTiyin))
    const delivery = sum(data.orders.filter((o) => o.status !== 'cancelled' && inRange(o.createdAt)).map((o) => o.delivery.feeTiyin))
    const ads = sum(data.campaigns.filter((c) => c.status === 'sent' && c.sentAt && inRange(c.sentAt)).map((c) => (c.reach ?? 0) * 5000))
    return [
      { label: A.reports.src.listingsFee, value: Math.round(comm * lShare) }, { label: A.reports.src.mallFee, value: Math.round(comm * (1 - lShare)) },
      { label: A.reports.src.boost, value: boost }, { label: A.reports.src.delivery, value: delivery }, { label: A.reports.src.ads, value: ads },
    ]
  }, [stats, data, from, to])
  const funnel = useMemo(() => {
    const c = (k: string) => data.events.filter((e) => e.kind === k || (k === 'view' && e.kind === 'view_long')).length
    return [{ label: A.reports.funnelSteps.view, value: c('view') }, { label: A.reports.funnelSteps.chat, value: c('chat') }, { label: A.reports.funnelSteps.cart, value: c('cart') }, { label: A.reports.funnelSteps.purchase, value: c('purchase') }]
  }, [data.events])
  const ai = useMemo(() => {
    const rows = data.priceDecisions.filter((p) => p.moderatorTiyin > 0).map((p, i) => ({ i, date: p.at.slice(5, 10), dev: Math.round(Math.abs(p.aiSuggestedTiyin - p.moderatorTiyin) / p.moderatorTiyin * 1000) / 10, conf: Math.round(p.confidence * 100), id: p.listingId })).sort((a, b) => a.date.localeCompare(b.date)).map((r, i) => ({ ...r, i }))
    const within = rows.filter((r) => r.dev <= 5).length
    return { rows, within: rows.length ? within / rows.length : 0, avg: mean(rows.map((r) => r.dev)) }
  }, [data.priceDecisions])
  const tip = (fmt: (v: number) => string, names: Record<string, string>) => ({ active, payload, label }: TooltipContentProps) => active && payload?.length ? (
    <div className={chartTheme.tooltipClass}><div className={chartTheme.tooltipLabelClass}>{String(label ?? '')}</div>{payload.map((p) => <div key={String(p.dataKey)} className="flex justify-between gap-4"><span className="text-ink-2">{names[String(p.dataKey)] ?? p.name}</span><span className="tnum">{fmt(Number(p.value))}</span></div>)}</div>
  ) : null
  const SN = { listings: A.dashboard.listings, mall: A.dashboard.mall }
  if (loading) return <div className="flex flex-col gap-4 p-5"><Skeleton height={44} width={420} /><div className="grid grid-cols-2 gap-4"><Skeleton height={300} className="rounded-card" /><Skeleton height={300} className="rounded-card" /></div></div>
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={A.reports.range}><div className="flex items-center gap-2"><DateInput size="sm" value={from} onValueChange={setFrom} aria-label={A.orders.dateFrom} className="w-36" /><span className="text-ink-3">—</span><DateInput size="sm" value={to} onValueChange={setTo} aria-label={A.orders.dateTo} className="w-36" /></div></Field>
        <span className="pb-2.5 text-[12.5px] text-ink-3">{stats.length} {A.common.days}</span>
      </div>
      {stats.length === 0 ? <EmptyState icon="bar-chart-3" title={A.reports.noData} /> : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel eyebrow={A.reports.sales} bodyClassName="h-[280px] p-3" actions={<LegendPills items={[{ label: SN.listings, color: AC.navy }, { label: SN.mall, color: AC.blue }]} />}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...AC_GRID} />
                  <XAxis dataKey="date" tick={chartTheme.axisTick} axisLine={chartTheme.axisLine} tickLine={false} />
                  <YAxis tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => formatMoneyCompact(v)} />
                  <Tooltip cursor={{ stroke: 'var(--blue)', strokeWidth: 1, strokeDasharray: '3 3' }} content={tip((v) => formatMoney(v, { compact: true }), SN)} />
                  <Area type="monotone" dataKey="listings" stackId="1" stroke={AC.navy} strokeWidth={2} fill={AC.navy} fillOpacity={0.12} />
                  <Area type="monotone" dataKey="mall" stackId="1" stroke={AC.blue} strokeWidth={2} fill={AC.blue} fillOpacity={0.16} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
            <Panel eyebrow={A.reports.sources} actions={<SampleBadge />}>
              <BarList rows={sources} format={(v) => formatMoney(v, { compact: true })} tone="gold" />
            </Panel>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Panel eyebrow={A.reports.funnel}>
              <BarList rows={funnel.map((f, i) => ({ ...f, hint: i > 0 && funnel[0].value ? `${Math.round((f.value / funnel[0].value) * 100)}%` : undefined }))} tone="blue" />
            </Panel>
            <Panel eyebrow={A.reports.speed} bodyClassName="h-[240px] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...AC_GRID} />
                  <XAxis dataKey="date" tick={chartTheme.axisTick} axisLine={chartTheme.axisLine} tickLine={false} />
                  <YAxis tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={32} />
                  <Tooltip cursor={{ stroke: 'var(--blue)', strokeWidth: 1, strokeDasharray: '3 3' }} content={tip((v) => `${v} ${A.reports.minutes}`, { review: A.dashboard.review })} />
                  <Line type="monotone" dataKey="review" stroke={AC.blue} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--blue)', stroke: 'var(--card)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
            <Panel eyebrow={A.reports.ai} bodyClassName="flex flex-col gap-3 p-3">
              <div className="grid grid-cols-2 gap-2">
                <Kpi label={A.reports.within5} value={Math.round(ai.within * 100)} suffix="%" hint={`${ai.rows.length} ${A.reports.decisions}`} />
                <Kpi label={A.reports.avgDev} value={Math.round(ai.avg * 10) / 10} format={(v) => v.toFixed(1).replace('.', ',')} suffix="%" />
              </div>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...AC_GRID} />
                    <XAxis dataKey="i" type="number" hide />
                    <YAxis dataKey="dev" type="number" tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={32} unit="%" />
                    <ZAxis dataKey="conf" range={[30, 30]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => active && payload?.[0] ? <div className={chartTheme.tooltipClass}><div className={chartTheme.tooltipLabelClass}>{payload[0].payload.id} · {payload[0].payload.date}</div><div>{A.reports.deviation.replace(', %', '')}: {payload[0].payload.dev}% · {A.pricing.confidence}: {payload[0].payload.conf}%</div></div> : null} />
                    <Scatter data={ai.rows} fill={AC.blue} stroke="var(--card)" strokeWidth={1} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Kpi label={A.dashboard.salesToday.replace('Bugungi', 'Davr')} value={sum(stats.map((s) => s.listingsSalesTiyin + s.mallSalesTiyin))} money compact />
            <Kpi label={A.dashboard.orders} value={sum(stats.map((s) => s.orders))} />
            <div className="rounded-card border border-line bg-card p-4"><div className="eyebrow">{A.dashboard.commission}</div><Money tiyin={sum(stats.map((s) => s.commissionTiyin))} size="xl" compact softCurrency /></div>
          </div>
        </>
      )}
    </div>
  )
}
