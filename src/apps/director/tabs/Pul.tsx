import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownToLine, ArrowUpFromLine, LockKeyhole, Percent, PiggyBank, RotateCcw } from 'lucide-react'
import { Badge, chartTheme } from '@/design'
import { useNow, useStore } from '@/store'
import { formatMoneyCompact } from '@/domain/money'
import { PAYOUT_STATUS_UZ } from '@/domain/machines'
import { computeMoney } from '../lib/compute'
import { useDirector } from '../lib/ctx'
import { AdminLink, C, ChartTip, Empty, Legend, List, Panel, Row, Stat, compact } from '../components/ui'
import { D } from '../strings'

const NAMES = { in: D.money.cashIn, out: D.money.cashOut }
const cmp = compact

export function Pul() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const { period } = useDirector()
  const m = useMemo(() => computeMoney(data, now, period), [data, now, period])
  const chart = useMemo(() => m.cashflow.map((d) => ({ ...d, out: -d.out })), [m.cashflow])

  return (
    <div className="flex flex-col gap-3 @3xl:gap-4">
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @3xl:gap-4 @5xl:grid-cols-6">
        <Stat label={D.money.income} value={m.income} money icon={ArrowDownToLine} chip="green" hint={D.money.incomeHint} tone="green" />
        <Stat label={D.money.escrow} value={m.escrow} money icon={LockKeyhole} chip="blue" hint={D.money.escrowHint} />
        <Stat label={D.money.outcome} value={m.outcome} money icon={ArrowUpFromLine} chip="neutral" hint={D.money.outcomeHint} />
        <Stat label={D.money.commission} value={m.commission} money icon={Percent} chip="gold" tone="gold" />
        <Stat label={D.money.refunds} value={m.refunds} money icon={RotateCcw} chip="brick" tone={m.refunds > 0 ? 'brick' : undefined} />
        <Stat label={D.money.net} value={m.net} money icon={PiggyBank} chip="green" tone="green" hint={D.sample} />
      </div>
      <p className="m-0 px-1 text-[12px] leading-snug text-ink-3">{D.money.netFormula}</p>

      <Panel eyebrow={D.money.cashflow} hint={`${D.money.cashIn} yuqorida · ${D.money.cashOut} pastda`} bodyClassName="h-[220px] px-1 pb-2 pt-1 @3xl:h-[260px]"
        actions={<Legend items={[{ label: D.money.cashIn, color: C.blue }, { label: D.money.cashOut, color: C.navy }]} />}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} stackOffset="sign" barCategoryGap="30%">
            <CartesianGrid vertical={false} {...chartTheme.grid} />
            <XAxis dataKey="label" tick={chartTheme.axisTick} axisLine={chartTheme.axisLine} tickLine={false} interval={6} />
            <YAxis tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => formatMoneyCompact(Math.abs(v))} />
            <ReferenceLine y={0} stroke="var(--line-strong)" />
            <Tooltip cursor={{ fill: 'var(--paper-2)' }} content={(p) => <ChartTip {...p} names={NAMES} />} />
            <Bar dataKey="in" stackId="a" fill={C.blue} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="out" stackId="a" fill={C.navy} fillOpacity={0.75} radius={[0, 0, 4, 4]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-2 @3xl:gap-4">
        <Panel eyebrow={D.money.awaiting} hint={D.money.awaitingHint} padding={false} actions={<AdminLink to="/payments" />}>
          {m.awaiting.length === 0 ? <Empty /> : (
            <List className="px-4">
              {m.awaiting.map((p) => (
                <Row key={p.id} title={p.sellerName} sub={`${p.id} · ${D.money.card} •••• ${p.cardLast4}${p.scheduledFor ? ` · ${p.scheduledFor}` : ''}`}
                  badge={<Badge size="sm" tone={p.status === 'awaiting_second_approval' ? 'brick' : p.status === 'scheduled' ? 'gold' : 'neutral'} dot>{PAYOUT_STATUS_UZ[p.status]}</Badge>}
                  right={cmp(p.amountTiyin)} />
              ))}
            </List>
          )}
        </Panel>
        <Panel eyebrow={D.money.settlement} hint={D.periodLong[period]} padding={false} actions={<AdminLink to="/companies" />}>
          {m.settlement.length === 0 ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse whitespace-nowrap text-[13px]">
                <thead>
                  <tr className="text-left text-[11.5px] uppercase tracking-[0.06em] text-ink-3">
                    <th className="px-4 py-2 font-semibold">{D.money.company}</th>
                    <th className="px-2 py-2 text-right font-semibold">{D.money.sales}</th>
                    <th className="px-2 py-2 text-right font-semibold">{D.money.commission}</th>
                    <th className="px-2 py-2 text-right font-semibold">{D.money.toPay}</th>
                    <th className="px-4 py-2 text-right font-semibold">{D.money.pending}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {m.settlement.map((r) => (
                    <tr key={r.id}>
                      <td className="max-w-[160px] px-4 py-2.5">
                        <span className="flex items-center gap-1.5"><span className="truncate font-medium text-ink">{r.name}</span><Badge size="sm" tone="neutral">{Math.round(r.rate * 100)}%</Badge></span>
                      </td>
                      <td className="tnum px-2 py-2.5 text-right font-semibold text-ink">{cmp(r.sales)}</td>
                      <td className="tnum px-2 py-2.5 text-right"><Badge size="sm" tone="gold">{cmp(r.commission)}</Badge></td>
                      <td className="tnum px-2 py-2.5 text-right text-ink">{cmp(r.toPay)}</td>
                      <td className="tnum px-4 py-2.5 text-right">{r.pending ? <Badge size="sm" tone="blue">{cmp(r.pending)}</Badge> : <span className="text-ink-3">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
