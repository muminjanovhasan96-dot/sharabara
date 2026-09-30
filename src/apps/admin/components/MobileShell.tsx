/**
 * Admin — telefon qobig'i: yuqorida sarlavha + izoh, pastda 5 ta tab (4 asosiy + «Ko'proq»),
 * «Ko'proq» — barcha bo'limlar ro'yxati, har biri «nima qiladi» izohi bilan.
 */
import { useMemo, useState } from 'react'
import { ChevronRight, LayoutGrid, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, BottomSheet, Icon, useTheme } from '@/design'
import { useNow, useStore } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import { uz } from '@/i18n/uz'
import type { AdminSection } from '@/domain/types'
import { NAV_GROUPS, queueCounts, sectionTitle, SECTION_ICON, useAdminRole, useVisibleSections } from '../lib/sections'
import { useContainer } from '../lib/context'
import { A, HELP } from '../strings'

const TABS: AdminSection[] = ['dashboard', 'pricing', 'moderation', 'logistics']

export function MobileShell({ active, onNavigate, children }: { active: AdminSection; onNavigate: (s: AdminSection) => void; children: React.ReactNode }) {
  const { theme, toggle } = useTheme()
  const data = useStore((s) => s.data)
  const now = useNow()
  const role = useAdminRole()
  const staff = useStore((s) => s.data.staff.find((x) => x.id === s.session.staffId) ?? s.data.staff[0])
  const visible = useVisibleSections()
  const counts = useMemo(() => queueCounts(data, now), [data, now])
  const [more, setMore] = useState(false)
  const container = useContainer()
  const tabs = TABS.filter((t) => visible.includes(t))
  const inTabs = tabs.includes(active)
  const go = (s: AdminSection) => { setMore(false); onNavigate(s) }

  return (
    <div data-admin-mobile className="flex h-full min-h-0 w-full flex-col bg-paper">
      <header className="pt-safe shrink-0 border-b border-line bg-card px-4 pb-2.5 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={staff.name} seed={staff.id} size={28} />
            <span className="min-w-0 leading-tight"><span className="block truncate text-[12.5px] font-semibold text-ink">{staff.name}</span><span className="block truncate text-[11px] text-blue">{uz.admin.roles[role]}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="tnum hidden rounded-full bg-paper px-2.5 py-1 text-[11.5px] text-ink-2 min-[400px]:inline">{formatDemoTime(now)}</span>
            <button type="button" onClick={toggle} aria-label={uz.admin.darkMode} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 active:bg-paper-2">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </div>
        <h1 className="m-0 mt-1.5 font-display text-[20px] leading-tight text-ink">{sectionTitle(active)}</h1>
      </header>

      <main className="scroll-thin relative min-h-0 flex-1 overflow-y-auto">{children}</main>

      <nav aria-label={uz.app.name} className="pb-safe z-20 shrink-0 border-t border-line bg-card">
        <ul className="m-0 flex list-none items-stretch justify-between px-1 pb-1 pt-1">
          {tabs.map((t) => {
            const isActive = active === t
            const count = counts[t] ?? 0
            return (
              <li key={t} className="flex flex-1 justify-center">
                <button type="button" aria-current={isActive ? 'page' : undefined} onClick={() => go(t)} className={cn('relative flex h-[54px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-[12px] px-1', isActive ? 'text-blue' : 'text-ink-3')}>
                  <span className="relative"><Icon name={SECTION_ICON[t]} size={22} className={isActive ? 'text-blue' : 'text-ink-3'} />
                    {count > 0 && <span className={cn('tnum absolute -right-3 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold ring-2 ring-card', t === 'moderation' ? 'bg-brick text-white' : 'bg-blue text-white')}>{count}</span>}
                  </span>
                  <span className={cn('text-[10.5px]', isActive ? 'font-bold' : 'font-medium')}>{t === 'dashboard' ? 'Bosh' : t === 'pricing' ? 'Narx' : t === 'moderation' ? 'Moderatsiya' : 'Logistika'}</span>
                </button>
              </li>
            )
          })}
          <li className="flex flex-1 justify-center">
            <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" className={cn('relative flex h-[54px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-[12px] px-1', !inTabs ? 'text-blue' : 'text-ink-3')}>
              <LayoutGrid size={22} /><span className={cn('text-[10.5px]', !inTabs ? 'font-bold' : 'font-medium')}>Ko’proq</span>
            </button>
          </li>
        </ul>
      </nav>

      <BottomSheet open={more} onOpenChange={setMore} container={container} snap="full" title={A.shell.allSections} closeButton>
        <div className="flex flex-col gap-4 pb-4">
          <p className="m-0 rounded-[12px] bg-gold-soft px-3 py-2 text-[12.5px] leading-snug text-ink">Bu — telefon ko’rinishi: navbatlar va tasdiqlash. Jadvalli katta bo’limlar kompyuterda qulayroq.</p>
          {NAV_GROUPS.map((g) => {
            const items = g.items.filter((s) => visible.includes(s))
            if (!items.length) return null
            return (
              <div key={g.key}>
                {g.label && <div className="eyebrow mb-1.5 px-1">{g.label}</div>}
                <ul className="m-0 list-none overflow-hidden rounded-[14px] border border-line bg-card p-0">
                  {items.map((s) => (
                    <li key={s} className="border-b border-line last:border-b-0">
                      <button type="button" onClick={() => go(s)} className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left', active === s && 'bg-blue-soft')}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-paper text-ink-2"><Icon name={SECTION_ICON[s]} size={18} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">{sectionTitle(s)}{(counts[s] ?? 0) > 0 && <span className="tnum rounded-full bg-blue-soft px-1.5 text-[11px] font-semibold text-blue">{counts[s]}</span>}</span>
                          <span className="clamp-2 block text-[12px] leading-snug text-ink-2">{HELP[s].sub}</span>
                        </span>
                        <ChevronRight size={16} className="shrink-0 text-ink-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </BottomSheet>
    </div>
  )
}
