import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn, haptic } from '@/lib/utils'
import { Seal } from './Seal'

export interface SealBurstProps {
  /** show / hide */
  show: boolean
  label?: string
  sub?: string
  /** lucide kebab icon; default "check" */
  icon?: string
  /** total ms before onDone; default 1600 */
  duration?: number
  onDone?: () => void
  /** absolute (inside phone) vs fixed overlay */
  className?: string
}

/** "Seal pressed" success: paper flash, radial ink ripple, gold seal stamping 1.4→1, label. */
export function SealBurst({ show, label, sub, icon = 'check', duration = 1600, onDone, className }: SealBurstProps) {
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!show) return
    haptic(20)
    const t = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(t)
  }, [show, duration, onDone])
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="assertive"
          className={cn('absolute inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden', className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          {/* paper flash */}
          <motion.div
            className="absolute inset-0 bg-paper"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0.94 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />
          {!reduce && (
            <motion.div
              className="absolute inset-0 bg-card"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              aria-hidden="true"
            />
          )}
          {/* ink ripple */}
          {!reduce && (
            <motion.span
              className="absolute h-[120px] w-[120px] rounded-full border-[1.5px] border-ink"
              initial={{ scale: 0.7, opacity: 0.55 }}
              animate={{ scale: 3.2, opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              aria-hidden="true"
            />
          )}
          {!reduce && (
            <motion.span
              className="absolute h-[120px] w-[120px] rounded-full border border-gold"
              initial={{ scale: 0.7, opacity: 0.7 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
              aria-hidden="true"
            />
          )}
          <motion.div
            className="relative"
            initial={reduce ? { opacity: 0 } : { scale: 1.4, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 420, damping: 26 }}
          >
            <Seal size={120} variant="gold" icon={icon} ticks />
          </motion.div>
          {label && (
            <motion.div
              className="relative mt-5 px-8 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.22, duration: 0.3 }}
            >
              <div className="font-display text-[20px] font-bold leading-tight text-ink">{label}</div>
              {sub && <div className="mt-1 text-[13px] text-ink-2">{sub}</div>}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
