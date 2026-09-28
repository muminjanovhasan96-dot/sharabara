/**
 * Birinchi ochilishda 3 slaydli qisqa tanishtiruv: «Narx tekshirilgan» nima · qanday sotiladi · pul qanday himoyalanadi.
 * O'tkazib yuborish mumkin; ko'rilgani localStorage'da saqlanadi. Sahnada (embedded) ko'rsatilmaydi.
 */
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button, Seal } from '@/design'
import { cn, SPRING } from '@/lib/utils'
import { ms } from '../strings'

const KEY = 'sb-m-onboarded'
function seen(): boolean { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

export function Onboarding() {
  const [open, setOpen] = useState(() => !seen())
  const [i, setI] = useState(0)
  const reduce = useReducedMotion()
  const slides = ms.onboarding.slides
  const close = () => { try { localStorage.setItem(KEY, '1') } catch { /* noop */ } setOpen(false) }
  if (!open) return null
  const s = slides[i]
  const last = i === slides.length - 1
  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-paper text-ink" role="dialog" aria-modal="true" aria-label={s.title}>
      <div className="flex justify-end px-4 pt-14"><button type="button" onClick={close} className="h-10 rounded-full px-3 text-[14px] font-medium text-ink-2 active:bg-paper-2">{ms.onboarding.skip}</button></div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-7 text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={i} initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }} transition={SPRING} className="flex flex-col items-center">
            <Seal size={120} variant="gold" icon={s.icon} ticks />
            <h2 className="m-0 mt-7 font-display text-[24px] leading-tight">{s.title}</h2>
            <p className="m-0 mt-3 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex flex-col items-center gap-4 px-6 pb-10">
        <div className="flex items-center gap-1.5" aria-hidden="true">{slides.map((_, k) => <span key={k} className={cn('block h-1.5 rounded-full transition-all', k === i ? 'w-5 bg-gold-fill' : 'w-1.5 bg-line-strong')} />)}</div>
        <Button variant="gold" fullWidth onClick={() => (last ? close() : setI(i + 1))}>{last ? ms.onboarding.start : ms.onboarding.next}</Button>
      </div>
    </div>
  )
}
