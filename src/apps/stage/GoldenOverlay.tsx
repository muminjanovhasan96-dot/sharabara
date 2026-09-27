/**
 * Oltin yo'l qatlami: soxta kursor (ink doira + oltin halqa) va yakuniy InkCard.
 * Qadam izohi va boshqaruv tugmalari NarrationBar'da (ekranlarni yopmaydi).
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { uz } from '@/i18n/uz'
import { TID_EXTRA } from '@/lib/testids'
import { SPRING } from '@/lib/utils'
import { Button, InkCard, Seal } from '@/design'
import { goldenRunner, useGolden } from './golden'

function FakeCursor() {
  const { cursor, fast } = useGolden()
  const reduce = useReducedMotion()
  return (
    <motion.div
      aria-hidden="true"
      data-testid="stage-cursor"
      className="pointer-events-none fixed left-0 top-0 z-[85]"
      initial={false}
      animate={{ x: cursor.x - 14, y: cursor.y - 14, opacity: cursor.visible ? 1 : 0, scale: cursor.visible ? 1 : 0.6 }}
      transition={reduce || fast ? { duration: 0.1 } : { type: 'spring', stiffness: 170, damping: 24, mass: 0.9 }}
    >
      <div className="relative h-7 w-7">
        <span className="absolute inset-0 rounded-full border-[1.5px] border-gold-fill" />
        <span className="absolute inset-[5px] rounded-full shadow-[0_2px_8px_rgba(0,0,0,.35)]" style={{ background: '#0f1f3a' }} />
        <AnimatePresence>
          {cursor.clicks > 0 && (
            <motion.span
              key={cursor.clicks}
              className="absolute inset-0 rounded-full border-2 border-gold-fill"
              initial={{ scale: 0.6, opacity: 0.9 }}
              animate={{ scale: 2.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function GoldenOverlay() {
  const g = useGolden()
  const reduce = useReducedMotion()

  return (
    <>
      <FakeCursor />

      {/* final card */}
      <AnimatePresence>
        {g.status === 'done' && (
          <motion.div
            key="done"
            className="fixed inset-0 z-[82] flex items-center justify-center bg-ink/30 p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          >
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={SPRING}
            >
              <InkCard data-testid={TID_EXTRA.stageGoldenDone} padding="lg" className="w-[min(560px,90vw)] border border-paper/10 shadow-[0_30px_80px_-24px_rgba(0,0,0,.7)]">
                <div className="flex items-start gap-5">
                  <Seal size={80} variant="gold" icon="stamp" ticks />
                  <div className="min-w-0 flex-1">
                    <div className="eyebrow !text-gold-fill">{uz.demo.golden} · yakun</div>
                    <h2 className="mt-2 font-display text-[26px] leading-tight text-paper">Bitta tovar — 5 rol — 0 ta qo’lda taksi.</h2>
                    <p className="mt-2 text-[15px] leading-snug text-paper/75">Har qadam audit logda.</p>
                    <div className="mt-5 grid grid-cols-3 gap-3 text-paper">
                      {[['6 200 000', 'AI narxi'], ['186 000', 'xizmat haqi'], ['6 014 000', 'sotuvchiga']].map(([v, l]) => (
                        <div key={l} className="rounded-[12px] border border-paper/10 bg-paper/[.05] px-3 py-2.5">
                          <div className="tnum font-display text-[17px] leading-none">{v}</div>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-paper/55">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex justify-end">
                      <Button variant="gold" onClick={() => goldenRunner.dismiss()}>{uz.app.close}</Button>
                    </div>
                  </div>
                </div>
              </InkCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
