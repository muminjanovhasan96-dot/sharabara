/**
 * Sahnaning o'z xabarchalari (ink kartalar, yuqori o'ngda). Dizayn tizimidagi `Toaster` bilan
 * ataylab bo'lishilmaydi: ichki ilovalar o'z Toaster'ini telefon ekraniga o'rnatadi.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SPRING } from '@/lib/utils'
import { Seal } from '@/design'

export interface StageToast { id: string; title: string; body?: string; icon?: string; tone?: 'ink' | 'gold' }

let items: StageToast[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
let n = 0

export const stageToast = {
  show(title: string, body?: string, opts: { icon?: string; tone?: 'ink' | 'gold' } = {}) {
    n += 1
    items = [...items, { id: `st-${n}`, title, body, icon: opts.icon, tone: opts.tone }].slice(-2)
    emit()
  },
  remove(id: string) { if (items.some((i) => i.id === id)) { items = items.filter((i) => i.id !== id); emit() } },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  get: () => items,
}

function Item({ t }: { t: StageToast }) {
  useEffect(() => { const h = setTimeout(() => stageToast.remove(t.id), 2600); return () => clearTimeout(h) }, [t.id])
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={SPRING}
      role="status"
      className="pointer-events-auto flex w-[280px] items-start gap-2.5 rounded-[12px] border border-paper/10 px-3.5 py-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,.45)]"
      style={{ background: '#0f1f3a', color: '#ffffff' }}
    >
      <Seal size={28} variant={t.tone === 'gold' ? 'gold' : 'ink'} icon={t.icon ?? 'stamp'} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-[13px] font-semibold leading-snug">{t.title}</div>
        {t.body && <div className="mt-0.5 text-[12px] leading-snug text-paper/70">{t.body}</div>}
      </div>
    </motion.div>
  )
}

export function StageToasts() {
  const list = useSyncExternalStore(stageToast.subscribe, stageToast.get, stageToast.get)
  return (
    <div className="pointer-events-none fixed right-5 top-[104px] z-[90] flex flex-col items-end gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {list.map((t) => <Item key={t.id} t={t} />)}
      </AnimatePresence>
    </div>
  )
}
