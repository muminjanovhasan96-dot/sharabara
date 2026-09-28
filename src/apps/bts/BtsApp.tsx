import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { HelpPopover, Icon, Toaster } from '@/design'
import { useData, useNow } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import { useBase, useHref, useStageNav } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useAllSubs, useContainerWidth, useTodayManifest } from './hooks'
import './bts.css'
import { B } from './strings'
import { Today } from './pages/Today'
import { Shipments } from './pages/Shipments'
import { Branches } from './pages/Branches'
import { History } from './pages/History'

const NAV: { to: string; key: keyof typeof B.nav; icon: string }[] = [
  { to: '/', key: 'today', icon: 'truck' },
  { to: '/shipments', key: 'shipments', icon: 'package' },
  { to: '/branches', key: 'branches', icon: 'map-pin' },
  { to: '/history', key: 'history', icon: 'file-clock' },
]

export default function BtsApp({ embedded = false }: { embedded?: boolean }) {
  useStageNav()
  const href = useHref()
  const { embedded: ctxEmbedded } = useBase()
  const isEmbedded = embedded || ctxEmbedded
  const now = useNow()
  const [rootRef, width] = useContainerWidth<HTMLDivElement>()
  const narrow = width < 860
  const m = useTodayManifest()
  const subs = useAllSubs()
  const branchesCount = useData((d) => d.branches.length)
  const active = subs.filter(({ so }) => ['handed_to_bts', 'in_transit', 'at_branch'].includes(so.status)).length
  const loc = useLocation()
  const pageKey = (['shipments', 'branches', 'history'] as const).find((k) => loc.pathname.endsWith(`/${k}`)) ?? 'today'
  const counts: Record<keyof typeof B.nav, number | undefined> = { today: m && m.status !== 'picked_up' ? m.subOrderIds.length : undefined, shipments: active || undefined, branches: branchesCount, history: undefined }

  return (
    <div ref={rootRef} className={cn('relative flex flex-col bg-paper text-ink text-[16px]', isEmbedded ? 'h-full min-h-0' : 'h-dvh')} data-app="bts">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-3 text-white" style={{ background: '#0f1f3a' }}>
        <div className="min-w-0"><div className="text-[10.5px] uppercase tracking-[0.2em] text-white/60">Hamkor · logistika</div><div className="flex items-center gap-1.5"><h1 className="m-0 truncate font-display text-[20px] leading-tight text-white">{B.title} · {B.nav[pageKey]}</h1><HelpPopover size="sm" title={B.nav[pageKey]} help={B.help[pageKey]} className="text-white/70 hover:bg-white/10 hover:text-white" /></div><div className="truncate text-[13px] text-white/75">{B.help[pageKey].sub}</div></div>
        <div className="tnum inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[15px]"><span className="h-2 w-2 rounded-full bg-gold-fill" aria-hidden="true" /><span className="text-white/60">{B.common.demoClock}</span><span className="font-semibold">{formatDemoTime(now)}</span></div>
      </header>
      <nav className="flex shrink-0 gap-2 border-b border-line bg-card px-4 py-3" aria-label={B.title}>
        {NAV.map((n) => (
          <NavLink key={n.to} to={href(n.to)} end={n.to === '/'} aria-label={B.nav[n.key]} className={({ isActive }) => cn('inline-flex h-14 min-h-[56px] flex-1 items-center justify-center gap-2 rounded-[14px] border px-3 text-[16px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue', isActive ? 'border-blue/30 bg-blue-soft font-semibold text-blue' : 'border-line bg-card text-ink-2 hover:border-line-strong hover:text-ink')}>
            {({ isActive }) => (
              <>
                <Icon name={n.icon} size={22} className={isActive ? 'text-blue' : 'text-ink-3'} />
                {!narrow && <span>{B.nav[n.key]}</span>}
                {counts[n.key] !== undefined && <span className={cn('tnum rounded-full px-2 text-[13px] font-semibold leading-[22px]', isActive ? 'bg-blue text-white' : n.key === 'today' ? 'bg-brick-soft text-brick' : 'bg-blue-soft text-blue')}>{counts[n.key]}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <main className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto max-w-[1180px]">
          <Routes>
            <Route index element={<Today narrow={narrow} />} />
            <Route path="shipments" element={<Shipments narrow={narrow} />} />
            <Route path="branches" element={<Branches narrow={narrow} />} />
            <Route path="history" element={<History />} />
            <Route path="*" element={<Today narrow={narrow} />} />
          </Routes>
        </div>
      </main>
      <Toaster channel="bts" inline position="bottom" />
    </div>
  )
}
