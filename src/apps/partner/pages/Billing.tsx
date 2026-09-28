import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Printer } from 'lucide-react'
import { Button, Card, CardHeader, DataTable, EmptyState, Ledger, LedgerRow, Modal, Money, type Column } from '@/design'
import { useData, useNow } from '@/store'
import { formatDemoDate, formatDemoTime } from '@/domain/clock'
import { formatMoney } from '@/domain/money'
import type { Payout } from '@/domain/types'
import { useCompany, useCompanySubs, useListLoading, type SubRow } from '../hooks'
import { usePrintRoot } from '../printRoot'
import { P } from '../strings'
import { PageHeader, PayoutBadge, fmtDate } from '../ui'

const COUNTED = new Set(['delivered', 'payout_scheduled', 'payout_paid', 'return_denied'])
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

function AktDocument({ rows, company, now, print = false }: { rows: SubRow[]; company: { name: string; inn: string; commissionRate: number }; now: string; print?: boolean }) {
  const d = new Date(now)
  const sum = rows.reduce((a, r) => a + r.so.subtotalTiyin, 0)
  const fee = rows.reduce((a, r) => a + (r.so.feeOverride?.amountTiyin ?? r.so.feeTiyin), 0)
  const cls = print ? 'text-black' : 'text-ink'
  return (
    <article className={`${print ? 'bg-white p-[12mm]' : 'rounded-[6px] border border-line bg-[#fffdf7] p-8 shadow-soft'} font-body text-[13px] leading-snug ${cls}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
      <header className="flex items-start justify-between border-b-2 border-current pb-3">
        <div><div className="font-display text-[22px] font-bold uppercase tracking-wide">SHARA-BARA</div><div className="text-[11px] uppercase tracking-[0.18em] opacity-70">{P.billing.aktSharabara} · Toshkent</div></div>
        <div className="text-right"><div className="font-display text-[16px] font-bold">{P.billing.aktTitle}</div><div className="opacity-70">{P.billing.aktNo} {d.getFullYear()}-{String(d.getMonth() + 1).padStart(2, '0')}/{company.inn.replace(/\s/g, '').slice(-4)}</div><div className="opacity-70">{fmtDate(now)}</div></div>
      </header>
      <section className="mt-4 grid grid-cols-2 gap-6">
        <div><div className="text-[10.5px] uppercase tracking-[0.18em] opacity-60">{P.billing.aktParties}</div><div className="mt-1 font-semibold">{P.billing.aktSharabara}</div><div className="opacity-80">STIR 309 771 204 · Toshkent sh., Amir Temur ko’chasi, 1</div><div className="mt-2 font-semibold">{P.billing.aktCompany}: {company.name}</div><div className="opacity-80">STIR {company.inn} · komissiya {Math.round(company.commissionRate * 100)}%</div></div>
        <div className="text-right"><div className="text-[10.5px] uppercase tracking-[0.18em] opacity-60">{P.billing.aktPeriod}</div><div className="mt-1 font-semibold">01–{String(d.getDate()).padStart(2, '0')} {MONTHS[d.getMonth()]} {d.getFullYear()}</div><div className="opacity-80">{rows.length} ta yetkazilgan buyurtma</div></div>
      </section>
      <table className="mt-5 w-full border-collapse text-[12px]">
        <thead><tr className="border-b border-current text-left text-[10.5px] uppercase tracking-[0.14em] opacity-70"><th className="py-1.5 pr-2">{P.billing.aktTable.date}</th><th className="py-1.5 pr-2">{P.billing.aktTable.order}</th><th className="py-1.5 pr-2">{P.billing.aktTable.item}</th><th className="py-1.5 pr-2 text-right">{P.billing.aktTable.sum}</th><th className="py-1.5 pr-2 text-right">{P.billing.aktTable.fee}</th><th className="py-1.5 text-right">{P.billing.aktTable.net}</th></tr></thead>
        <tbody>
          {rows.map((r) => { const f = r.so.feeOverride?.amountTiyin ?? r.so.feeTiyin; return (
            <tr key={r.so.id} className="border-b border-current/20"><td className="py-1.5 pr-2 whitespace-nowrap">{fmtDate(r.o.createdAt)}</td><td className="py-1.5 pr-2 font-mono text-[11px]">{r.o.id}</td><td className="max-w-[260px] truncate py-1.5 pr-2">{r.so.items.map((i) => i.title).join(', ')}</td><td className="py-1.5 pr-2 text-right whitespace-nowrap">{formatMoney(r.so.subtotalTiyin, { withCurrency: false })}</td><td className="py-1.5 pr-2 text-right whitespace-nowrap">−{formatMoney(f, { withCurrency: false })}</td><td className="py-1.5 text-right whitespace-nowrap font-medium">{formatMoney(r.so.subtotalTiyin - f, { withCurrency: false })}</td></tr>
          ) })}
          {rows.length === 0 && <tr><td colSpan={6} className="py-4 text-center opacity-60">{P.billing.empty}</td></tr>}
        </tbody>
        <tfoot><tr className="border-t-2 border-current font-semibold"><td colSpan={3} className="py-2 pr-2">{P.billing.aktTotal}</td><td className="py-2 pr-2 text-right whitespace-nowrap">{formatMoney(sum, { withCurrency: false })}</td><td className="py-2 pr-2 text-right whitespace-nowrap">−{formatMoney(fee, { withCurrency: false })}</td><td className="py-2 text-right whitespace-nowrap">{formatMoney(sum - fee)}</td></tr></tfoot>
      </table>
      <section className="mt-10 grid grid-cols-2 gap-10 text-[12px]">
        <div><div className="border-b border-current pb-8 opacity-70">{P.billing.aktSign1}</div><div className="mt-1 flex justify-between opacity-60"><span>{P.billing.aktSign}</span><span>M.O’.</span></div></div>
        <div><div className="border-b border-current pb-8 opacity-70">{P.billing.aktSign2} — {company.name}</div><div className="mt-1 flex justify-between opacity-60"><span>{P.billing.aktSign}</span><span>M.O’.</span></div></div>
      </section>
      <p className="mt-6 text-[10.5px] opacity-60">{P.billing.aktNote}</p>
    </article>
  )
}

export function Billing() {
  const c = useCompany()
  const now = useNow()
  const subs = useCompanySubs(c.id)
  const payouts = useData((d) => d.payouts)
  const printRoot = usePrintRoot()
  const loading = useListLoading(c.id)
  const [akt, setAkt] = useState(false)
  const [printing, setPrinting] = useState(false)

  const mine = useMemo(() => payouts.filter((p) => p.sellerKey === `c:${c.id}`), [payouts, c.id])
  const monthKey = now.slice(0, 7)
  const monthRows = useMemo(() => subs.filter((r) => r.o.createdAt.slice(0, 7) === monthKey && COUNTED.has(r.so.status)).sort((a, b) => a.o.createdAt.localeCompare(b.o.createdAt)), [subs, monthKey])
  const sales = monthRows.reduce((a, r) => a + r.so.subtotalTiyin, 0)
  const fee = monthRows.reduce((a, r) => a + (r.so.feeOverride?.amountTiyin ?? r.so.feeTiyin), 0)

  const doPrint = () => {
    setPrinting(true)
    setTimeout(() => { window.print(); setTimeout(() => setPrinting(false), 500) }, 60)
  }

  const columns: Column<Payout>[] = [
    { key: 'id', header: '№', width: 110, render: (p) => <span className="font-mono text-[12px]">{p.id}</span> },
    { key: 'status', header: P.billing.status, sortable: true, width: 170, csv: (p) => P.billing.payoutStatus[p.status], render: (p) => <PayoutBadge status={p.status} /> },
    { key: 'amountTiyin', header: P.billing.amount, sortable: true, align: 'right', width: 160, csv: (p) => p.amountTiyin / 100, render: (p) => <Money tiyin={p.amountTiyin} size="sm" className="font-medium" /> },
    { key: 'orders', header: P.billing.orders, align: 'right', width: 110, csv: (p) => p.subOrderIds.length, render: (p) => <span className="tnum">{p.subOrderIds.length}</span> },
    { key: 'scheduledFor', header: P.billing.scheduled, sortable: true, width: 150, render: (p) => <span className="tnum text-ink-2">{p.scheduledFor ? formatDemoDate(`${p.scheduledFor}T12:00:00`) : '—'}</span> },
    { key: 'paidAt', header: P.billing.paid, sortable: true, width: 150, render: (p) => <span className="tnum text-ink-2">{p.paidAt ? formatDemoTime(p.paidAt) : '—'}</span> },
    { key: 'cardLast4', header: P.billing.card, width: 110, render: (p) => <span className="font-mono text-[12px] text-ink-2">**** {p.cardLast4}</span> },
  ]

  return (
    <div>
      <PageHeader eyebrow={c.name} help={P.help.billing} title={P.billing.title} actions={<Button variant="gold" leading={<FileText />} onClick={() => setAkt(true)}>{P.billing.aktBtn}</Button>} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <DataTable<Payout> columns={columns} rows={mine} rowKey={(p) => p.id} loading={loading} pageSize={10} exportFilename={`${c.id}-tolovlar`} defaultSort={{ key: 'status', dir: 'asc' }}
          emptyState={<EmptyState compact icon="wallet" title={P.billing.empty} hint={P.billing.emptyHint} />} toolbarLeft={<span className="eyebrow">{P.billing.payouts}</span>} />
        <Card padding="md" className="self-start">
          <CardHeader title={P.billing.commission} eyebrow={`${MONTHS[new Date(now).getMonth()]} ${new Date(now).getFullYear()}`} />
          <Ledger>
            <LedgerRow label={P.billing.rate} value={`${Math.round(c.commissionRate * 100)}%`} />
            <LedgerRow label={P.billing.salesMonth} value={<Money tiyin={sales} />} sub={`${monthRows.length} ta yetkazilgan buyurtma`} />
            <LedgerRow label={P.billing.commissionSum} value={<Money tiyin={-fee} />} tone="brick" sub={`${Math.round(c.commissionRate * 100)}% × ${formatMoney(sales)}`} />
            <LedgerRow label={P.billing.net} value={<Money tiyin={sales - fee} />} emphasis />
          </Ledger>
        </Card>
      </div>

      <Modal open={akt} onOpenChange={setAkt} size="lg" title={P.billing.akt} description={`${c.name} · ${formatDemoDate(now)}`}
        footer={<><Button variant="secondary" onClick={() => setAkt(false)}>{P.common.close}</Button><Button variant="gold" leading={<Printer />} onClick={doPrint}>{P.billing.pdf}</Button></>}>
        <div className="scroll-thin max-h-[60vh] overflow-auto rounded-[8px] bg-paper-2 p-3"><AktDocument rows={monthRows} company={c} now={now} /></div>
      </Modal>
      {printing && printRoot && createPortal(<><style>{'@media print { @page { size: A4; margin: 10mm } }'}</style><AktDocument rows={monthRows} company={c} now={now} print /></>, printRoot)}
    </div>
  )
}
