import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { Badge, DataTable, EmptyState, Money, ProductImage, chartTheme, type Column } from '@/design'
import { useNow, useStore } from '@/store'
import { uz } from '@/i18n/uz'
import { addDays, dateKey } from '@/domain/clock'
import { formatMoney } from '@/domain/money'
import type { Product, SalesChannel } from '@/domain/types'
import { AC, AC_CURSOR, AC_GRID, LegendPills, Panel } from '../../components/ui'
import { branchOf, pctStr, regionName } from '../../lib/format'
import { imgId } from '../Moderation'
import { A } from '../../strings'
import { CHANNELS, CHANNEL_BG, CHANNEL_COLOR, CHANNEL_TONE, channelLabel, inWh, lastDays, type WhFilter } from './lib'

interface TopRow { p: Product; company: string; sold: number; revenue: number; left: number; byChannel: Record<SalesChannel, number> }

export function SalesTab({ wh }: { wh: WhFilter }) {
  const data = useStore((s) => s.data)
  const now = useNow()
  const S = A.warehouse.sales
  const since = addDays(now, -30)
  const outs = useMemo(() => data.movements.filter((m) => m.kind === 'out' && m.at >= since && inWh(wh, m.warehouseId)), [data.movements, since, wh])

  const perDay = useMemo(() => {
    const days = lastDays(now, 30)
    const rows = days.map((d) => ({ date: d.slice(5).replace('-', '.'), key: d, app: 0, telegram: 0, instagram: 0, offline: 0 }))
    const idx = new Map(days.map((d, i) => [d, i]))
    for (const m of outs) { const i = idx.get(dateKey(m.at)); if (i !== undefined) rows[i][m.channel ?? 'app'] += Math.abs(m.qty) }
    return rows
  }, [outs, now])

  const byRegion = useMemo(() => {
    const acc = new Map<string, number>()
    for (const o of data.orders) {
      if (o.createdAt < since) continue
      for (const so of o.subOrders) {
        if (!['delivered', 'payout_scheduled', 'payout_paid'].includes(so.status)) continue
        const reg = branchOf(data, so.branchId ?? o.delivery.branchId)?.regionId ?? (o.delivery.method === 'courier_tashkent' ? 'toshkent_sh' : undefined)
        if (!reg) continue
        const q = so.items.filter((i) => i.source === 'product').reduce((a, i) => a + i.qty, 0)
        if (q) acc.set(reg, (acc.get(reg) ?? 0) + q)
      }
    }
    return [...acc.entries()].map(([id, qty]) => ({ name: regionName(data, id), qty })).sort((a, b) => b.qty - a.qty).slice(0, 10)
  }, [data, since])

  const top = useMemo<TopRow[]>(() => {
    const m = new Map<string, TopRow>()
    for (const mv of outs) {
      const p = data.products.find((x) => x.id === mv.productId); if (!p) continue
      let r = m.get(p.id)
      if (!r) { r = { p, company: data.companies.find((c) => c.id === p.companyId)?.name ?? '', sold: 0, revenue: 0, left: data.stockLevels.filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty, 0), byChannel: { app: 0, telegram: 0, instagram: 0, offline: 0 } }; m.set(p.id, r) }
      const q = Math.abs(mv.qty); r.sold += q; r.revenue += q * p.priceTiyin; r.byChannel[mv.channel ?? 'app'] += q
    }
    return [...m.values()].sort((a, b) => b.sold - a.sold).slice(0, 15)
  }, [outs, data])

  const channels = useMemo(() => {
    const acc: Record<SalesChannel, { orders: number; revenue: number }> = { app: { orders: 0, revenue: 0 }, telegram: { orders: 0, revenue: 0 }, instagram: { orders: 0, revenue: 0 }, offline: { orders: 0, revenue: 0 } }
    for (const o of data.orders) if (o.createdAt >= since && o.status !== 'cancelled') { acc[o.channel].orders += 1; acc[o.channel].revenue += o.totalTiyin }
    const total = CHANNELS.reduce((a, c) => a + acc[c].revenue, 0) || 1
    return CHANNELS.map((c) => ({ c, ...acc[c], share: acc[c].revenue / total }))
  }, [data.orders, since])
  const online = channels.filter((x) => x.c !== 'offline').reduce((a, x) => a + x.share, 0)

  const tip = ({ active, payload, label }: TooltipContentProps) => active && payload?.length ? (
    <div className={chartTheme.tooltipClass}><div className={chartTheme.tooltipLabelClass}>{String(label ?? '')}</div>{[...payload].reverse().map((p) => <div key={String(p.dataKey)} className="flex justify-between gap-4"><span className="inline-flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{channelLabel(String(p.dataKey) as SalesChannel)}</span><span className="tnum">{Number(p.value)} {uz.app.pcs}</span></div>)}<div className="mt-1 flex justify-between gap-4 border-t border-line pt-1"><span className="text-ink-2">{A.common.total}</span><span className="tnum font-semibold">{payload.reduce((a, p) => a + Number(p.value), 0)}</span></div></div>
  ) : null
  const totalOut = outs.reduce((a, m) => a + Math.abs(m.qty), 0)

  const cols: Column<TopRow>[] = [
    { key: 'title', header: S.product, sortable: true, sortValue: (r) => r.p.title, render: (r) => <span className="flex items-center gap-2"><ProductImage id={imgId(r.p.images[0] ?? '', r.p.id)} className="h-8 w-8 shrink-0" fill={0.85} /><span className="truncate">{r.p.title}</span></span>, csv: (r) => r.p.title },
    { key: 'company', header: S.company, sortable: true, width: 160, render: (r) => <span className="truncate">{r.company}</span> },
    { key: 'sold', header: S.sold, sortable: true, align: 'right', width: 90, render: (r) => <span className="tnum font-semibold">{r.sold}</span> },
    { key: 'revenue', header: S.revenue, sortable: true, align: 'right', width: 140, render: (r) => <Money tiyin={r.revenue} size="sm" />, csv: (r) => r.revenue / 100 },
    { key: 'left', header: S.left, sortable: true, align: 'right', width: 90, render: (r) => <span className={`tnum ${r.left <= 5 ? 'text-brick' : 'text-ink-2'}`}>{r.left}</span> },
    { key: 'share', header: S.share, width: 220, render: (r) => (
      <span className="flex h-2 w-full overflow-hidden rounded-full bg-paper-2" title={CHANNELS.map((c) => `${channelLabel(c)}: ${r.byChannel[c]}`).join(' · ')}>
        {CHANNELS.map((c) => r.byChannel[c] > 0 && <span key={c} className={`${CHANNEL_BG[c]} h-full border-r border-card last:border-r-0`} style={{ width: `${(r.byChannel[c] / r.sold) * 100}%` }} />)}
      </span>
    ), csv: (r) => CHANNELS.map((c) => `${channelLabel(c)} ${r.byChannel[c]}`).join(' | ') },
  ]

  if (outs.length === 0) return <EmptyState icon="chart-column" title={S.noSales} />
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {channels.map((x) => (
          <div key={x.c} className="rounded-card border border-line bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between gap-2"><Badge tone={CHANNEL_TONE[x.c]} dot>{channelLabel(x.c)}</Badge><span className="tnum text-[12.5px] text-ink-3">{pctStr(x.share)} {S.pct}</span></div>
            <div className="mt-2 flex items-baseline gap-1.5"><span className="tnum font-display text-[24px] font-bold text-ink">{x.orders}</span><span className="text-[12.5px] text-ink-3">{S.orders}</span></div>
            <Money tiyin={x.revenue} size="sm" className="text-ink-2" compact />
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper-2"><div className={`h-full rounded-full ${CHANNEL_BG[x.c]}`} style={{ width: `${Math.round(x.share * 100)}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" eyebrow={S.byChannel} title={<span className="tnum text-[13px] font-normal text-ink-2">{S.online} <b className="text-ink">{pctStr(online)}</b> · {S.other} <b className="text-ink">{pctStr(1 - online)}</b> · {totalOut} {uz.app.pcs}</span>} actions={<LegendPills items={CHANNELS.map((c) => ({ label: channelLabel(c), color: CHANNEL_COLOR[c] }))} />} bodyClassName="p-3">
          <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={perDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid vertical={false} {...AC_GRID} />
              <XAxis dataKey="date" tick={chartTheme.axisTick} axisLine={chartTheme.axisLine} tickLine={false} interval={4} />
              <YAxis tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
              <Tooltip cursor={AC_CURSOR} content={tip} />
              {CHANNELS.map((c, i) => <Bar key={c} dataKey={c} stackId="ch" fill={CHANNEL_COLOR[c]} stroke="var(--card)" strokeWidth={1} radius={i === CHANNELS.length - 1 ? [6, 6, 0, 0] : 0} />)}
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel className="xl:col-span-2" eyebrow={S.byRegion} bodyClassName="p-3">
          <div className="h-[280px]">{byRegion.length === 0 ? <div className="flex h-full items-center justify-center text-[13px] text-ink-3">{S.noSales}</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegion} layout="vertical" margin={{ top: 4, right: 32, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid horizontal={false} {...AC_GRID} />
                <XAxis type="number" tick={chartTheme.axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={112} />
                <Tooltip cursor={AC_CURSOR} content={({ active, payload }) => active && payload?.[0] ? <div className={chartTheme.tooltipClass}><div className={chartTheme.tooltipLabelClass}>{payload[0].payload.name}</div><div className="tnum">{payload[0].payload.qty} {uz.app.pcs}</div></div> : null} />
                <Bar dataKey="qty" fill={AC.blue} radius={[0, 6, 6, 0]} label={{ position: 'right', fill: 'var(--ink-2)', fontSize: 11, formatter: (v: unknown) => String(v) }} />
              </BarChart>
            </ResponsiveContainer>
          )}</div>
        </Panel>
      </div>
      <DataTable columns={cols} rows={top} rowKey={(r) => r.p.id} pageSize={15} exportFilename="top-tovarlar"
        toolbarLeft={<><span className="eyebrow">{S.top}</span><span className="tnum text-[12.5px] text-ink-3">{formatMoney(top.reduce((a, r) => a + r.revenue, 0), { compact: true })}</span></>}
        toolbarRight={<span className="flex flex-wrap items-center gap-2 text-[12px] text-ink-2">{CHANNELS.map((c) => <span key={c} className="inline-flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${CHANNEL_BG[c]}`} />{channelLabel(c)}</span>)}</span>}
        emptyState={<EmptyState compact icon="chart-column" title={S.noSales} />} />
    </div>
  )
}
