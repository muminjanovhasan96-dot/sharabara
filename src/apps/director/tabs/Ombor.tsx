import { useMemo } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Boxes, Coins, Warehouse } from 'lucide-react'
import { Badge } from '@/design'
import { useNow, useStore } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import { computeStock } from '../lib/compute'
import { AdminLink, Bars, CountPill, Empty, IconChip, List, Panel, Row, Stat, compact } from '../components/ui'
import { D, tt } from '../strings'

const cmp = compact
const num = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ')

export function Ombor() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const st = useMemo(() => computeStock(data, now), [data, now])

  return (
    <div className="flex flex-col gap-3 @3xl:gap-4">
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4 @3xl:gap-4">
        <Stat label={D.stock.totalQty} value={st.totalQty} icon={Boxes} chip="blue" suffix={D.pcs} hint={`${st.skus} ${D.stock.skus}`} />
        <Stat label={D.stock.totalValue} value={st.totalValue} money icon={Coins} chip="gold" hint={D.stock.valueHint} />
        <Stat label={D.stock.todayIn} value={st.todayIn} icon={ArrowDownToLine} chip="green" suffix={D.pcs} tone="green" />
        <Stat label={D.stock.todayOut} value={st.todayOut} icon={ArrowUpFromLine} chip="neutral" suffix={D.pcs} />
      </div>

      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @3xl:gap-4">
        {st.warehouses.map((w) => (
          <Panel key={w.id} eyebrow={D.stock.warehouses} title={w.name} actions={<IconChip icon={Warehouse} tone="blue" size={36} />}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="tnum font-display text-[26px] font-extrabold leading-none tracking-[-0.02em] text-ink">{num(w.qty)} <span className="font-body text-[13px] font-medium tracking-normal text-ink-2">{D.pcs}</span></div>
                <div className="mt-1.5 text-[12.5px] text-ink-3">{w.skus} {D.stock.skus} · <span className="tnum font-semibold text-ink">{cmp(w.value)}</span> so’m</div>
              </div>
              <div className="text-right text-[12px] text-ink-3"><span className="tnum text-[15px] font-bold text-ink">{Math.round(w.fill * 100)} %</span> {D.stock.fill}</div>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-paper-2"><div className="h-full rounded-full bg-blue" style={{ width: `${Math.max(2, w.fill * 100)}%` }} /></div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-2 @3xl:gap-4">
        <Panel eyebrow={D.stock.low} hint={D.stock.lowHint} padding={false} actions={<><CountPill n={st.low.length} tone={st.low.some((l) => l.qty === 0) ? 'brick' : 'gold'} /><AdminLink to="/warehouse" /></>}>
          {st.low.length === 0 ? <Empty /> : (
            <List className="px-4">
              {st.low.slice(0, 12).map((l) => (
                <Row key={l.productId} title={l.title} sub={`${l.company} · ${D.stock.min} ${l.min}${l.waiting ? ` · ${tt(D.overview.waitingOrders, { n: l.waiting })}` : ''}`}
                  badge={<Badge size="sm" tone={l.tone}>{l.qty === 0 ? D.overview.outOfStock : `${l.qty} ${D.pcs}`}</Badge>} rightSub={l.daysLeft} />
              ))}
            </List>
          )}
        </Panel>
        <Panel eyebrow={D.stock.incoming} hint={`${st.incoming.length} ta yuk xati`} padding={false} actions={<AdminLink to="/warehouse" />}>
          {st.incoming.length === 0 ? <Empty /> : (
            <List className="px-4">
              {st.incoming.map((r) => (
                <Row key={r.id} title={r.companyName} sub={`${r.id} · ${r.warehouseName} · ${tt(D.stock.lines, { n: r.lines.length })}`} right={cmp(r.totalTiyin)} rightSub={<Badge size="sm" tone="blue" dot>{D.stock.expected} {formatDemoTime(r.expectedAt)}</Badge>} />
              ))}
            </List>
          )}
        </Panel>
        <Panel eyebrow={D.stock.topMoving} hint={D.stock.topMovingHint}>
          <Bars rows={st.topMoving.map((r) => ({ id: r.id, label: r.label, value: r.value, hint: r.hint, right: <span className="font-semibold text-ink">{r.value} {D.pcs}</span> }))} tone="ink" />
        </Panel>
        <Panel eyebrow={D.stock.byCompany} hint={D.stock.byCompanyHint}>
          <Bars rows={st.byCompany.map((r) => ({ id: r.id, label: r.label, value: r.value, right: <span className="font-semibold text-ink">{cmp(r.value)}</span>, hint: `${r.count} ta kirim` }))} tone="gold" />
        </Panel>
      </div>
    </div>
  )
}
