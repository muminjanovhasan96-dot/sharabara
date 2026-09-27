import { useMemo, useState } from 'react'
import { Clock, MapPin } from 'lucide-react'
import { EmptyState, SearchInput, Skeleton } from '@/design'
import { useData } from '@/store'
import { t } from '@/i18n/uz'
import { cn } from '@/lib/utils'
import { useAllSubs, useListLoading } from '../hooks'
import { B } from '../strings'

export function Branches({ narrow }: { narrow: boolean }) {
  const branches = useData((d) => d.branches)
  const regions = useData((d) => d.regions)
  const subs = useAllSubs()
  const [q, setQ] = useState('')
  const loading = useListLoading('br')
  const counts = useMemo(() => { const m = new Map<string, { transit: number; at: number }>(); for (const { so } of subs) { if (!so.branchId) continue; const e = m.get(so.branchId) ?? { transit: 0, at: 0 }; if (so.status === 'in_transit' || so.status === 'handed_to_bts') e.transit++; if (so.status === 'at_branch') e.at++; m.set(so.branchId, e) } return m }, [subs])
  const groups = useMemo(() => {
    const s = q.trim().toLowerCase()
    return regions.map((r) => ({ r, list: branches.filter((b) => b.regionId === r.id && (!s || b.name.toLowerCase().includes(s) || r.name.toLowerCase().includes(s))) })).filter((g) => g.list.length > 0)
      .sort((a, b) => { const c = (g: typeof a) => g.list.reduce((x, y) => x + (counts.get(y.id)?.transit ?? 0) + (counts.get(y.id)?.at ?? 0), 0); return c(b) - c(a) })
  }, [regions, branches, q, counts])
  const total = groups.reduce((a, g) => a + g.list.length, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3"><SearchInput size="lg" value={q} onChange={setQ} placeholder={B.branches.search} className="max-w-[420px] text-[16px]" aria-label={B.branches.search} /><span className="tnum text-[15px] text-ink-3">{t(B.branches.total, { n: total })}</span></div>
      {loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={96} />)}</div> : groups.length === 0 ? <EmptyState icon="map-pin" title={B.branches.empty} /> : groups.map(({ r, list }) => (
        <section key={r.id} aria-label={r.name}>
          <h2 className="m-0 mb-2 font-display text-[20px]">{r.name} <span className="tnum text-[14px] font-normal text-ink-3">· {list.length}</span></h2>
          <ul className={cn('m-0 grid list-none gap-3 p-0', narrow ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-3')}>
            {list.map((b) => { const c = counts.get(b.id) ?? { transit: 0, at: 0 }; return (
              <li key={b.id} className="flex items-center gap-4 rounded-card border border-line bg-card p-4 shadow-soft">
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-medium text-ink">{b.name.replace(' (namuna)', '')}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[13.5px] text-ink-2"><MapPin size={14} strokeWidth={1.75} aria-hidden="true" />{b.address}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-3"><Clock size={13} strokeWidth={1.75} aria-hidden="true" />{B.branches.hours}: {b.hours}</div>
                  <div className="tnum mt-0.5 text-[13px] text-ink-3">{b.phoneMasked}</div>
                </div>
                <div className="flex shrink-0 gap-2 text-center">
                  <div className={cn('min-w-[64px] rounded-[10px] px-2 py-1.5', c.transit ? 'bg-blue-soft' : 'bg-paper')}><div className={cn('tnum font-display text-[22px] leading-none', c.transit ? 'text-blue' : 'text-ink-3')}>{c.transit}</div><div className="mt-1 text-[10.5px] uppercase tracking-wide text-ink-3">{B.branches.inTransit}</div></div>
                  <div className={cn('min-w-[64px] rounded-[10px] px-2 py-1.5', c.at ? 'bg-green-soft' : 'bg-paper')}><div className={cn('tnum font-display text-[22px] leading-none', c.at ? 'text-green' : 'text-ink-3')}>{c.at}</div><div className="mt-1 text-[10.5px] uppercase tracking-wide text-ink-3">{B.branches.atBranch}</div></div>
                </div>
              </li>
            ) })}
          </ul>
        </section>
      ))}
    </div>
  )
}
