import { useMemo, useState } from 'react'
import { Building2, CircleCheck, TriangleAlert } from 'lucide-react'
import { Avatar, Badge, Button, ChipGroup, ConfirmDialog, EmptyState, Skeleton, type BadgeTone } from '@/design'
import { toast } from '../toast'
import { api } from '@/api'
import { useData, useNow } from '@/store'
import { ageDays, formatDemoTime } from '@/domain/clock'
import type { SubOrderStatus } from '@/domain/types'
import { uz, t } from '@/i18n/uz'
import { TID } from '@/lib/testids'
import { cn } from '@/lib/utils'
import { useAllSubs, useListLoading, type ShipRow } from '../hooks'
import { B } from '../strings'

type F = 'all' | 'handed_to_bts' | 'in_transit' | 'at_branch' | 'delivered'
const SHOWN: SubOrderStatus[] = ['handed_to_bts', 'in_transit', 'at_branch', 'delivered']
const TONE: Partial<Record<SubOrderStatus, BadgeTone>> = { handed_to_bts: 'gold', in_transit: 'blue', at_branch: 'gold', delivered: 'green' }

export function Shipments({ narrow }: { narrow: boolean }) {
  const now = useNow()
  const subs = useAllSubs()
  const branches = useData((d) => d.branches)
  const regions = useData((d) => d.regions)
  const users = useData((d) => d.users)
  const [f, setF] = useState<F>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [problemId, setProblemId] = useState<string | null>(null)
  const loading = useListLoading('ship')

  const rows = useMemo(() => subs.filter(({ so }) => SHOWN.includes(so.status) && (so.status !== 'delivered' || ageDays(so.timeline.at(-1)?.at ?? now, now) <= 3)).filter(({ so }) => f === 'all' || so.status === f), [subs, f, now])
  const counts = useMemo(() => { const c: Record<string, number> = {}; for (const { so } of subs) if (SHOWN.includes(so.status) && (so.status !== 'delivered' || ageDays(so.timeline.at(-1)?.at ?? now, now) <= 3)) c[so.status] = (c[so.status] ?? 0) + 1; return c }, [subs, now])
  const groups = useMemo(() => {
    const m = new Map<string, ShipRow[]>()
    for (const r of rows) { const br = branches.find((b) => b.id === r.so.branchId); const key = br?.regionId ?? (r.o.delivery.method === 'courier_tashkent' ? '_courier' : '_pickup'); m.set(key, [...(m.get(key) ?? []), r]) }
    const label = (k: string) => (k === '_courier' ? B.shipments.courier : k === '_pickup' ? B.shipments.pickup : regions.find((x) => x.id === k)?.name ?? k)
    const actionable = (v: ShipRow[]) => v.filter((r) => r.so.status === 'in_transit' || r.so.status === 'at_branch').length
    return [...m.entries()].map(([k, v]) => ({ key: k, name: label(k), rows: v })).sort((a, b) => actionable(b.rows) - actionable(a.rows) || b.rows.length - a.rows.length)
  }, [rows, branches, regions])

  const run = async (id: string, fn: () => Promise<unknown>, ok: string) => { setBusyId(id); try { await fn(); toast.success(ok) } catch (e) { toast.error(e instanceof Error ? e.message : B.common.error) } finally { setBusyId(null) } }
  const markProblem = async (reason?: string) => { if (!problemId || !reason) return; await run(problemId, () => api.logistics.btsMarkProblem(problemId, reason), B.shipments.problemSaved); setProblemId(null) }

  const options = [{ value: 'all' as F, label: `${B.shipments.all} · ${Object.values(counts).reduce((a, b) => a + b, 0)}` }, ...SHOWN.map((s) => ({ value: s as F, label: `${uz.orders.status[s]} · ${counts[s] ?? 0}` }))]

  return (
    <div className="flex flex-col gap-4">
      <ChipGroup aria-label={B.shipments.all} options={options} value={f} onChange={(v) => setF(v ?? 'all')} allowEmpty={false} />
      {loading ? <div className="flex flex-col gap-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={84} />)}</div> : rows.length === 0 ? <EmptyState icon="truck" title={B.shipments.empty} hint={B.shipments.emptyHint} /> : groups.map((g) => (
        <section key={g.key} aria-label={g.name}>
          <div className="mb-2 flex items-baseline gap-2"><h2 className="m-0 font-display text-[20px]">{g.name}</h2><span className="tnum text-[14px] text-ink-3">{t(B.shipments.count, { n: g.rows.length })}</span></div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {g.rows.map(({ so, o }) => {
              const buyer = users.find((u) => u.id === o.buyerId)
              const br = branches.find((b) => b.id === so.branchId)
              const busy = busyId === so.id
              return (
                <li key={so.id} className={cn('rounded-card border bg-card p-4 shadow-soft', so.problem ? 'border-brick/40' : 'border-line')}>
                  <div className={cn('flex gap-4', narrow ? 'flex-col' : 'items-center')}>
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <Avatar name={buyer?.name ?? '?'} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[17px] font-semibold">{so.waybill ?? so.id}</span><Badge tone={TONE[so.status] ?? 'neutral'} dot className="h-7 px-2.5 text-[13px]">{uz.orders.status[so.status]}</Badge>{so.problem && <Badge tone="brick" Icon={TriangleAlert} className="h-7 px-2.5 text-[13px]">{B.shipments.problemBadge}</Badge>}</div>
                        <div className="mt-1 text-[15px] text-ink">{buyer?.name ?? '—'} <span className="tnum text-ink-3">{buyer?.phoneMasked}</span></div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[14px] text-ink-2"><span className="inline-flex items-center gap-1"><Building2 size={14} strokeWidth={1.75} aria-hidden="true" />{br?.name.replace(' (namuna)', '') ?? (o.delivery.method === 'courier_tashkent' ? B.shipments.courier : B.shipments.pickup)}</span><span className="clamp-1">{so.items.map((i) => `${i.title}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ')}</span></div>
                        <div className="mt-0.5 text-[12.5px] text-ink-3">{formatDemoTime(so.timeline.at(-1)?.at ?? o.createdAt)}{so.problem && ` · ${so.problem}`}</div>
                      </div>
                    </div>
                    <div className={cn('flex shrink-0 gap-2', narrow && 'flex-wrap')}>
                      {so.status === 'in_transit' && <Button data-testid={TID.bAtBranch} data-id={so.id} size="lg" variant="gold" leading={<Building2 />} loading={busy} onClick={() => void run(so.id, () => api.logistics.btsArrivedAtBranch(so.id), B.shipments.atBranchDone)} className="!h-14 !text-[16px]">{B.shipments.atBranch}</Button>}
                      {so.status === 'at_branch' && <Button data-testid={TID.bDelivered} data-id={so.id} size="lg" variant="gold" leading={<CircleCheck />} loading={busy} onClick={() => void run(so.id, () => api.logistics.btsDelivered(so.id), B.shipments.deliveredDone)} className="!h-14 !text-[16px]">{B.shipments.delivered}</Button>}
                      {so.status !== 'delivered' && <Button size="lg" variant="secondary" leading={<TriangleAlert />} disabled={busy} onClick={() => setProblemId(so.id)} className="!h-14 !text-[16px] text-brick">{B.shipments.problem}</Button>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <ConfirmDialog open={Boolean(problemId)} onOpenChange={(v) => { if (!v) setProblemId(null) }} title={B.shipments.problemTitle} description={B.shipments.problemDesc} tone="destructive" requireReason reasonPlaceholder={B.shipments.problemPh} confirmLabel={B.common.save} loading={Boolean(busyId)} onConfirm={(r) => void markProblem(r)} />
    </div>
  )
}
