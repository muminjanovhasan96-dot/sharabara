import { useEffect, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn, SPRING, uid } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { Seal } from './Seal'

/* ─── tiny store ─────────────────────────────────────────────────────── */
function createStore<T extends { id: string }>() {
  let items: T[] = []
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())
  return {
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
    getSnapshot: () => items,
    add(item: T, max = 4) { items = [...items, item].slice(-max); emit() },
    remove(id: string) { if (items.some((i) => i.id === id)) { items = items.filter((i) => i.id !== id); emit() } },
    clear() { items = []; emit() },
  }
}

export type ToastTone = 'neutral' | 'success' | 'info' | 'error' | 'gold'
export interface ToastAction { label: string; onClick: () => void }
export interface ToastOptions {
  description?: ReactNode
  tone?: ToastTone
  /** ms; default 3500 (errors 5000) */
  duration?: number
  action?: ToastAction
  id?: string
  /** which Toaster shows it (default 'default'); apps that live side by side on /stage use their own channel */
  channel?: string
}
export interface ToastItem { id: string; title: ReactNode; description?: ReactNode; tone: ToastTone; duration: number; action?: ToastAction; channel: string }

export const toastStore = createStore<ToastItem>()

export interface PushOptions { body?: ReactNode; app?: string; time?: string; duration?: number; id?: string; onClick?: () => void; icon?: string }
export interface PushItem { id: string; title: ReactNode; body?: ReactNode; app: string; time: string; duration: number; onClick?: () => void; icon: string }

/** In-phone push notifications (iOS-style banner / Dynamic Island). */
export const pushStore = createStore<PushItem>()

/** Bir vaqtda ko'rinadigan toastlar soni (sahnada ustma-ust yig'ilib qolmasin). */
const MAX_VISIBLE = 2

function base(channel: string, title: ReactNode, opts: ToastOptions = {}, tone: ToastTone = opts.tone ?? 'neutral'): string {
  const id = opts.id ?? uid('t')
  const ch = opts.channel ?? channel
  // keep the newest MAX_VISIBLE per channel
  const same = toastStore.getSnapshot().filter((t) => t.channel === ch)
  for (const old of same.slice(0, Math.max(0, same.length - (MAX_VISIBLE - 1)))) toastStore.remove(old.id)
  toastStore.add({ id, title, description: opts.description, tone, duration: opts.duration ?? (tone === 'error' ? 5000 : 3500), action: opts.action, channel: ch }, 12)
  return id
}

/** Kanalga bog'langan toast API. Har ilova (admin, partner, bts) o'z kanalida yozadi va o'z Toaster'ida ko'radi. */
export function createToast(channel: string) {
  return Object.assign(
    (message: ReactNode, opts?: ToastOptions) => base(channel, message, opts),
    {
      success: (message: ReactNode, opts?: ToastOptions) => base(channel, message, opts, 'success'),
      info: (message: ReactNode, opts?: ToastOptions) => base(channel, message, opts, 'info'),
      error: (message: ReactNode, opts?: ToastOptions) => base(channel, message, opts, 'error'),
      gold: (message: ReactNode, opts?: ToastOptions) => base(channel, message, opts, 'gold'),
      dismiss: (id: string) => toastStore.remove(id),
      clear: () => toastStore.clear(),
      /** in-phone push banner */
      push: (title: ReactNode, opts: PushOptions = {}): string => {
        const id = opts.id ?? uid('p')
        pushStore.add({ id, title, body: opts.body, app: opts.app ?? uz.app.name, time: opts.time ?? 'hozir', duration: opts.duration ?? 4500, onClick: opts.onClick, icon: opts.icon ?? 'stamp' }, 3)
        return id
      },
      dismissPush: (id: string) => pushStore.remove(id),
    },
  )
}

/** Standart kanal — mobil ilova. */
export const toast = createToast('default')

export function useToasts(): ToastItem[] { return useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getSnapshot) }
export function usePushes(): PushItem[] { return useSyncExternalStore(pushStore.subscribe, pushStore.getSnapshot, pushStore.getSnapshot) }

/* ─── Toast card ─────────────────────────────────────────────────────── */
const TONE_ICON: Record<ToastTone, LucideIcon | null> = { neutral: null, success: CircleCheck, info: Info, error: CircleAlert, gold: null }
const TONE_COLOR: Record<ToastTone, string> = { neutral: 'text-ink-2', success: 'text-green', info: 'text-blue', error: 'text-brick', gold: 'text-gold' }
const TONE_BAR: Record<ToastTone, string> = { neutral: 'bg-ink-3', success: 'bg-green', info: 'bg-blue', error: 'bg-brick', gold: 'bg-gold' }

function ToastCard({ item, onDismiss, closeLabel }: { item: ToastItem; onDismiss: () => void; closeLabel: string }) {
  useEffect(() => {
    if (item.duration <= 0) return
    const t = setTimeout(onDismiss, item.duration)
    return () => clearTimeout(t)
  }, [item.duration, onDismiss])
  const I = TONE_ICON[item.tone]
  return (
    <div
      role="status"
      className="pointer-events-auto relative flex w-full max-w-[380px] items-start gap-3 overflow-hidden rounded-[14px] border border-line bg-card py-3 pl-4 pr-2 text-ink shadow-soft"
    >
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', TONE_BAR[item.tone])} aria-hidden="true" />
      {item.tone === 'gold' ? (
        <Seal size={28} variant="gold" icon="stamp" />
      ) : I ? (
        <I size={20} strokeWidth={1.75} className={cn('mt-0.5 shrink-0', TONE_COLOR[item.tone])} aria-hidden="true" />
      ) : null}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-[14px] font-semibold leading-snug">{item.title}</div>
        {item.description && <div className="mt-0.5 text-[13px] leading-snug text-ink-2">{item.description}</div>}
        {item.action && (
          <button
            type="button"
            onClick={() => { item.action?.onClick(); onDismiss() }}
            className="mt-1.5 text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={closeLabel}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  )
}

export interface ToasterProps {
  position?: 'top' | 'bottom'
  /** portal target (phone screen); default document.body */
  container?: HTMLElement | null
  /** render in place (absolute inside a `relative` root) instead of portaling */
  inline?: boolean
  /** show only toasts of this channel (default 'default') */
  channel?: string
  className?: string
  closeLabel?: string
}

/** Renders the toast stack. Mount once per surface (admin page, phone frame). */
export function Toaster({ position = 'top', container, inline = false, channel = 'default', className, closeLabel = uz.app.close }: ToasterProps) {
  const all = useToasts()
  const items = all.filter((t) => t.channel === channel)
  const reduce = useReducedMotion()
  const pos = container || inline ? 'absolute' : 'fixed'
  const dir = position === 'top' ? -1 : 1
  const node = (
    <div
      className={cn(
        pos, 'inset-x-0 z-[70] flex flex-col items-center gap-2 px-3 pointer-events-none',
        position === 'top' ? 'top-3 pt-safe' : 'bottom-3 pb-safe flex-col-reverse',
        className,
      )}
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 * dir, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 * dir, scale: 0.98 }}
            transition={reduce ? { duration: 0.15 } : SPRING}
            className="flex w-full justify-center"
          >
            <ToastCard item={t} onDismiss={() => toastStore.remove(t.id)} closeLabel={closeLabel} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
  if (inline) return node
  if (typeof document === 'undefined') return null
  return createPortal(node, container ?? document.body)
}

/* ─── PushToast (iOS banner) ─────────────────────────────────────────── */
export interface PushToastProps {
  item: PushItem
  onDismiss: () => void
  className?: string
}

export function PushToast({ item, onDismiss, className }: PushToastProps) {
  useEffect(() => {
    if (item.duration <= 0) return
    const t = setTimeout(onDismiss, item.duration)
    return () => clearTimeout(t)
  }, [item.duration, onDismiss])
  return (
    <div
      role="status"
      onClick={() => { item.onClick?.(); onDismiss() }}
      className={cn(
        'pointer-events-auto flex w-full cursor-pointer items-start gap-3 rounded-[22px] border border-line bg-card/95 p-3 text-ink shadow-soft backdrop-blur-none',
        className,
      )}
    >
      <Seal size={40} variant="ink" icon={item.icon} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="eyebrow truncate !text-[10px]">{item.app}</span>
          <span className="shrink-0 text-[11px] text-ink-3">{item.time}</span>
        </div>
        <div className="mt-0.5 truncate text-[14px] font-semibold leading-tight">{item.title}</div>
        {item.body && <div className="clamp-2 text-[13px] leading-snug text-ink-2">{item.body}</div>}
      </div>
    </div>
  )
}

/** Stack of PushToasts at the top of a phone screen (absolute). Use inside PhoneFrame. */
export function PushStack({ className }: { className?: string }) {
  const items = usePushes()
  const reduce = useReducedMotion()
  return (
    <div className={cn('pointer-events-none absolute inset-x-0 top-[58px] z-[60] flex flex-col gap-2 px-3', className)} aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((p) => (
          <motion.div
            key={p.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.96 }}
            transition={reduce ? { duration: 0.15 } : SPRING}
          >
            <PushToast item={p} onDismiss={() => pushStore.remove(p.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
