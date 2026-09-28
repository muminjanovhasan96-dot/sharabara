import { useEffect, useMemo, useState } from 'react'
import { Check, PackageCheck, ScanLine } from 'lucide-react'
import { Badge, Button, Card, Countdown, EmptyState, Input, SealBurst, Skeleton } from '@/design'
import { toast } from '../toast'
import { api } from '@/api'
import { useData, useNow } from '@/store'
import { formatDemoTime, hoursUntil, setHour, manifestLabel } from '@/domain/clock'
import { t } from '@/i18n/uz'
import { TID } from '@/lib/testids'
import { cn } from '@/lib/utils'
import { useAllSubs, useListLoading, useTodayManifest } from '../hooks'
import { ensureWaybills } from '../localApi'
import { B } from '../strings'

const ACCEPTED = new Set(['in_transit', 'at_branch', 'delivered', 'payout_scheduled', 'payout_paid', 'return_requested', 'return_approved', 'return_denied', 'refunded'])

export function Today({ narrow }: { narrow: boolean }) {
  const m = useTodayManifest()
  const now = useNow()
  const regions = useData((d) => d.regions)
  const subs = useAllSubs()
  const loading = useListLoading(m?.id ?? 'none')
  const [waybill, setWaybill] = useState('')
  const [busy, setBusy] = useState(false)
  const [burst, setBurst] = useState<string | null>(null)

  const needsWaybills = Boolean(m && m.status !== 'picked_up' && m.subOrderIds.some((id) => !subs.find((r) => r.so.id === id)?.so.waybill))
  useEffect(() => { if (m && needsWaybills) ensureWaybills(m.id) }, [m, needsWaybills])

  const rows = useMemo(() => (m ? m.subOrderIds.map((id) => subs.find((r) => r.so.id === id)).filter((r): r is NonNullable<typeof r> => Boolean(r)) : []), [m, subs])
  const acceptedCount = rows.filter((r) => ACCEPTED.has(r.so.status)).length
  const afterCutoff = hoursUntil(now, 17) <= 0
  const canAccept = Boolean(m) && m!.status !== 'picked_up' && (m!.status === 'closed' || afterCutoff)
  const regionName = (id: string) => regions.find((r) => r.id === id)?.name ?? id

  const acceptAll = async () => {
    if (!m) return
    setBusy(true)
    try { await api.logistics.btsAcceptManifest(m.id); setBurst(t(B.today.acceptedSub, { n: m.subOrderIds.length })) }
    catch (e) { toast.error(e instanceof Error ? e.message : B.common.error) } finally { setBusy(false) }
  }
  const scan = async () => {
    if (!m) return
    const wb = waybill.trim().toUpperCase()
    if (!wb) return
    const row = rows.find((r) => r.so.waybill?.toUpperCase() === wb)
    if (!row) { toast.error(B.today.scanNotFound, { description: wb }); return }
    if (ACCEPTED.has(row.so.status)) { toast.info(B.today.scanAlready, { description: wb }); setWaybill(''); return }
    setBusy(true)
    try {
      const r = await api.logistics.btsAcceptManifest(m.id, [row.so.waybill!])
      setWaybill('')
      if (r.status === 'picked_up') setBurst(t(B.today.acceptedSub, { n: m.subOrderIds.length }))
      else toast.success(B.today.scanOk, { description: `${wb} · ${row.so.items[0].title}` })
    } catch (e) { toast.error(e instanceof Error ? e.message : B.common.error) } finally { setBusy(false) }
  }

  if (!loading && !m) return <EmptyState icon="truck" title={B.today.noManifest} hint={B.today.noManifestHint} />

  const statusTone = m?.status === 'picked_up' ? 'green' : m?.status === 'closed' ? 'gold' : 'neutral'
  const statusLabel = m?.status === 'picked_up' ? B.today.statusPicked : m?.status === 'closed' ? B.today.statusClosed : B.today.statusOpen

  return (
    <div className="relative">
      <div className={cn('grid gap-5', narrow ? 'grid-cols-1' : 'grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]')}>
        <Card padding="lg" className="flex flex-col gap-5">
          {loading || !m ? <><Skeleton width={160} height={12} /><Skeleton width={280} height={36} /><Skeleton height={120} /></> : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><div className="eyebrow">{B.today.eyebrow} · {manifestLabel(m.id)}</div>
                  <h2 className="m-0 mt-1 font-display text-[28px] leading-tight">
                    {m.status === 'open' ? (afterCutoff ? B.today.afterCutoff : B.today.packing) : m.status === 'closed' ? B.today.closed : B.today.pickedUp}
                  </h2>
                  {m.status === 'open' && !afterCutoff && <div className="mt-2 flex items-center gap-2 text-[16px]"><Countdown target={setHour(now, 17, 0)} now={now} suffix={B.today.left} className="text-[22px]" /><span className="text-ink-3">· {B.today.packingHint}</span></div>}
                  {m.status !== 'open' && <div className="mt-1 text-[15px] text-ink-2">{m.closedAt && `${B.today.closedAt}: ${formatDemoTime(m.closedAt)}`}{m.pickedUpAt && ` · ${B.today.pickedAt}: ${formatDemoTime(m.pickedUpAt)}`}</div>}
                </div>
                <Badge tone={statusTone} dot className="h-8 px-3 text-[14px]">{statusLabel}</Badge>
              </div>
              <div className={cn('grid gap-4', narrow ? 'grid-cols-1' : 'grid-cols-[auto_1fr]')}>
                <div className="rounded-card bg-blue-soft px-6 py-4 text-center"><div className="eyebrow !text-blue">{B.today.count}</div><div className="tnum font-display text-[56px] leading-none tracking-[-0.03em] text-ink">{m.subOrderIds.length}</div><div className="mt-1 text-[14px] text-ink-2">{t(B.today.ticked, { a: acceptedCount, n: m.subOrderIds.length })}</div></div>
                <div><div className="eyebrow mb-2">{B.today.byRegion}</div>
                  <ul className="m-0 grid list-none gap-x-6 gap-y-1 p-0 sm:grid-cols-2">
                    {Object.entries(m.byRegion).sort((a, b) => b[1] - a[1]).map(([r, n]) => <li key={r} className="flex items-baseline justify-between border-b border-line py-1.5 text-[16px]"><span>{regionName(r)}</span><span className="tnum font-semibold">{n}</span></li>)}
                    {Object.keys(m.byRegion).length === 0 && <li className="text-ink-3">—</li>}
                  </ul>
                </div>
              </div>
              <Button data-testid={TID.bAccept} size="lg" variant={canAccept ? 'gold' : 'secondary'} fullWidth disabled={!canAccept} loading={busy} onClick={() => void acceptAll()} leading={<PackageCheck />} className="!h-16 !text-[18px]">
                {m.status === 'picked_up' ? B.today.accepted : B.today.acceptAll}
              </Button>
            </>
          )}
        </Card>

        <Card padding="lg" className="flex flex-col gap-4">
          <div className="flex items-center gap-2"><span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-soft text-blue"><ScanLine size={20} strokeWidth={1.75} aria-hidden="true" /></span><h3 className="m-0 font-display text-[20px]">{B.today.scan}</h3></div>
          <p className="m-0 text-[14px] text-ink-2">{B.today.scanHint}</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void scan() }}>
            <Input size="lg" value={waybill} onChange={(e) => setWaybill(e.target.value)} placeholder={B.today.scanPlaceholder} aria-label={B.today.scanHint} className="font-mono uppercase" disabled={!m || m.status === 'picked_up'} />
            <Button type="submit" size="lg" variant="gold" disabled={!waybill.trim() || !m || m.status === 'picked_up'} loading={busy} className="shrink-0">{B.today.scanBtn}</Button>
          </form>
          <div className="eyebrow">{B.today.checklist} · {t(B.today.ticked, { a: acceptedCount, n: rows.length })}</div>
          {loading ? <div className="flex flex-col gap-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={44} />)}</div> : (
            <ul className="scroll-thin m-0 max-h-[420px] list-none overflow-auto divide-y divide-line p-0">
              {rows.map(({ so }) => { const done = ACCEPTED.has(so.status); return (
                <li key={so.id} className="flex items-center gap-3 py-2.5">
                  <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px]', done ? 'border-green bg-green text-white' : 'border-line-strong bg-card')} aria-hidden="true">{done && <Check size={16} strokeWidth={2.5} />}</span>
                  <button type="button" onClick={() => setWaybill(so.waybill ?? '')} className={cn('min-w-0 flex-1 rounded-[6px] text-left focus-visible:ring-2 focus-visible:ring-blue', done && 'text-ink-3')}>
                    <span className="block font-mono text-[15px] font-medium">{so.waybill ?? '—'}</span>
                    <span className="clamp-1 block text-[13px] text-ink-3">{so.items.map((i) => i.title).join(', ')}</span>
                  </button>
                </li>
              ) })}
              {rows.length === 0 && <li className="py-6 text-center text-ink-3">—</li>}
            </ul>
          )}
        </Card>
      </div>
      <SealBurst show={Boolean(burst)} label={B.today.accepted} sub={burst ?? undefined} icon="truck" onDone={() => setBurst(null)} className="fixed" />
    </div>
  )
}
