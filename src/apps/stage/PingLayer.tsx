/**
 * Ikki ekran orasidagi «jonli bog'lanish»: bus hodisasi → manzil ekran atrofida oltin halqa (600 ms)
 * + bir ekrandan ikkinchisiga uchib o'tadigan kichik «→» chip.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { bus, type BusEvents } from '@/api'
import { uz } from '@/i18n/uz'
import type { StagePane } from './roles'

export interface Point { x: number; y: number }
export interface Ping { id: number; from: Point; to: Point; toPane: StagePane; label: string }

/** Subscribes to the bus and reports pings; `flash` is the pane currently ringed. `measure` is called in the handler (not during render). */
export function usePings(measure: (pane: StagePane) => Point) {
  const [pings, setPings] = useState<Ping[]>([])
  const [flash, setFlash] = useState<Partial<Record<StagePane, number>>>({})
  const last = useRef<Partial<Record<StagePane, number>>>({})
  const counter = useRef(0)

  useEffect(() => {
    const fire = (from: StagePane, to: StagePane, label: string, soft = false) => {
      const now = Date.now()
      if (soft && now - (last.current[to] ?? 0) < 900) return
      last.current[to] = now
      const id = ++counter.current
      setPings((p) => [...p.slice(-3), { id, from: measure(from), to: measure(to), toPane: to, label }])
      setFlash((f) => ({ ...f, [to]: now }))
      setTimeout(() => setPings((p) => p.filter((x) => x.id !== id)), 1400)
      setTimeout(() => setFlash((f) => (f[to] === now ? { ...f, [to]: undefined } : f)), 600)
    }
    const statusLabel = (s: string) => (uz.orders.status as Record<string, string>)[s] ?? s
    const offs = [
      bus.on('listing.submitted', () => fire('phone', 'desktop', 'Yangi e’lon → Narx tahlili')),
      bus.on('listing.offer_sent', () => fire('desktop', 'phone', 'Narx taklifi → sotuvchi')),
      bus.on('listing.published', () => fire('desktop', 'phone', 'E’lon chiqdi → xaridorga push')),
      bus.on('order.created', () => fire('phone', 'desktop', 'Yangi buyurtma → Logistika')),
      bus.on('order.status', (p: BusEvents['order.status']) => fire('desktop', 'phone', `${statusLabel(p.status)} → telefon`)),
      bus.on('payout.paid', () => fire('desktop', 'phone', 'To’lov → hamyon')),
      bus.on('push', () => fire('desktop', 'phone', 'Push → telefon', true)),
    ]
    return () => offs.forEach((off) => off())
  }, [measure])
  return { pings, flash }
}

/** Centre-ish point of `el` relative to `body` (for chips travelling between panes). */
export function centerOf(el: HTMLElement | null, body: HTMLElement | null): Point {
  if (!el || !body) return { x: 0, y: 0 }
  const r = el.getBoundingClientRect(); const b = body.getBoundingClientRect()
  return { x: r.left - b.left + r.width / 2, y: r.top - b.top + Math.min(r.height * 0.42, 260) }
}

/** Absolutely positioned inside the stage body. */
export function PingLayer({ pings }: { pings: Ping[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {pings.map((p) => {
          const { from, to } = p
          const flip = p.toPane === 'phone'
          return (
            <motion.div
              key={p.id}
              className="absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gold/50 px-3 py-1.5 text-[12px] font-medium shadow-[0_10px_30px_-10px_rgba(26,36,48,.5)]"
              style={{ background: '#0f1f3a', color: '#ffffff', translateX: '-50%', translateY: '-50%' }}
              initial={{ x: from.x, y: from.y, opacity: 0, scale: 0.9 }}
              animate={{ x: [from.x, (from.x + to.x) / 2, to.x], y: [from.y, Math.min(from.y, to.y) - 60, to.y], opacity: [0, 1, 1], scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              {flip && <ArrowRight size={13} strokeWidth={1.75} className="rotate-180 text-gold-fill" />}
              <span>{p.label}</span>
              {!flip && <ArrowRight size={13} strokeWidth={1.75} className="text-gold-fill" />}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
