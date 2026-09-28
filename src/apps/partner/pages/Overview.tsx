import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import { Button, Card, CardHeader, chartTheme, EmptyState, KpiCard, Money, ProductImage, Skeleton } from '@/design'
import { useData, useNow } from '@/store'
import { addDays, dateKey, formatDemoDate, formatDemoTime, nextFriday } from '@/domain/clock'
import { formatMoney } from '@/domain/money'
import { t } from '@/i18n/uz'
import { useAppNavigate } from '@/lib/router'
import { useCompany, useCompanyProducts, useCompanySubs, useListLoading } from '../hooks'
import { P } from '../strings'
import { PageHeader, SubStatusBadge } from '../ui'

const LIVE = new Set(['packing', 'packed', 'handed_to_bts', 'in_transit', 'at_branch', 'delivered', 'payout_scheduled', 'payout_paid', 'return_requested', 'return_denied'])

export function Overview() {
  const c = useCompany()
  const now = useNow()
  const subs = useCompanySubs(c.id)
  const products = useCompanyProducts(c.id)
  const payouts = useData((d) => d.payouts)
  const nav = useAppNavigate()
  const loading = useListLoading(c.id)

  const monthKey = now.slice(0, 7)
  const prevMonthKey = addDays(now, -30).slice(0, 7)
  const stats = useMemo(() => {
    let sales = 0, pcs = 0, prev = 0
    for (const { so, o } of subs) {
      if (!LIVE.has(so.status)) continue
      const k = o.createdAt.slice(0, 7)
      if (k === monthKey) { sales += so.subtotalTiyin; pcs += so.items.reduce((a, i) => a + i.qty, 0) }
      else if (k === prevMonthKey) prev += so.subtotalTiyin
    }
    return { sales, pcs, delta: prev > 0 ? (sales - prev) / prev : undefined }
  }, [subs, monthKey, prevMonthKey])

  const nextPayout = useMemo(() => payouts.filter((p) => p.sellerKey === `c:${c.id}` && p.status !== 'paid').reduce((a, p) => a + p.amountTiyin, 0), [payouts, c.id])
  const overpriced = products.filter((p) => p.check === 'overpriced').length
  const lowStock = products.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock)

  const series = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => dateKey(addDays(now, -(29 - i))))
    const map = new Map(days.map((d) => [d, 0]))
    for (const { so, o } of subs) {
      if (!LIVE.has(so.status)) continue
      const k = dateKey(o.createdAt)
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + so.subtotalTiyin)
    }
    return days.map((d) => ({ d, label: d.slice(8), value: map.get(d) ?? 0 }))
  }, [subs, now])

  const recent = subs.slice(0, 6)

  return (
    <div>
      <PageHeader eyebrow={c.name} help={P.help.overview} title={P.nav.overview}>
        {formatDemoDate(now)} · {P.model[c.model]} · {Math.round(c.commissionRate * 100)}% komissiya
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }, (_, i) => <Card key={i} padding="md"><Skeleton width={90} height={10} /><Skeleton className="mt-3" width={140} height={26} /><Skeleton className="mt-2" width={110} height={10} /></Card>) : (
          <>
            <KpiCard label={P.overview.salesMonth} value={stats.sales} money compact delta={stats.delta} deltaLabel={stats.delta !== undefined ? P.overview.vsLastMonth : undefined} spark={series.slice(-14).map((s) => s.value)} />
            <KpiCard label={P.overview.soldPcs} value={stats.pcs} suffix={P.common.pcs} />
            <KpiCard label={P.overview.nextPayout} value={nextPayout} money compact hint={nextPayout > 0 ? t(P.overview.payoutDate, { d: formatDemoDate(nextFriday(now)) }) + ' · ' + P.overview.afterCommission : P.overview.noPayout} />
            <KpiCard label={P.overview.overpriced} value={overpriced} suffix={P.common.pcs} hint={overpriced > 0 ? <span className="text-brick">{P.products.checkOver}</span> : P.overview.noAlerts} onClick={() => nav('/products?check=overpriced')} />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card padding="md">
          <CardHeader eyebrow={P.overview.chartHint} title={P.overview.chart30} />
          {loading ? <Skeleton height={220} /> : (
            <div className="h-[220px] w-full" role="img" aria-label={P.overview.chart30}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap={2}>
                  <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" />
                  <XAxis dataKey="label" tick={chartTheme.axisTick} axisLine={chartTheme.axisLine} tickLine={false} interval={4} />
                  <YAxis tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => formatMoney(v, { compact: true, withCurrency: false })} />
                  <Tooltip cursor={{ fill: 'var(--blue-soft)', fillOpacity: 0.55 }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as { d: string; value: number }
                    return <div className={chartTheme.tooltipClass}><div className={chartTheme.tooltipLabelClass}>{formatDemoDate(`${p.d}T12:00:00`)}</div><div className="font-medium">{formatMoney(p.value, { compact: true })}</div></div>
                  }} />
                  <Bar dataKey="value" fill="var(--blue)" radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader eyebrow={lowStock.length ? `${lowStock.length} ${P.common.pcs}` : undefined} title={P.overview.alerts} actions={<Button variant="link" onClick={() => nav('/products?low=1')} trailing={<ArrowRight />}>{P.overview.openProducts}</Button>} />
          {loading ? <div className="flex flex-col gap-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={40} />)}</div> : lowStock.length === 0 ? (
            <EmptyState compact icon="check" title={P.overview.noAlerts} hint={P.overview.noAlertsHint} />
          ) : (
            <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <TriangleAlert size={16} strokeWidth={1.75} className="shrink-0 text-brick" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="clamp-1 text-[13.5px] text-ink">{p.title}</div>
                    <div className="text-[12px] text-ink-3">{p.sku} · {P.overview.lowStock}</div>
                  </div>
                  <span className="tnum shrink-0 rounded-full bg-brick-soft px-2 py-0.5 text-[12px] font-semibold text-brick">{t(P.overview.lowStockHint, { n: p.stock })}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card padding="md" className="mt-4">
        <CardHeader title={P.overview.recentOrders} actions={<Button variant="link" onClick={() => nav('/orders')} trailing={<ArrowRight />}>{P.nav.orders}</Button>} />
        {loading ? <div className="flex flex-col gap-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={44} />)}</div> : recent.length === 0 ? (
          <EmptyState compact icon="package-open" title={P.orders.empty} hint={P.orders.emptyHint} />
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
            {recent.map(({ so, o }) => (
              <li key={so.id}>
                <button type="button" onClick={() => nav(`/orders?id=${so.id}`)} className="flex w-full items-center gap-3 rounded-[8px] px-1 py-2 text-left hover:bg-blue-soft/50 focus-visible:ring-2 focus-visible:ring-blue">
                  <ProductImage id={so.items[0].image} className="h-10 w-10 shrink-0" fill={0.75} />
                  <div className="min-w-0 flex-1">
                    <div className="clamp-1 text-[13.5px] text-ink">{so.items.map((i) => `${i.title}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ')}</div>
                    <div className="text-[12px] text-ink-3">{o.id} · {formatDemoTime(o.createdAt)}</div>
                  </div>
                  <SubStatusBadge status={so.status} size="sm" />
                  <Money tiyin={so.subtotalTiyin} size="sm" className="w-[120px] text-right font-medium" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
