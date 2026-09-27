import { useMemo } from 'react'
import { Lightbulb } from 'lucide-react'
import { Badge, EmptyState } from '@/design'
import { cn } from '@/lib/utils'
import { useNow, useStore } from '@/store'
import { computeProblems } from '../lib/compute'
import { useDirector } from '../lib/ctx'
import { AdminLink, CountPill, Panel, compact } from '../components/ui'
import { D, type ProblemKey } from '../strings'

const cmp = compact

export function Muammolar() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const { filter, setFilter } = useDirector()
  const groups = useMemo(() => computeProblems(data, now), [data, now])
  const nonEmpty = groups.filter((g) => g.items.length > 0)
  const total = nonEmpty.reduce((a, g) => a + g.items.length, 0)
  const active = (filter && groups.some((g) => g.key === filter && g.items.length) ? filter : 'all') as ProblemKey | 'all'
  const shown = active === 'all' ? nonEmpty : nonEmpty.filter((g) => g.key === active)

  if (total === 0) return <EmptyState icon="check" title={D.problems.ok} hint={D.problems.okHint} />

  return (
    <div className="flex flex-col gap-3 @3xl:gap-4">
      <div role="radiogroup" aria-label={D.problems.title} className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5">
        {[{ value: 'all' as const, label: D.all, n: total, urgent: false }, ...nonEmpty.map((g) => ({ value: g.key, label: g.label, n: g.items.length, urgent: g.items.some((i) => i.tone === 'brick') }))].map((o) => {
          const on = active === o.value
          return (
            <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => setFilter(o.value === 'all' ? null : o.value)}
              className={cn('inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold shadow-soft transition-colors', on ? 'border-ink bg-ink text-card' : 'border-line bg-card text-ink-2 hover:text-ink')}>
              {o.label}
              <span className={cn('tnum inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none', on ? 'bg-gold-fill text-[#0f1f3a]' : o.urgent ? 'bg-brick-soft text-brick' : 'bg-paper-2 text-ink-2')}>{o.n}</span>
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-2 @3xl:gap-4">
        {shown.map((g) => {
          const urgent = g.items.some((i) => i.tone === 'brick')
          return (
            <Panel key={g.key} eyebrow={g.label} hint={<Badge size="sm" tone={urgent ? 'brick' : 'gold'} dot className="mt-1">{urgent ? 'shoshilinch' : 'e’tibor'}</Badge>} padding={false}
              actions={<CountPill n={g.items.length} tone={urgent ? 'brick' : 'gold'} className="h-7 min-w-7 text-[13px]" />}>
              <div className="mx-4 mb-2 mt-1 flex items-start gap-2 text-[12.5px] leading-snug text-ink-2">
                <Lightbulb size={15} strokeWidth={1.9} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                <span><span className="font-semibold text-ink">{D.problems.whatToDo}:</span> {g.hint}</span>
              </div>
              <ul className="m-0 list-none divide-y divide-line p-0">
                {g.items.map((it) => (
                  <li key={it.id} className="flex items-start gap-3 px-4 py-2.5">
                    <span className={cn('mt-[6px] h-2.5 w-2.5 shrink-0 rounded-full', it.tone === 'brick' ? 'bg-brick' : it.tone === 'gold' ? 'bg-gold-fill' : 'bg-ink-3')} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">{it.title}</span>
                      <span className="block truncate text-[12px] text-ink-3">{it.sub}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                        {it.meta && <span className={cn('tnum inline-flex items-center rounded-[6px] px-1.5 py-0.5 font-semibold', it.tone === 'brick' ? 'bg-brick-soft text-brick' : it.tone === 'gold' ? 'bg-gold-soft text-[color-mix(in_srgb,var(--gold)_72%,var(--ink))]' : 'bg-paper-2 text-ink-2')}>{it.meta}</span>}
                        <AdminLink to={it.to} />
                      </span>
                    </span>
                    {it.amount !== undefined && <span className="tnum shrink-0 pt-0.5 text-[13.5px] font-bold text-ink">{cmp(it.amount)}</span>}
                  </li>
                ))}
              </ul>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
