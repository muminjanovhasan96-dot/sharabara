import { BottomSheet, Drawer, Money, Timeline, Badge, type BadgeTone } from '@/design'
import { useStore } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import { ORDER_STATUS_UZ } from '@/domain/machines'
import type { Order, SubOrderStatus } from '@/domain/types'
import { uz } from '@/i18n/uz'
import { orderMoney } from '../lib/compute'
import { useDirector } from '../lib/ctx'
import { AdminLink } from './ui'
import { D } from '../strings'

const SUB_TONE: Partial<Record<SubOrderStatus, BadgeTone>> = { packing: 'gold', packed: 'blue', handed_to_bts: 'blue', in_transit: 'blue', at_branch: 'green', delivered: 'green', payout_scheduled: 'gold', payout_paid: 'ink', cancelled: 'brick', return_requested: 'brick', return_approved: 'brick', return_denied: 'outline', refunded: 'brick' }
export function SubBadge({ status }: { status: SubOrderStatus }) { return <Badge tone={SUB_TONE[status] ?? 'neutral'} size="sm" dot>{uz.orders.status[status]}</Badge> }

const PAY = { payme: 'Payme', click: 'Click', cash: 'Naqd' } as const

export function OrderSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { mode, container } = useDirector()
  const users = useStore((s) => s.data.users)
  const open = Boolean(order)
  const body = order ? <Body order={order} buyer={users.find((u) => u.id === order.buyerId)?.name ?? order.buyerId} /> : null
  const title = order ? `${D.sales.orderDetail} ${order.id}` : ''
  const eyebrow = order ? `${formatDemoTime(order.createdAt)} · ${ORDER_STATUS_UZ[order.status]}` : undefined
  if (mode === 'mobile') return <BottomSheet open={open} onOpenChange={(o) => { if (!o) onClose() }} title={title} eyebrow={eyebrow} snap="auto">{body}</BottomSheet>
  return <Drawer open={open} onOpenChange={(o) => { if (!o) onClose() }} title={title} eyebrow={eyebrow} container={container}>{body}</Drawer>
}

function Body({ order: o, buyer }: { order: Order; buyer: string }) {
  const m = orderMoney(o)
  return (
    <div className="flex flex-col gap-5 pb-2">
      <div className="grid grid-cols-2 gap-3 text-[13.5px]">
        <KV label={D.sales.buyer}>{buyer}</KV>
        <KV label={D.sales.channel}>{D.channel[o.channel]}</KV>
        <KV label={D.sales.payment}>{PAY[o.payment.method]} · {o.payment.escrow === 'held' ? 'escrow' : o.payment.escrow}</KV>
        <KV label={D.sales.delivery}>{uz.checkout.method[o.delivery.method]}</KV>
      </div>
      <section>
        <div className="eyebrow mb-2">{D.sales.items}</div>
        <ul className="m-0 list-none divide-y divide-line p-0">
          {o.subOrders.map((so) => (
            <li key={so.id} className="py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="tnum text-[12px] text-ink-3">{so.id} · {so.sellerName}</span>
                <SubBadge status={so.status} />
              </div>
              {so.items.map((it) => (
                <div key={it.key} className="mt-1 flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="min-w-0 truncate text-ink">{it.title}{it.qty > 1 ? ` × ${it.qty}` : ''}</span>
                  <Money tiyin={it.priceTiyin * it.qty} size="sm" />
                </div>
              ))}
              {so.waybill && <div className="mt-0.5 text-[12px] text-ink-3">BTS {so.waybill}</div>}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="eyebrow mb-2">{D.sales.timeline}</div>
        <Timeline compact steps={o.subOrders[0]?.timeline.map((e, i, arr) => ({ label: `${uz.orders.status[e.status]}${e.note ? ` — ${e.note}` : ''}`, at: formatDemoTime(e.at), done: i < arr.length - 1, active: i === arr.length - 1 })) ?? []} />
      </section>
      <section>
        <div className="eyebrow mb-2">{D.sales.money}</div>
        <dl className="m-0 grid grid-cols-[1fr_auto] gap-y-1.5 text-[14px]">
          <dt className="text-ink-2">{D.sales.items}</dt><dd className="m-0 text-right"><Money tiyin={m.items} size="sm" /></dd>
          <dt className="text-ink-2">{D.sales.delivery}</dt><dd className="m-0 text-right"><Money tiyin={m.delivery} size="sm" /></dd>
          <dt className="text-ink-2">{D.sales.fee}</dt><dd className="m-0 text-right text-gold"><Money tiyin={m.fee} size="sm" className="text-gold" /></dd>
          <dt className="text-ink-2">{D.sales.sellerGets}</dt><dd className="m-0 text-right"><Money tiyin={m.sellerGets} size="sm" /></dd>
          <dt className="border-t border-line pt-1.5 font-semibold text-ink">{D.sales.total}</dt><dd className="m-0 border-t border-line pt-1.5 text-right"><Money tiyin={m.total} size="lg" /></dd>
        </dl>
      </section>
      <AdminLink to={`/orders?id=${o.id}`}>{D.sales.openInAdmin}</AdminLink>
    </div>
  )
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><div className="eyebrow !text-[10px]">{label}</div><div className="truncate text-ink">{children}</div></div>
}
