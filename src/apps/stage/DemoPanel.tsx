/**
 * Demo paneli — ink fon, 56 px. Chapda logotip, o'rtada rollar (telefon · kompyuter guruhlari),
 * o'ngda vaqt menyusi, sozlamalar va «Oltin yo'l».
 */
import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarPlus, Check, ChevronDown, Clock3, Coins, Dices, Monitor, RotateCcw, Settings2, Smartphone, Sparkles, Truck, Zap } from 'lucide-react'
import { api } from '@/api'
import { useStore } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import type { Role } from '@/domain/types'
import { TID } from '@/lib/testids'
import { cn, SPRING } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { ConfirmDialog } from '@/design'
import { applyRole, roleLabel, STAGE_ROLES } from './roles'
import { stageToast } from './toasts'

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="none" stroke="#ffffff" strokeWidth="2.5" />
        <circle cx="32" cy="32" r="23" fill="none" stroke="#f5b400" strokeWidth="1.5" />
        <path d="M24 38c2 2.5 4.5 3.5 8 3.5 4.2 0 6.8-1.8 6.8-4.6 0-2.6-1.9-3.7-6.3-4.7-4.6-1-6.9-2.5-6.9-5.6 0-3 2.7-5 6.6-5 3 0 5.2 1 7 3" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="hidden leading-none min-[1500px]:block">
        <div className="font-display text-[13px] tracking-[0.02em]">{uz.app.wordmark}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-paper/55">{uz.demo.idleTitle}</div>
      </div>
    </div>
  )
}

/** Rollar: 0–1 telefonda, 2–8 admin panelda, 9–10 hamkor panellarida. Guruh boshida kichik ikonka — qaysi ekranda ochilishini bildiradi. */
function RoleSwitcher({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const reduce = useReducedMotion()
  return (
    <div
      role="radiogroup"
      aria-label={uz.demo.role}
      data-testid={TID.stageRole}
      className="no-scrollbar inline-flex max-w-full items-stretch gap-px overflow-x-auto rounded-[11px] border border-paper/12 bg-paper/[.06] p-[3px]"
    >
      {STAGE_ROLES.map((r, i) => {
        const active = r === value
        const groupStart = i === 0 || i === 2 || i === 9
        const GroupIcon = i === 0 ? Smartphone : Monitor
        return (
          <div key={r} className="flex shrink-0 items-stretch">
            {groupStart && (
              <span className={cn('flex items-center pr-1 text-paper/45', i === 0 ? 'pl-1.5' : 'ml-1.5 border-l border-paper/15 pl-2')} aria-hidden="true">
                <GroupIcon size={12} strokeWidth={2} />
              </span>
            )}
            <button
              type="button"
              role="radio"
              aria-checked={active}
              data-role={r}
              title={i < 2 ? `${roleLabel(r)} · ${uz.demo.phonePane}` : `${roleLabel(r)} · ${uz.demo.desktopPane}`}
              onClick={() => { if (!active) onChange(r) }}
              className={cn(
                'relative h-8 shrink-0 whitespace-nowrap rounded-[8px] px-[8px] text-[11.5px] font-medium leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-fill',
                active ? 'text-ink' : 'text-white/70 hover:text-white',
              )}
            >
              {active && (
                <motion.span
                  layoutId="stage-role-thumb"
                  className="absolute inset-0 rounded-[8px] bg-gold-fill shadow-[0_1px_0_rgba(255,255,255,.25)_inset]"
                  transition={reduce ? { duration: 0 } : SPRING}
                  aria-hidden="true"
                />
              )}
              <span className="relative">{roleLabel(r)}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

const PANEL_BTN = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-paper/12 bg-paper/[.06] px-2.5 text-[12.5px] font-medium text-paper/85 transition-colors hover:bg-paper/[.12] hover:text-paper disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-gold-fill outline-none'
const MENU = 'z-[95] min-w-[260px] rounded-[14px] border border-line bg-card p-1.5 text-ink shadow-soft'
const ITEM = 'flex cursor-pointer select-none items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] outline-none data-[highlighted]:bg-paper-2 data-[disabled]:opacity-50'

export interface DemoPanelProps {
  fast: boolean
  onFast: (v: boolean) => void
  onGolden: () => void
  goldenRunning: boolean
}

export function DemoPanel({ fast, onFast, onGolden, goldenRunning }: DemoPanelProps) {
  const role = useStore((s) => s.session.role)
  const now = useStore((s) => s.clock.now)
  const seed = useStore((s) => s.data.seed)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const run = async (key: string, fn: () => Promise<unknown>) => {
    if (busy) return
    setBusy(key)
    try { await fn() } catch (e) { stageToast.show(uz.app.error, e instanceof Error ? e.message : String(e), { icon: 'triangle-alert' }) } finally { setBusy(null) }
  }

  const TIME_ACTIONS = [
    { key: 'to17', tid: TID.stageTo17, Icon: Clock3, label: uz.demo.to17, hint: 'Kechki partiya yopiladi', fn: () => api.demo.to17() },
    { key: 'bts', tid: TID.stageBts, Icon: Truck, label: uz.demo.btsArrived, hint: 'Yuklar BTS’ga topshiriladi', fn: () => api.demo.btsArrived() },
    { key: 'day', tid: TID.stagePlusDay, Icon: CalendarPlus, label: uz.demo.plusDay, hint: 'Yuklar filialga yetadi', fn: () => api.demo.plusDay() },
    { key: 'pay', tid: TID.stagePayday, Icon: Coins, label: uz.demo.payday, hint: 'Sotuvchilarga to’lov o’tadi', fn: () => api.demo.payday() },
  ] as const

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 text-white" style={{ background: '#0f1f3a' }}>
      <div className="flex shrink-0 items-center"><Wordmark /></div>

      <div className="flex min-w-0 flex-1 justify-center">
        <RoleSwitcher value={role} onChange={applyRole} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* time */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className={cn(PANEL_BTN, 'tnum pl-2')} aria-label={uz.demo.time} title={now}>
              <Clock3 size={14} strokeWidth={1.75} className="text-gold-fill" />
              <span>{formatDemoTime(now)}</span>
              <ChevronDown size={12} strokeWidth={1.75} className="opacity-70" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className={MENU}>
              <DropdownMenu.Label className="px-2.5 pb-1 pt-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-3">{uz.demo.time}</DropdownMenu.Label>
              {TIME_ACTIONS.map((a) => (
                <DropdownMenu.Item key={a.key} data-testid={a.tid} disabled={busy !== null} onSelect={() => void run(a.key, a.fn)} className={ITEM}>
                  <a.Icon size={16} strokeWidth={1.75} className="shrink-0 text-ink-2" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block font-medium">{a.label}</span>
                    <span className="block text-[11.5px] text-ink-3">{a.hint}</span>
                  </span>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* settings: fast mode, data */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className={cn(PANEL_BTN, 'w-9 px-0')} aria-label={uz.demo.settings} title={`${uz.demo.settings} · seed ${seed}`}>
              <Settings2 size={16} strokeWidth={1.75} className={cn(fast && 'text-gold-fill')} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className={MENU}>
              <DropdownMenu.CheckboxItem checked={fast} onCheckedChange={onFast} className={ITEM}>
                <Zap size={16} strokeWidth={1.75} className={cn('shrink-0', fast ? 'text-gold' : 'text-ink-2')} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block font-medium">{uz.demo.fast}</span>
                  <span className="block text-[11.5px] text-ink-3">{uz.demo.fastHint}</span>
                </span>
                <DropdownMenu.ItemIndicator><Check size={15} strokeWidth={2} className="text-blue" /></DropdownMenu.ItemIndicator>
              </DropdownMenu.CheckboxItem>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Label className="px-2.5 pb-1 pt-1 text-[11px] uppercase tracking-[0.16em] text-ink-3">{uz.demo.data} · seed {seed}</DropdownMenu.Label>
              <DropdownMenu.Item data-testid={TID.stageReset} onSelect={() => setConfirmReset(true)} className={ITEM}>
                <RotateCcw size={16} strokeWidth={1.75} className="shrink-0 text-ink-2" />{uz.demo.reset}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => void run('reseed', async () => { const s = await api.demo.reseed(); stageToast.show(uz.demo.reseed, `Yangi seed: ${s}`, { icon: 'dices' }) })}
                className={ITEM}
              >
                <Dices size={16} strokeWidth={1.75} className="shrink-0 text-ink-2" />{uz.demo.reseed}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* golden */}
        <motion.button
          type="button"
          data-testid={TID.stageGolden}
          title={uz.demo.golden}
          onClick={onGolden}
          disabled={goldenRunning}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-transparent bg-gold-fill px-3 text-[13px] font-semibold shadow-[0_1px_0_rgba(255,255,255,.35)_inset,0_8px_20px_-10px_rgba(245,180,0,.8)] outline-none transition hover:brightness-[1.04] disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-white" style={{ color: '#0f1f3a' }}
        >
          <Sparkles size={15} strokeWidth={1.75} />
          <span>{uz.demo.golden}</span>
        </motion.button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={uz.demo.reset}
        description="Barcha o’zgarishlar o’chadi, ma’lumot seed holatiga qaytadi. Davom etamizmi?"
        confirmLabel={uz.demo.reset}
        tone="destructive"
        loading={busy === 'reset'}
        onConfirm={() => run('reset', async () => { await api.demo.reset(); setConfirmReset(false); stageToast.show(uz.demo.reset, 'Ma’lumot boshlang’ich holatga qaytdi', { icon: 'rotate-ccw' }) })}
      />
    </header>
  )
}
