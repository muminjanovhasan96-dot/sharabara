/**
 * Direktor paneli — umumiy qobiq ("Toza bozor"): salomlashuv + sana, davr pillari,
 * kompyuterda oq pill-tablar, telefonda pastki tab bar. /direktor da ham, /admin/director ichida ham shu komponent.
 */
import { useMemo, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { format } from 'date-fns'
import { uz } from 'date-fns/locale'
import { Boxes, Home, Moon, Sun, TrendingUp, TriangleAlert, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn, SPRING, haptic } from '@/lib/utils'
import { HelpPopover, IconButton, Seal, initialsOf, useTheme } from '@/design'
import { useNow, useStore } from '@/store'
import { parseIso } from '@/domain/clock'
import { computeProblems } from './lib/compute'
import { DirectorProvider, TABS, useDirector, type LayoutMode, type LinkMode } from './lib/ctx'
import { Umumiy } from './tabs/Umumiy'
import { Savdo } from './tabs/Savdo'
import { Pul } from './tabs/Pul'
import { Ombor } from './tabs/Ombor'
import { Muammolar } from './tabs/Muammolar'
import { D, type PeriodKey, type TabKey } from './strings'

const ICON: Record<TabKey, LucideIcon> = { umumiy: Home, savdo: TrendingUp, pul: Wallet, ombor: Boxes, muammolar: TriangleAlert }
const VIEW: Record<TabKey, () => ReactNode> = { umumiy: Umumiy, savdo: Savdo, pul: Pul, ombor: Ombor, muammolar: Muammolar }
const PERIODS: { value: PeriodKey; label: string }[] = [{ value: 'bugun', label: D.period.bugun }, { value: 'hafta', label: D.period.hafta }, { value: 'oy', label: D.period.oy }]

export interface DirectorDashboardProps {
  tab: TabKey
  onGo: (tab: TabKey, search: URLSearchParams) => void
  mode: LayoutMode
  linkMode: LinkMode
  container?: HTMLElement | null
  /** admin ichida: o'z scroll konteyneri yo'q, tema tugmasi yashirin */
  embedded?: boolean
}

export function DirectorDashboard(props: DirectorDashboardProps) {
  return (
    <DirectorProvider tab={props.tab} onGo={props.onGo} linkMode={props.linkMode} mode={props.mode} container={props.container} embedded={props.embedded}>
      <Shell />
    </DirectorProvider>
  )
}

function useProblemCount(): number {
  const data = useStore((s) => s.data)
  const now = useNow()
  return useMemo(() => computeProblems(data, now).reduce((a, g) => a + g.items.length, 0), [data, now])
}

/** "Xayrli tong/kun/kech, Jahongir" + "Payshanba, 24-sentabr · 14:32" */
function useGreeting(now: string): { hello: string; name: string; date: string } {
  const staff = useStore((s) => s.data.staff)
  return useMemo(() => {
    const d = parseIso(now)
    const h = d.getHours()
    const hello = h < 12 ? D.greeting.tong : h < 18 ? D.greeting.kun : D.greeting.kech
    const full = staff.find((s) => s.role === 'director')?.name ?? D.director
    const name = full.split(/\s+/)[0] ?? full
    const raw = format(d, 'EEEE, d-MMMM', { locale: uz })
    // "Payshanba, 24-Sentabr" → "Payshanba, 24-sentabr"
    const date = `${raw.replace(/-(\p{L})/u, (_, c: string) => `-${c.toLowerCase()}`)} · ${format(d, 'HH:mm')}`
    return { hello, name: name, date }
  }, [now, staff])
}

/* ─── Oq pill guruh (navy faol) ──────────────────────────────────────── */
function PillGroup<V extends string>({ items, value, onChange, fullWidth = false, label, size = 'md', id }: {
  items: { value: V; label: string; icon?: LucideIcon; count?: number; countTone?: 'gold' | 'brick' }[]
  value: V; onChange: (v: V) => void; fullWidth?: boolean; label: string; size?: 'sm' | 'md'; id: string
}) {
  const reduce = useReducedMotion()
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex items-stretch gap-0.5 rounded-[12px] border border-line bg-card p-1 shadow-soft', fullWidth && 'flex w-full')}>
      {items.map((it) => {
        const active = it.value === value
        const I = it.icon
        return (
          <button key={it.value} type="button" role="tab" aria-selected={active} onClick={() => { if (!active) { haptic(6); onChange(it.value) } }}
            className={cn('relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold',
              size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-3.5 text-[13.5px]', active ? 'text-card' : 'text-ink-2 hover:text-ink', fullWidth && 'flex-1')}>
            {active && <motion.span layoutId={`${id}-thumb`} className="absolute inset-0 rounded-[9px] bg-ink" transition={reduce ? { duration: 0 } : SPRING} aria-hidden="true" />}
            <span className="relative inline-flex items-center gap-1.5">
              {I && <I size={15} strokeWidth={2} aria-hidden="true" />}
              {it.label}
              {it.count !== undefined && it.count > 0 && (
                <span className={cn('tnum inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none',
                  active ? 'bg-gold-fill text-[#0f1f3a]' : it.countTone === 'brick' ? 'bg-brick text-white' : 'bg-paper-2 text-ink-2')}>{it.count}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Shell() {
  const { tab, go, period, setPeriod, mode, embedded } = useDirector()
  const now = useNow()
  const { theme, toggle } = useTheme()
  const problems = useProblemCount()
  const reduce = useReducedMotion()
  const greet = useGreeting(now)
  const View = VIEW[tab]
  const mobile = mode === 'mobile'
  const tabItems = TABS.map((t) => ({ value: t, label: D.tabs[t], icon: ICON[t], count: t === 'muammolar' ? problems : undefined, countTone: 'brick' as const }))

  const themeBtn = !embedded && (
    <IconButton size="sm" aria-label={D.theme} aria-pressed={theme === 'dark'} onClick={toggle} className="rounded-full border border-line bg-card">
      {theme === 'dark' ? <Sun strokeWidth={1.75} /> : <Moon strokeWidth={1.75} />}
    </IconButton>
  )
  const avatar = <Seal variant="avatar" initials={initialsOf(greet.name)} size={40} aria-label={greet.name} role="img" />

  return (
    <div className={cn('@container flex w-full flex-col bg-paper text-ink', embedded ? 'min-h-full' : 'h-full min-h-0')}>
      <header className={cn('z-30 shrink-0 bg-paper/95 backdrop-blur', embedded ? 'sticky top-0' : mobile && 'pt-safe', !mobile && 'border-b border-line')}>
        <div className={cn('mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-4 pb-3 pt-3', !mobile && '@3xl:flex-row @3xl:items-center @3xl:gap-4 @3xl:py-3', embedded && 'flex-row items-center justify-between')}>
          {!embedded && (
            <div className="flex items-center justify-between gap-3 @3xl:flex-1">
              <div className="min-w-0">
                <h1 className="m-0 truncate font-display text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-ink">{greet.hello}, {greet.name}</h1>
                <div className="tnum mt-0.5 text-[13px] text-ink-3" title={D.demoClock}>{greet.date}</div>
              </div>
              <div className="flex items-center gap-2 @3xl:hidden">{themeBtn}{avatar}</div>
            </div>
          )}
          {!mobile && (
            <div className={cn('min-w-0 overflow-x-auto no-scrollbar', !embedded && '@3xl:flex @3xl:justify-center')}>
              <PillGroup id="director-tabs" items={tabItems} value={tab} onChange={(v) => go(v)} label={D.title} size="sm" />
            </div>
          )}
          <div className={cn('flex items-center gap-2', !embedded && '@3xl:flex-1 @3xl:justify-end')}>
            <PillGroup id="director-period" items={PERIODS} value={period} onChange={setPeriod} label="Davr" fullWidth={mobile} size={mobile ? 'md' : 'sm'} />
            {!embedded && <div className="hidden items-center gap-2 @3xl:flex">{themeBtn}{avatar}</div>}
          </div>
        </div>
        {/* «Bu tab nima uchun» — bir gap + «?»; telefonda ham ko'rinadi, birinchi marta ochgan odam tushunsin */}
        <div className={cn('mx-auto flex w-full max-w-[1200px] items-center gap-1.5 px-4 pb-2 text-[12.5px] text-ink-2', mobile && 'pb-2.5')}>
          <span className={cn('min-w-0', mobile ? 'clamp-2 leading-snug' : 'truncate')}>{D.help[tab].sub}</span>
          <HelpPopover size="sm" title={D.tabs[tab]} help={D.help[tab]} />
        </div>
      </header>

      <main className={cn('@container min-w-0 flex-1', !embedded && 'scroll-thin min-h-0 overflow-y-auto')}>
        <motion.div key={tab} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0 } : { ...SPRING, opacity: { duration: 0.18 } }} className={cn('mx-auto w-full max-w-[1200px] px-4 pb-4 pt-1 @3xl:py-5', mobile && 'pb-6')}>
          <View />
        </motion.div>
      </main>

      {mobile && (
        <nav aria-label={D.title} className="pb-safe z-20 shrink-0 border-t border-line bg-card">
          <ul className="m-0 flex list-none items-stretch justify-between px-1 pb-1 pt-1">
            {TABS.map((t) => {
              const I = ICON[t]
              const active = tab === t
              return (
                <li key={t} className="flex flex-1 justify-center">
                  <motion.button type="button" aria-current={active ? 'page' : undefined} whileTap={reduce ? undefined : { scale: 0.94 }} transition={SPRING} onClick={() => { haptic(6); go(t) }}
                    className={cn('relative flex h-[54px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-[12px] px-1', active ? 'text-ink' : 'text-ink-3')}>
                    <span className="relative">
                      <I size={22} strokeWidth={active ? 2.25 : 1.75} />
                      {t === 'muammolar' && problems > 0 && <span className="tnum absolute -right-3 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brick px-1 text-[10.5px] font-bold text-white ring-2 ring-card">{problems}</span>}
                    </span>
                    <span className={cn('text-[10.5px]', active ? 'font-bold' : 'font-medium')}>{D.tabs[t]}</span>
                    {active && <motion.span layoutId="director-tab-dot" className="absolute bottom-0 h-[5px] w-[5px] rounded-full bg-gold-fill" transition={reduce ? { duration: 0 } : SPRING} />}
                  </motion.button>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}
