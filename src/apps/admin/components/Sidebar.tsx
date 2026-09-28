import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ChevronDown, Clock3, PanelLeftClose, PanelLeftOpen, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Icon, Logo } from '@/design'
import { useNow, useStore } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import { TID } from '@/lib/testids'
import { uz } from '@/i18n/uz'
import type { AdminSection } from '@/domain/types'
import { NAV_GROUPS, queueCounts, sectionTitle, SECTION_ICON, useAdminRole, useVisibleSections } from '../lib/sections'
import { A } from '../strings'

/** Shoshilinch navbatlar — g'isht rangli pilla, qolganlari oltin. */
const URGENT: ReadonlySet<AdminSection> = new Set<AdminSection>(['moderation', 'returns'])
/** Super admin uchun eng ko'p ishlatiladigan 5 bo'lim — menyu tepasida «Tez kirish». */
const QUICK: AdminSection[] = ['pricing', 'moderation', 'logistics', 'payments', 'audit']
const COLLAPSE_KEY = 'sb-admin-nav-collapsed'
/** Demo rejimi: standart holatda faqat hikoyaga kerakli 6 bo'lim; qolganlari «Barcha bo'limlar» ostida. */
const CORE: AdminSection[] = ['dashboard', 'pricing', 'moderation', 'logistics', 'payments', 'audit']
const SHOW_ALL_KEY = 'sb-admin-show-all'

export function Sidebar({ active, compact, onToggle, onNavigate, pulses }: {
  active: AdminSection | null; compact: boolean; onToggle: () => void; onNavigate: (s: AdminSection) => void; pulses: Partial<Record<AdminSection, number>>
}) {
  const visible = useVisibleSections()
  const data = useStore((s) => s.data)
  const now = useNow()
  const role = useAdminRole()
  const counts = useMemo(() => queueCounts(data, now), [data, now])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? '{}') as Record<string, boolean> } catch { return {} } })
  const toggleGroup = (k: string) => setCollapsed((c) => { const n = { ...c, [k]: !c[k] }; try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(n)) } catch { /* noop */ } return n })
  const [showAll, setShowAll] = useState<boolean>(() => { try { return localStorage.getItem(SHOW_ALL_KEY) === '1' } catch { return false } })
  const toggleAll = () => setShowAll((v) => { try { localStorage.setItem(SHOW_ALL_KEY, v ? '0' : '1') } catch { /* noop */ } return !v })
  const core = CORE.filter((s) => visible.includes(s))
  const hiddenCount = visible.filter((s) => !CORE.includes(s)).length
  const quick = role === 'super_admin' ? QUICK.filter((s) => visible.includes(s)) : []
  // faol bo'lim asosiylar ichida bo'lmasa (masalan Direktor), uni ham ko'rsatamiz
  const coreItems = active && !core.includes(active) && visible.includes(active) ? [...core, active] : core
  const coreMode = !showAll && !compact && hiddenCount > 0
  const groups = coreMode ? [{ key: 'core', label: null, items: coreItems }] : quick.length ? [{ key: 'quick', label: A.shell.quick, items: quick }, ...NAV_GROUPS] : NAV_GROUPS
  return (
    <Tooltip.Provider delayDuration={200}>
      <nav
        data-testid={TID.aNav}
        aria-label={uz.app.name}
        className={cn('flex h-full shrink-0 flex-col border-r border-line bg-card text-ink transition-[width] duration-200', compact ? 'w-[64px]' : 'w-[232px]')}
      >
        <div className={cn('flex h-14 items-center gap-2.5 px-3', compact && 'justify-center px-0')}>
          <Logo size={28} />
          {!compact && (
            <span className="min-w-0 leading-none">
              <span className="block truncate font-display text-[15px] text-ink" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>{uz.app.wordmark}</span>
              <span className="mt-0.5 block text-[10.5px] text-ink-3">{uz.admin.roles[role]}</span>
            </span>
          )}
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {groups.map((g) => {
            const items = g.items.filter((s) => visible.includes(s))
            if (!items.length) return null
            const isCollapsed = !compact && g.label !== null && g.key !== 'quick' && collapsed[g.key]
            return (
              <div key={g.key} className="mt-1">
                {g.label && !compact && (
                  <button type="button" onClick={() => g.key !== 'quick' && toggleGroup(g.key)} aria-expanded={!isCollapsed} className={cn('flex w-full items-center gap-1 px-2.5 pb-0.5 pt-2 text-left', g.key === 'quick' ? 'cursor-default' : 'hover:text-ink')}>
                    {g.key === 'quick' && <Zap size={11} strokeWidth={2.2} className="text-gold" aria-hidden="true" />}
                    <span className="eyebrow !text-[10.5px]">{g.label}</span>
                    {g.key !== 'quick' && <ChevronDown size={12} strokeWidth={2} className={cn('ml-auto text-ink-3 transition-transform', isCollapsed && '-rotate-90')} aria-hidden="true" />}
                    {isCollapsed && items.reduce((a, s) => a + (counts[s] ?? 0), 0) > 0 && <span className="tnum rounded-full bg-gold-soft px-1.5 text-[10.5px] font-semibold text-ink">{items.reduce((a, s) => a + (counts[s] ?? 0), 0)}</span>}
                  </button>
                )}
                {g.label && compact && <div className="mx-3 my-2 h-px bg-line" />}
                {!isCollapsed && items.map((s) => {
                  const isActive = active === s
                  const count = counts[s] ?? 0
                  const urgent = URGENT.has(s)
                  const item = (
                    <button
                      key={`${g.key}-${s}`}
                      type="button"
                      data-section={s}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={compact ? sectionTitle(s) : undefined}
                      onClick={() => onNavigate(s)}
                      className={cn(
                        'relative flex h-[34px] w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] transition-colors',
                        isActive ? 'bg-blue-soft font-semibold text-blue' : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
                        compact && 'justify-center px-0',
                      )}
                    >
                      {isActive && <span aria-hidden="true" className="absolute -left-2 top-[5px] h-6 w-[3px] rounded-r bg-blue" />}
                      <Icon name={SECTION_ICON[s]} size={18} className={cn('shrink-0', isActive ? 'text-blue' : 'text-ink-3')} />
                      {!compact && <span className="min-w-0 flex-1 truncate text-left">{sectionTitle(s)}</span>}
                      {count > 0 && (
                        <motion.span
                          key={pulses[s] ?? 0}
                          initial={{ scale: 1 }}
                          animate={pulses[s] ? { scale: [1, 1.45, 1] } : { scale: 1 }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={cn(
                            'tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                            urgent ? 'bg-brick-soft text-brick' : 'bg-blue-soft text-blue',
                            isActive && !urgent && 'bg-card',
                            compact && 'absolute right-1 top-0.5 h-4 min-w-4 px-1 text-[10px]',
                          )}
                          aria-label={`${count}`}
                        >
                          {count}
                        </motion.span>
                      )}
                    </button>
                  )
                  if (!compact) return item
                  return (
                    <Tooltip.Root key={`${g.key}-${s}`}>
                      <Tooltip.Trigger asChild>{item}</Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content side="right" sideOffset={8} className="z-[80] rounded-[8px] bg-ink px-2.5 py-1.5 text-[12px] text-paper shadow-soft">
                          {sectionTitle(s)}{count > 0 && <span className={cn('tnum ml-1.5', urgent ? 'text-brick' : 'text-gold-fill')}>{count}</span>}
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  )
                })}
              </div>
            )
          })}
        </div>
        {!compact && hiddenCount > 0 && (
          <div className="px-2 pb-1">
            <button type="button" onClick={toggleAll} className="flex h-9 w-full items-center gap-2 rounded-[10px] px-2.5 text-[12.5px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink" title={coreMode ? A.shell.allSections : A.shell.coreHint}>
              <ChevronDown size={14} strokeWidth={2} className={cn('transition-transform', !coreMode && 'rotate-180')} />{coreMode ? `${A.shell.allSections} (${hiddenCount})` : A.shell.coreSections}
            </button>
          </div>
        )}
        <div className="border-t border-line p-2">
          {!compact && (
            <div className="mx-1 mb-1 flex items-center gap-2 rounded-[10px] bg-paper px-2.5 py-1.5">
              <Clock3 size={15} strokeWidth={1.75} className="shrink-0 text-gold" aria-hidden="true" />
              <span className="min-w-0 leading-tight">
                <span className="block text-[10px] uppercase tracking-[0.12em] text-ink-3">{A.shell.demoClock}</span>
                <span className="tnum block text-[13px] font-medium text-ink">{formatDemoTime(now)}</span>
              </span>
            </div>
          )}
          <button type="button" onClick={onToggle} aria-label={compact ? A.shell.expand : A.shell.collapse} className={cn('flex h-9 w-full items-center gap-2 rounded-[10px] px-2.5 text-[12.5px] text-ink-3 hover:bg-paper-2 hover:text-ink', compact && 'justify-center px-0')}>
            {compact ? <PanelLeftOpen size={17} strokeWidth={1.75} /> : <PanelLeftClose size={17} strokeWidth={1.75} />}
            {!compact && <span>{A.shell.collapse}</span>}
          </button>
        </div>
      </nav>
    </Tooltip.Provider>
  )
}
