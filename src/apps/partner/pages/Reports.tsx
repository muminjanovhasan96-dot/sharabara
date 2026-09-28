import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, chartTheme, EmptyState, KpiCard, Progress, Skeleton } from '@/design'
import { useData, useNow } from '@/store'
import { ageDays } from '@/domain/clock'
import { formatMoney, percent } from '@/domain/money'
import { useCompany, useCompanyProducts, useCompanySubs, useListLoading } from '../hooks'
import { P } from '../strings'
import { PageHeader } from '../ui'

const SOLD = new Set(['delivered', 'payout_scheduled', 'payout_paid', 'return_requested', 'return_denied', 'refunded', 'return_approved', 'in_transit', 'at_branch', 'handed_to_bts', 'packed', 'packing'])

export function Reports() {
  const c = useCompany()
  const now = useNow()
  const subs = useCompanySubs(c.id)
  const products = useCompanyProducts(c.id)
  const categories = useData((d) => d.categories)
  const orders = useData((d) => d.orders)
  const loading = useListLoading(c.id)

  const byCat = useMemo(() => {
    const m = new Map<string, { sales: number; sold: number; stock: number }>()
    for (const p of products) { const e = m.get(p.categoryId) ?? { sales: 0, sold: 0, stock: 0 }; e.stock += p.stock; m.set(p.categoryId, e) }
    for (const { so, o } of subs) {
      if (!SOLD.has(so.status) || ageDays(o.createdAt, now) > 30) continue
      for (const i of so.items) { const p = products.find((x) => x.id === i.refId); if (!p) continue; const e = m.get(p.categoryId)!; e.sales += i.priceTiyin * i.qty; e.sold += i.qty }
    }
    return [...m.entries()].map(([id, e]) => ({ id, name: categories.find((x) => x.id === id)?.name ?? id, ...e, ratio: e.stock > 0 ? e.sold / e.stock : e.sold > 0 ? 1 : 0 })).sort((a, b) => b.sales - a.sales)
  }, [products, subs, categories, now])

  const returns = useMemo(() => {
    const delivered = subs.filter((r) => ['delivered', 'payout_scheduled', 'payout_paid', 'return_requested', 'return_approved', 'return_denied', 'refunded'].includes(r.so.status)).length
    const returned = subs.filter((r) => ['return_requested', 'return_approved', 'refunded'].includes(r.so.status)).length
    let allD = 0, allR = 0
    for (const o of orders) for (const so of o.subOrders) { if (['delivered', 'payout_scheduled', 'payout_paid', 'return_requested', 'return_approved', 'return_denied', 'refunded'].includes(so.status)) allD++; if (['return_requested', 'return_approved', 'refunded'].includes(so.status)) allR++ }
    return { delivered, returned, rate: delivered ? returned / delivered : 0, platform: allD ? allR / allD : 0 }
  }, [subs, orders])

  const maxRatio = Math.max(0.01, ...byCat.map((x) => x.ratio))

  return (
    <div>
      <PageHeader eyebrow={c.name} help={P.help.reports} title={P.reports.title} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card padding="md">
          <CardHeader title={P.reports.byCategory} eyebrow={P.reports.byCategoryHint} />
          {loading ? <Skeleton height={260} /> : byCat.length === 0 ? <EmptyState compact title={P.reports.noData} /> : (
            <div className="w-full" style={{ height: Math.max(180, byCat.length * 44 + 30) }} role="img" aria-label={P.reports.byCategory}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCat} layout="vertical" margin={{ top: 4, right: 96, bottom: 0, left: 4 }} barCategoryGap={8}>
                  <CartesianGrid horizontal={false} stroke="var(--line)" strokeDasharray="3 5" />
                  <XAxis type="number" tick={chartTheme.axisTick} axisLine={chartTheme.axisLine} tickLine={false} tickFormatter={(v: number) => formatMoney(v, { compact: true, withCurrency: false })} />
                  <YAxis type="category" dataKey="name" tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={130} />
                  <Tooltip cursor={{ fill: 'var(--blue-soft)', fillOpacity: 0.55 }} content={({ active, payload }) => { if (!active || !payload?.length) return null; const p = payload[0].payload as { name: string; sales: number; sold: number }; return <div className={chartTheme.tooltipClass}><div className={chartTheme.tooltipLabelClass}>{p.name}</div><div className="font-medium">{formatMoney(p.sales, { compact: true })}</div><div className="text-ink-3">{p.sold} {P.common.pcs}</div></div> }} />
                  <Bar dataKey="sales" fill="var(--blue)" radius={[0, 6, 6, 0]} maxBarSize={22} isAnimationActive={false}>
                    <LabelList dataKey="sales" position="right" formatter={(v) => formatMoney(Number(v), { compact: true })} style={{ fill: 'var(--ink-2)', fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <div className="flex flex-col gap-4">
          <Card padding="md">
            <CardHeader title={P.reports.returns} eyebrow={P.reports.returnsHint} />
            {loading ? <Skeleton height={80} /> : (
              <div className="grid grid-cols-2 gap-3">
                <KpiCard label={P.reports.yours} value={returns.rate * 100} format={(v) => `${v.toFixed(1)}%`} delta={returns.rate - returns.platform} invertDelta deltaLabel={P.reports.platformAvg} className="border-0 shadow-none p-0" />
                <div className="flex flex-col justify-center gap-1 text-[13px]"><div className="flex justify-between"><span className="text-ink-2">{P.reports.ordersDelivered}</span><span className="tnum font-medium">{returns.delivered}</span></div><div className="flex justify-between"><span className="text-ink-2">{P.reports.ordersReturned}</span><span className="tnum font-medium text-brick">{returns.returned}</span></div><div className="flex justify-between"><span className="text-ink-2">{P.reports.platformAvg}</span><span className="tnum font-medium">{percent(returns.platform, 1).replace(/^[+−]/, '')}</span></div></div>
              </div>
            )}
          </Card>
          <Card padding="md">
            <CardHeader title={P.reports.turnover} eyebrow={P.reports.turnoverHint} />
            {loading ? <Skeleton height={160} /> : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {byCat.map((x) => (
                  <li key={x.id} className="text-[13px]">
                    <div className="flex items-baseline justify-between gap-2"><span className="text-ink">{x.name}</span><span className="tnum text-ink-2">{P.reports.sold} {x.sold} · {P.reports.inStock} {x.stock} · <span className={x.ratio >= 0.05 ? 'font-semibold text-green' : 'font-semibold text-ink-3'}>{x.ratio >= 0.05 ? P.reports.good : P.reports.slow}</span></span></div>
                    <Progress value={x.ratio} max={maxRatio} tone={x.ratio >= 0.05 ? 'green' : 'blue'} size="xs" className="mt-1.5" label={`${x.name}: ${P.reports.ratio}`} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
