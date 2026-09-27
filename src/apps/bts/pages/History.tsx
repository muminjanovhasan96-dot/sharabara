import { useMemo } from 'react'
import { Badge, EmptyState, Skeleton } from '@/design'
import { useData } from '@/store'
import { formatDemoDate, formatDemoTime } from '@/domain/clock'
import { useAllSubs, useListLoading } from '../hooks'
import { B } from '../strings'

export function History() {
  const manifests = useData((d) => d.manifests)
  const regions = useData((d) => d.regions)
  const subs = useAllSubs()
  const loading = useListLoading('hist')
  const past = useMemo(() => manifests.filter((m) => m.status === 'picked_up').sort((a, b) => (b.pickedUpAt ?? b.date).localeCompare(a.pickedUpAt ?? a.date)), [manifests])
  const stat = (ids: string[]) => { let delivered = 0, progress = 0; for (const id of ids) { const r = subs.find((x) => x.so.id === id); if (!r) continue; if (['delivered', 'payout_scheduled', 'payout_paid'].includes(r.so.status)) delivered++; else if (['in_transit', 'at_branch', 'handed_to_bts'].includes(r.so.status)) progress++ } return { delivered, progress } }

  return (
    <div className="flex flex-col gap-3">
      <div className="eyebrow">{B.history.eyebrow}</div>
      {loading ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={76} />) : past.length === 0 ? <EmptyState icon="file-clock" title={B.history.empty} hint={B.history.emptyHint} /> : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {past.map((m) => { const s = stat(m.subOrderIds); const top = Object.entries(m.byRegion).sort((a, b) => b[1] - a[1]).slice(0, 3); return (
            <li key={m.id} className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-card p-4 shadow-soft">
              <div className="min-w-[150px]"><div className="font-display text-[20px] leading-tight">{formatDemoDate(`${m.date}T12:00:00`)}</div><div className="font-mono text-[12.5px] text-ink-3">{m.id}</div></div>
              <div className="tnum min-w-[110px] text-center"><div className="font-display text-[30px] leading-none">{m.subOrderIds.length}</div><div className="text-[12px] text-ink-3">{B.history.shipmentsLabel}</div></div>
              <div className="min-w-0 flex-1 text-[14px] text-ink-2">
                <div>{top.map(([r, n]) => `${regions.find((x) => x.id === r)?.name ?? r} ${n}`).join(' · ')}{Object.keys(m.byRegion).length > 3 && ` · +${Object.keys(m.byRegion).length - 3}`}</div>
                <div className="mt-0.5 text-[13px] text-ink-3">{m.closedAt && `${B.history.closed} ${formatDemoTime(m.closedAt)}`}{m.pickedUpAt && ` · ${B.history.picked} ${formatDemoTime(m.pickedUpAt)}`}</div>
              </div>
              <div className="flex gap-2">{s.delivered > 0 && <Badge tone="green" dot className="h-7 px-2.5 text-[13px]">{B.history.delivered} {s.delivered}</Badge>}{s.progress > 0 && <Badge tone="blue" dot className="h-7 px-2.5 text-[13px]">{B.history.inProgress} {s.progress}</Badge>}</div>
            </li>
          ) })}
        </ul>
      )}
    </div>
  )
}
