import { useMemo, useState } from 'react'
import { CalendarCheck, FileText, Landmark } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, Money, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, type Column } from '@/design'
import { useNow, useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { TID } from '@/lib/testids'
import { needsSecondApproval } from '@/domain/machines'
import type { Company, Order, Payout, Transaction } from '@/domain/types'
import { AdminConfirm, AdminModal, EscrowBadge, IdLink, Kpi, PayoutStatusBadge, ProviderBadge, SampleBadge, SubStatusBadge } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useSectionLoading } from '../lib/hooks'
import { fmtTime, pctStr, staffName, sum, userName } from '../lib/format'
import { A } from '../strings'

export function Payments() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const access = useAccess('payments')
  const staffId = useStore((s) => s.session.staffId)
  const loading = useSectionLoading()
  const { run, pending } = useAct()
  const [tab, setTab] = useState('payouts')
  const [payday, setPayday] = useState(false)
  const [act, setAct] = useState<Company | null>(null)

  const income = useMemo(() => data.transactions.filter((t) => t.kind === 'payment_in'), [data.transactions])
  const escrow = useMemo(() => data.orders.filter((o) => o.payment.escrow === 'held'), [data.orders])
  const escrowSum = sum(escrow.map((o) => o.totalTiyin))
  const pendingCount = data.payouts.filter((p) => p.status === 'pending' || p.status === 'scheduled').length
  const month = now.slice(0, 7)
  const companyRows = useMemo(() => data.companies.map((c) => {
    const subs = data.orders.filter((o) => o.status !== 'cancelled' && o.createdAt.startsWith(month)).flatMap((o) => o.subOrders).filter((so) => so.sellerKey === `c:${c.id}` && so.status !== 'cancelled')
    const sales = sum(subs.map((s) => s.subtotalTiyin)); const fee = sum(subs.map((s) => s.feeOverride?.amountTiyin ?? s.feeTiyin))
    return { c, orders: subs.length, sales, fee, net: sales - fee }
  }), [data.companies, data.orders, month])

  const txCols: Column<Transaction>[] = [
    { key: 'id', header: A.common.id, sortable: true, width: 110, render: (t) => <span className="tnum">{t.id}</span> },
    { key: 'at', header: A.common.time, sortable: true, width: 130, render: (t) => <span className="text-ink-2">{fmtTime(t.at)}</span> },
    { key: 'provider', header: A.payments.provider, sortable: true, width: 100, render: (t) => <ProviderBadge p={t.provider} />, csv: (t) => t.provider ?? '' },
    { key: 'amountTiyin', header: A.common.amount, sortable: true, align: 'right', width: 140, render: (t) => <Money tiyin={t.amountTiyin} size="sm" />, csv: (t) => t.amountTiyin / 100 },
    { key: 'refId', header: A.payments.ref, width: 110, render: (t) => t.refId.startsWith('O-') && data.orders.some((o) => o.id === t.refId) ? <IdLink to={`/orders?id=${t.refId}`}>{t.refId}</IdLink> : <span className="tnum text-ink-2">{t.refId}</span> },
    { key: 'status', header: A.common.status, sortable: true, width: 120, render: (t) => <Badge tone={t.status === 'ok' ? 'green' : t.status === 'pending' ? 'gold' : 'brick'} dot>{A.common.txStatus[t.status]}</Badge>, csv: (t) => t.status },
    { key: 'note', header: A.common.note, render: (t) => <span className="truncate text-ink-2" title={t.note}>{t.note}</span> },
  ]
  const escrowCols: Column<Order>[] = [
    { key: 'id', header: A.common.id, sortable: true, width: 100, render: (o) => <IdLink to={`/orders?id=${o.id}`}>{o.id}</IdLink> },
    { key: 'createdAt', header: A.common.date, sortable: true, width: 130, render: (o) => <span className="text-ink-2">{fmtTime(o.createdAt)}</span> },
    { key: 'buyerId', header: A.common.buyer, render: (o) => userName(data, o.buyerId), csv: (o) => userName(data, o.buyerId) },
    { key: 'totalTiyin', header: A.common.total, sortable: true, align: 'right', width: 140, render: (o) => <Money tiyin={o.totalTiyin} size="sm" />, csv: (o) => o.totalTiyin / 100 },
    { key: 'escrow', header: A.orders.escrow, width: 150, render: (o) => <EscrowBadge status={o.payment.escrow} size="sm" />, csv: (o) => o.payment.escrow },
    { key: 'subs', header: A.orders.subOrders, render: (o) => <span className="flex gap-1">{o.subOrders.map((so) => <SubStatusBadge key={so.id} status={so.status} size="sm" />)}</span>, csv: (o) => o.subOrders.map((s) => s.status).join('|') },
  ]
  const payoutCols: Column<Payout>[] = [
    { key: 'id', header: A.common.id, sortable: true, width: 100, render: (p) => <span className="tnum font-medium">{p.id}</span> },
    { key: 'sellerName', header: A.common.seller, sortable: true, render: (p) => <span>{p.sellerName}<span className="ml-1 text-[11px] text-ink-3">{p.sellerKey.startsWith('c:') ? A.common.source.product : A.common.source.listing}</span></span> },
    { key: 'amountTiyin', header: A.common.amount, sortable: true, align: 'right', width: 150, render: (p) => <Money tiyin={p.amountTiyin} size="sm" />, csv: (p) => p.amountTiyin / 100 },
    { key: 'status', header: A.common.status, sortable: true, width: 200, render: (p) => <span className="flex items-center gap-1.5"><PayoutStatusBadge status={p.status} />{p.status === 'awaiting_second_approval' && <Badge tone="brick" size="sm">{A.payments.dual}</Badge>}{p.status === 'pending' && needsSecondApproval(p.amountTiyin) && <Badge tone="outline" size="sm">{A.payments.dual}</Badge>}</span>, csv: (p) => p.status },
    { key: 'approvals', header: A.payments.approvals, width: 160, render: (p) => p.approvals.length ? <span className="text-[12.5px] text-ink-2">{p.approvals.map((a) => staffName(data, a.by)).join(', ')}</span> : <span className="text-ink-3">—</span>, csv: (p) => p.approvals.length },
    { key: 'scheduledFor', header: A.payments.scheduledFor, sortable: true, width: 110, render: (p) => <span className="tnum text-ink-2">{p.paidAt ? fmtTime(p.paidAt) : p.scheduledFor ?? '—'}</span> },
    { key: 'cardLast4', header: A.payments.card, width: 90, render: (p) => <span className="tnum text-ink-2">****{p.cardLast4}</span> },
    { key: 'act', header: A.common.actions, width: 190, hideable: false, render: (p) => {
      const mine = p.approvals.some((a) => a.by === staffId)
      return (
        <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {p.status === 'pending' && <Button size="sm" variant="secondary" leading={<CalendarCheck strokeWidth={1.75} />} disabled={!access.edit} loading={pending === p.id} onClick={() => run(p.id, () => api.finance.schedulePayout(p.id), A.payments.scheduled)}>{A.payments.schedule}</Button>}
          {p.status === 'awaiting_second_approval' && <Button size="sm" variant="secondary" disabled={!access.approve || mine} title={mine ? A.payments.sameStaff : undefined} loading={pending === p.id} onClick={() => run(p.id, () => api.finance.secondApprove(p.id), A.payments.approved)}>{A.payments.second}</Button>}
          {p.status === 'scheduled' && <Button size="sm" variant="gold" leading={<Landmark strokeWidth={1.75} />} disabled={!access.approve} loading={pending === p.id} onClick={() => run(p.id, () => api.finance.payOut(p.id), A.payments.paid)}>{A.payments.pay}</Button>}
        </span>
      )
    } },
  ]
  type CRow = (typeof companyRows)[number]
  const companyCols: Column<CRow>[] = [
    { key: 'name', header: uz.admin.sections.companies, sortable: true, sortValue: (r) => r.c.name, render: (r) => <IdLink to={`/companies?id=${r.c.id}`}>{r.c.name}</IdLink>, csv: (r) => r.c.name },
    { key: 'orders', header: A.payments.orders, sortable: true, align: 'right', width: 110 },
    { key: 'sales', header: A.payments.salesMonth, sortable: true, align: 'right', width: 150, render: (r) => <Money tiyin={r.sales} size="sm" />, csv: (r) => r.sales / 100 },
    { key: 'fee', header: A.payments.commission, sortable: true, align: 'right', width: 150, render: (r) => <span className="inline-flex flex-col items-end leading-tight"><Money tiyin={r.fee} size="sm" /><span className="text-[11px] text-ink-3">{pctStr(r.c.commissionRate, 1)}</span></span>, csv: (r) => r.fee / 100 },
    { key: 'net', header: A.payments.net, sortable: true, align: 'right', width: 150, render: (r) => <Money tiyin={r.net} size="sm" />, csv: (r) => r.net / 100 },
    { key: 'act', header: '', width: 100, hideable: false, render: (r) => <Button size="sm" variant="secondary" leading={<FileText strokeWidth={1.75} />} onClick={(e) => { e.stopPropagation(); setAct(r.c) }}>{A.payments.act}</Button> },
  ]

  if (loading) return <div className="flex flex-col gap-4 p-5"><Skeleton height={44} width={520} className="rounded-[12px]" /><Skeleton height={420} className="rounded-card" /></div>
  const actRow = act ? companyRows.find((r) => r.c.id === act.id) : undefined

  return (
    <div className="flex flex-col gap-4 p-5">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="income" count={income.length}>{A.payments.tabs.income}</TabsTrigger>
          <TabsTrigger value="escrow" count={escrow.length}>{A.payments.tabs.escrow}</TabsTrigger>
          <TabsTrigger value="payouts" count={pendingCount}>{A.payments.tabs.payouts}</TabsTrigger>
          <TabsTrigger value="companies">{A.payments.tabs.companies}</TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="pt-4">
          <DataTable columns={txCols} rows={income} rowKey={(t) => t.id} pageSize={15} exportFilename="kirim" defaultSort={{ key: 'at', dir: 'desc' }} />
        </TabsContent>
        <TabsContent value="escrow" className="flex flex-col gap-4 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <Kpi label={A.payments.heldTotal} value={escrowSum} money compact />
            <Kpi label={A.payments.heldCount} value={escrow.length} />
          </div>
          <DataTable columns={escrowCols} rows={escrow} rowKey={(o) => o.id} pageSize={12} exportFilename="escrow" defaultSort={{ key: 'createdAt', dir: 'desc' }} emptyState={<EmptyState compact title={A.common.empty} />} />
        </TabsContent>
        <TabsContent value="payouts" className="pt-4">
          <DataTable columns={payoutCols} rows={data.payouts} rowKey={(p) => p.id} pageSize={12} exportFilename="tolovlar" defaultSort={{ key: 'status', dir: 'asc' }}
            toolbarLeft={<span className="tnum text-[12.5px] text-ink-2">{pendingCount} {A.payments.pendingBadge}</span>}
            toolbarRight={<Button data-testid={TID.aPayday} size="sm" variant="gold" leading={<CalendarCheck strokeWidth={1.75} />} disabled={!access.approve} loading={pending === 'payday'} onClick={() => setPayday(true)}>{A.payments.payday}</Button>}
            emptyState={<EmptyState compact icon="wallet" title={A.payments.emptyPayouts} />} />
        </TabsContent>
        <TabsContent value="companies" className="pt-4">
          <DataTable columns={companyCols} rows={companyRows} rowKey={(r) => r.c.id} pageSize={10} exportFilename="kompaniyalar-hisob" toolbarLeft={<><span className="eyebrow">{A.payments.tabs.companies} · {month}</span><SampleBadge /></>} />
        </TabsContent>
      </Tabs>
      <AdminConfirm open={payday} onOpenChange={setPayday} title={A.payments.payday} description={A.payments.paydayConfirm} confirmLabel={A.payments.payday}
        onConfirm={async () => { setPayday(false); await run('payday', () => api.demo.payday(), A.payments.paydayDone) }} />
      <AdminModal open={!!act} onOpenChange={(o) => !o && setAct(null)} title={A.payments.actTitle} description={act ? `${act.name} · INN ${act.inn} · ${month}` : undefined} size="md"
        footer={<Button variant="secondary" onClick={() => setAct(null)}>{A.common.close}</Button>}>
        {actRow && (
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-line">
              <tr><td className="py-2 text-ink-2">{A.payments.orders}</td><td className="tnum py-2 text-right">{actRow.orders}</td></tr>
              <tr><td className="py-2 text-ink-2">{A.payments.salesMonth}</td><td className="py-2 text-right"><Money tiyin={actRow.sales} size="sm" /></td></tr>
              <tr><td className="py-2 text-ink-2">{A.payments.commission} ({pctStr(actRow.c.commissionRate, 1)})</td><td className="py-2 text-right"><Money tiyin={-actRow.fee} size="sm" /></td></tr>
              <tr className="font-display text-[15px] font-bold text-ink"><td className="py-2">{A.payments.net}</td><td className="py-2 text-right"><Money tiyin={actRow.net} size="md" /></td></tr>
            </tbody>
          </table>
        )}
      </AdminModal>
    </div>
  )
}
