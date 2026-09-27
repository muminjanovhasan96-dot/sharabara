import { useRef, useState, type ReactNode, type TouchEvent, type UIEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { LoaderCircle, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ms } from '../strings'

const THRESHOLD = 72

/** Touch pull-to-refresh on a scroll container (mobile). Wrap the screen body. */
export function PullToRefresh({ onRefresh, children, className, refreshing }: { onRefresh: () => Promise<void> | void; children: ReactNode; className?: string; refreshing: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)
  const [pull, setPull] = useState(0)
  const reduce = useReducedMotion()
  const onTouchStart = (e: TouchEvent) => { if ((ref.current?.scrollTop ?? 1) <= 0) startY.current = e.touches[0].clientY; else startY.current = null }
  const onTouchMove = (e: TouchEvent) => {
    if (startY.current === null || refreshing) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 0 && (ref.current?.scrollTop ?? 1) <= 0) setPull(Math.min(120, dy * 0.6))
  }
  const onTouchEnd = () => {
    if (pull >= THRESHOLD && !refreshing) void onRefresh()
    setPull(0); startY.current = null
  }
  const onScroll = (_e: UIEvent) => { if ((ref.current?.scrollTop ?? 0) > 0) startY.current = null }
  const show = pull > 8 || refreshing
  return (
    <div
      ref={ref}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onScroll={onScroll}
      className={cn('scroll-thin relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden', className)}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className={cn('pointer-events-none flex items-center justify-center overflow-hidden text-ink-2 transition-[height]', !show && 'h-0')} style={{ height: show ? (refreshing ? 44 : pull) : 0 }} aria-live="polite">
        {refreshing ? (
          <span className="inline-flex items-center gap-2 text-[12.5px]"><LoaderCircle size={16} className={reduce ? '' : 'animate-spin'} strokeWidth={1.75} />{ms.home.refresh}</span>
        ) : (
          <motion.span className="inline-flex items-center gap-1.5 text-[12px]" animate={{ rotate: pull >= THRESHOLD ? 180 : 0 }}><ArrowDown size={14} strokeWidth={1.75} />{ms.home.pullHint}</motion.span>
        )}
      </div>
      {children}
    </div>
  )
}
