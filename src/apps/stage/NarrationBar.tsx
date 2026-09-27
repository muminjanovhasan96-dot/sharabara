/**
 * Pastki izoh paneli — sahnaning «diktori». Bo'sh holatda sahna nima ekanini tushuntiradi,
 * Oltin yo'l paytida joriy qadam nomi, izohi va boshqaruv tugmalari shu yerda (ekranlarni yopmaydi).
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, Hand, Pause, Play, Sparkles, Square } from 'lucide-react'
import { uz, t } from '@/i18n/uz'
import { TID, TID_EXTRA } from '@/lib/testids'
import { cn, SPRING } from '@/lib/utils'
import { Seal } from '@/design'
import { GOLDEN_STEPS, goldenRunner, useGolden } from './golden'
import { stageToast } from './toasts'

const BTN = 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-fill disabled:opacity-40'
const BTN_SOLID = cn(BTN, 'border-line bg-card text-ink hover:bg-paper-2')
const BTN_GHOST = cn(BTN, 'border-transparent bg-transparent text-ink-2 hover:bg-paper-2 hover:text-ink')

function Dots({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <motion.span
          key={i}
          className={cn('block h-1.5 rounded-full', i < index ? 'bg-gold-fill/60' : i === index ? 'bg-gold-fill' : 'bg-line-strong/60')}
          animate={{ width: i === index ? 16 : 5 }}
          transition={SPRING}
        />
      ))}
    </div>
  )
}

export function NarrationBar({ onGolden, className }: { onGolden: () => void; className?: string }) {
  const g = useGolden()
  const reduce = useReducedMotion()
  const active = g.status === 'running' || g.status === 'paused' || g.status === 'error'
  const step = GOLDEN_STEPS[g.index]

  return (
    <div
      data-testid={active ? TID_EXTRA.stageCaption : undefined}
      className={cn(
        'relative flex h-[76px] shrink-0 items-center gap-4 overflow-hidden rounded-[16px] border bg-card pl-4 pr-3 shadow-soft transition-colors',
        active ? 'border-gold/40' : 'border-line',
        className,
      )}
    >
      {active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[4px] bg-gold-fill" />}
      <Seal
        size={40}
        variant="gold"
        icon={g.status === 'error' ? 'triangle-alert' : active ? (g.pane === 'phone' ? 'smartphone' : 'monitor') : 'sparkles'}
        className="shrink-0"
      />

      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {active && step ? (
            <motion.div
              key={step.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center gap-2.5">
                <span data-testid={TID_EXTRA.stageGoldenStep} className="eyebrow shrink-0 !text-gold">{t(uz.demo.step, { i: g.index + 1, n: g.total })}</span>
                <h2 className="m-0 min-w-0 truncate font-display text-[15px] leading-tight text-ink">{step.title}</h2>
              </div>
              <p className="clamp-2 mt-0.5 text-[12.5px] leading-[1.35] text-ink-2">{g.status === 'error' ? `${uz.app.error}: ${g.error}` : step.caption}</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <div className="font-display text-[15px] leading-tight text-ink">{uz.demo.idleTitle}</div>
              <p className="clamp-2 mt-0.5 text-[12.5px] leading-[1.35] text-ink-2">{uz.demo.idleHint}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {active ? (
        <div className="flex shrink-0 items-center gap-3">
          <Dots index={g.index} total={g.total} />
          <div className="flex items-center gap-1.5">
            <button type="button" data-testid={TID.stageGoldenPause} onClick={() => (g.status === 'paused' ? goldenRunner.resume() : goldenRunner.pause())} disabled={g.status === 'error'} className={BTN_SOLID}>
              {g.status === 'paused' ? <Play size={14} strokeWidth={1.75} /> : <Pause size={14} strokeWidth={1.75} />}
              {g.status === 'paused' ? uz.demo.resume : uz.demo.pause}
            </button>
            <button type="button" data-testid={TID.stageGoldenNext} onClick={() => goldenRunner.next()} disabled={g.status === 'error'} className={BTN_SOLID}>
              {uz.demo.next}<ChevronRight size={14} strokeWidth={1.75} />
            </button>
            <button type="button" title={uz.demo.manual} onClick={() => { goldenRunner.stop('idle'); stageToast.show(uz.demo.manual, uz.demo.stopped, { icon: 'hand' }) }} className={BTN_GHOST}>
              <Hand size={14} strokeWidth={1.75} /><span className="hidden min-[1400px]:inline">{uz.demo.manual}</span>
            </button>
            <button type="button" title={uz.demo.stop} onClick={() => goldenRunner.stop('idle')} className={BTN_GHOST}>
              <Square size={13} strokeWidth={1.75} /><span className="hidden min-[1400px]:inline">{uz.demo.stop}</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onGolden}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-gold-fill px-3 text-[13px] font-semibold text-ink shadow-[0_8px_18px_-8px_rgba(245,180,0,.75)] outline-none transition hover:brightness-[1.04] focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Sparkles size={15} strokeWidth={1.75} />{uz.demo.golden}
        </button>
      )}
    </div>
  )
}
