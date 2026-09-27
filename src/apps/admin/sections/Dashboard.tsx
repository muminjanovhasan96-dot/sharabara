import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChevronRight } from 'lucide-react'
import { Money, DataTable, EmptyState, Skeleton, chartTheme, type Column } from '@/design'
import { useNow, useStore } from '@/store'
import { useAppNavigate } from '@/lib/router'
import { formatMoney, formatMoneyCompact } from '@/domain/money'
import { dateKey, addDays } from '@/domain/clock'
import type { AdminSection, RegionId } from '@/domain/types'
import { AC, AC_CURSOR, AC_GRID, Kpi, LegendPills, Panel, BarList, SampleBadge } from '../components/ui'
import { useSectionLoading } from '../lib/hooks'
import { queueCounts, useVisibleSections } from '../lib/sections'
import { categoryName, mean, pctStr, regionName, sum } from '../lib/format'
import { A } from '../strings'
import { uz } from '@/i18n/uz'
import { cn } from '@/lib/utils'

interface RegionRow { id: string; name: string; sales: number; share: number }

export function Dashboard() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const nav = useAppNavigate()
  const loading = useSectionLoading()
  const visible = useVisibleSections()
  const stats = data.dailyStats
  const last = stats[stats.length - 1]
  const prev = stats.slice(-14, -1)
  const delta = (cur: number, arr: number[]) => { const m = mean(arr); return m ? (cur - m) / m : 0 }
  const spark = (pick: (s: typeof last) => number) => stats.slice(-14).map(pick)

  const chart = useMemo(() => stats.slice(-14).map((s) => ({ date: s.date.slice(5).replace('-', '.'), listings: s.listingsSalesTiyin, mall: s.mallSalesTiyin })), [stats])
  const counts = useMemo(() => queueCounts(data, now), [data, now])
  const attention = (Object.keys(A.dashboard.attention) as (keyof typeof A.dashboard.attention)[])
    .map((k) => ({ key: k as AdminSection, label: A.dashboard.attention[k], count: counts[k as AdminSection] ?? 0, to: k === 'products' ? '/products?filter=failed' : `/${k}` }))
    .filter((r) => r.count > 0 && visible.includes(r.key))

  const regions = useMemo<RegionRow[]>(() => {
    const acc = new Map<string, number>()
    for (const s of stats.slice(-14)) for (const [r, v] of Object.entries(s.byRegion)) acc.set(r, (acc.get(r) ?? 0) + (v ?? 0))
    const total = sum([...acc.values()])
    return [...acc.entries()].map(([id, sales]) => ({ id, name: regionName(data, id as RegionId), sales, share: total ? sales / total : 0 })).sort((a, b) => b.sales - a.sales)
  }, [stats, data])
  const regionCols: Column<RegionRow>[] = [
    { key: 'name', header: A.common.region, sortable: true },
    { key: 'sales', header: A.dashboard.sales, sortable: true, align: 'right', render: (r) => <Money tiyin={r.sales} size="sm" compact />, csv: (r) => r.sales / 100 },
    { key: 'share', header: A.dashboard.share, sortable: true, align: 'right', render: (r) => (
      <span className="inline-flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-paper-2"><span className="block h-full rounded-full bg-blue" style={{ width: `${Math.round(r.share * 100)}%` }} /></span><span className="tnum w-10 text-right">{pctStr(r.share)}</span></span>
    ), csv: (r) => Math.round(r.share * 1000) / 10 },
  ]

  const topCats = useMemo(() => {
    const since = dateKey(addDays(now, -30))
    const acc = new Map<string, { n: number; t: number }>()
    for (const l of data.listings) if (l.status === 'sold' && !l.historical && (l.soldAt ?? '') >= since) { const a = acc.get(l.categoryId) ?? { n: 0, t: 0 }; a.n += 1; a.t += l.priceTiyin; acc.set(l.categoryId, a) }
    return [...acc.entries()].map(([id, a]) => ({ label: categoryName(data, id), value: a.t, hint: `${a.n} ${A.dashboard.sold}` })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [data, now])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-5 gap-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={104} className="rounded-card" />)}</div>
        <div className="grid grid-cols-3 gap-4"><Skeleton height={300} className="col-span-2 rounded-card" /><Skeleton height={300} className="rounded-card" /></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(164px,1fr))]">
        <Kpi label={A.dashboard.salesToday} value={last.listingsSalesTiyin + last.mallSalesTiyin} money compact delta={delta(last.listingsSalesTiyin + last.mallSalesTiyin, prev.map((s) => s.listingsSalesTiyin + s.mallSalesTiyin))} deltaLabel={A.dashboard.vsTarget} spark={spark((s) => s.listingsSalesTiyin + s.mallSalesTiyin)} onClick={() => nav('/reports')} />
        <Kpi label={A.dashboard.orders} value={last.orders} delta={delta(last.orders, prev.map((s) => s.orders))} deltaLabel={A.dashboard.vsTarget} spark={spark((s) => s.orders)} onClick={() => nav('/orders?view=today')} />
        <Kpi label={A.dashboard.newListings} value={last.newListings} delta={delta(last.newListings, prev.map((s) => s.newListings))} deltaLabel={A.dashboard.vsTarget} spark={spark((s) => s.newListings)} onClick={() => nav('/pricing')} />
        <Kpi label={A.dashboard.commission} value={last.commissionTiyin} money compact delta={delta(last.commissionTiyin, prev.map((s) => s.commissionTiyin))} deltaLabel={A.dashboard.vsTarget} spark={spark((s) => s.commissionTiyin)} onClick={() => nav('/fees')} />
        <Kpi label={A.dashboard.review} value={last.avgReviewMinutes} suffix={A.common.minutes} invertDelta delta={delta(last.avgReviewMinutes, prev.map((s) => s.avgReviewMinutes))} deltaLabel={A.dashboard.vsTarget} spark={spark((s) => s.avgReviewMinutes)} onClick={() => nav('/reports')} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel eyebrow={A.dashboard.chart14} className="xl:col-span-2" bodyClassName="h-[300px] p-3" actions={<LegendPills items={[{ label: A.dashboard.listings, color: AC.navy }, { label: A.dashboard.mall, color: AC.blue }]} />}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} {...AC_GRID} />
              <XAxis dataKey="date" tick={chartTheme.axisTick} axisLine={chartTheme.axisLine} tickLine={false} />
              <YAxis tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => formatMoneyCompact(v)} />
              <Tooltip cursor={AC_CURSOR} content={({ active, payload, label }) => active && payload?.length ? (
                <div className={chartTheme.tooltipClass}>
                  <div className={chartTheme.tooltipLabelClass}>{label}</div>
                  {payload.map((p) => <div key={String(p.dataKey)} className="flex justify-between gap-4"><span className="text-ink-2">{p.dataKey === 'mall' ? A.dashboard.mall : A.dashboard.listings}</span><span className="tnum">{formatMoney(Number(p.value))}</span></div>)}
                </div>
              ) : null} />
              <Bar dataKey="listings" stackId="a" fill={AC.navy} stroke="var(--card)" strokeWidth={2} />
              <Bar dataKey="mall" stackId="a" fill={AC.blue} stroke="var(--card)" strokeWidth={2} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel eyebrow={uz.admin.needsAttention} padding={false}>
          {attention.length === 0 ? <EmptyState compact icon="check" title={A.dashboard.allClear} /> : (
            <ul className="m-0 list-none divide-y divide-line p-0">
              {attention.map((r) => (
                <li key={r.key}>
                  <button type="button" onClick={() => nav(r.to)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-soft/50">
                    <span className={cn('tnum inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[13px] font-bold', r.key === 'moderation' || r.key === 'returns' ? 'bg-brick-soft text-brick' : 'bg-blue-soft text-blue')}>{r.count}</span>
                    <span className="min-w-0 flex-1 text-[13.5px] text-ink">{r.label}</span>
                    <ChevronRight size={16} strokeWidth={1.75} className="text-ink-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DataTable columns={regionCols} rows={regions} rowKey={(r) => r.id} pageSize={8} exportFilename="viloyatlar" defaultSort={{ key: 'sales', dir: 'desc' }} toolbarLeft={<span className="eyebrow">{A.dashboard.regions}</span>} />
        </div>
        <Panel eyebrow={A.dashboard.topCats} actions={<SampleBadge />}>
          {topCats.length ? <BarList rows={topCats} format={(v) => formatMoney(v, { compact: true })} tone="blue" /> : <EmptyState compact title={A.common.empty} />}
        </Panel>
      </div>
    </div>
  )
}
