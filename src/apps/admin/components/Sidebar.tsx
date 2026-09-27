import { useMemo } from 'react'
import { motion } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Clock3, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Icon, Logo } from '@/design'
import { useNow, useStore } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import { TID } from '@/lib/testids'
import { uz } from '@/i18n/uz'
import type { AdminSection } from '@/domain/types'
import { NAV_GROUPS, queueCounts, sectionTitle, SECTION_ICON, useAdminRole, useVisibleSections } from '../lib/sections'
import { A } from '../strings'

/** Shoshilinch navbatlar — g'isht rangli pilla, qolganlari ko'k. */
const URGENT: ReadonlySet<AdminSection> = new Set<AdminSection>(['moderation', 'returns'])

export function Sidebar({ active, compact, onToggle, onNavigate, pulses }: {
  active: AdminSection | null; compact: boolean; onToggle: () => void; onNavigate: (s: AdminSection) => void; pulses: Partial<Record<AdminSection, number>>
}) {
  const visible = useVisibleSections()
  const data = useStore((s) => s.data)
  const now = useNow()
  const role = useAdminRole()
  const counts = useMemo(() => queueCounts(data, now), [data, now])
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
          {NAV_GROUPS.map((g) => {
            const items = g.items.filter((s) => visible.includes(s))
            if (!items.length) return null
            return (
              <div key={g.key} className="mt-1">
                {g.label && !compact && <div className="eyebrow px-2.5 pb-0.5 pt-2 !text-[10.5px]">{g.label}</div>}
                {g.label && compact && <div className="mx-3 my-2 h-px bg-line" />}
                {items.map((s) => {
                  const isActive = active === s
                  const count = counts[s] ?? 0
                  const urgent = URGENT.has(s)
                  const item = (
                    <button
                      key={s}
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
                    <Tooltip.Root key={s}>
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
