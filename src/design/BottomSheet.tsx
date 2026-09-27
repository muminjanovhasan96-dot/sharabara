import { useRef } from 'react'
import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { cn, SPRING } from '@/lib/utils'
import { uz } from '@/i18n/uz'

export type SheetSnap = 'half' | 'full' | 'auto'

export interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  /** eyebrow above the title */
  eyebrow?: ReactNode
  footer?: ReactNode
  /** `half` = 50%, `full` = 92%, `auto` = content height (max 92%) */
  snap?: SheetSnap
  /** Portal target — pass the phone screen element so the sheet renders inside the frame. Default: body. */
  container?: HTMLElement | null
  /** show the X close button */
  closeButton?: boolean
  className?: string
  bodyClassName?: string
  children?: ReactNode
  closeLabel?: string
}

const SNAP_H: Record<SheetSnap, string> = { half: '50%', full: '92%', auto: 'auto' }

/**
 * Mobile bottom sheet on Radix Dialog. Drag the handle/header down to close.
 * Uses position:absolute when a container is given (fits a phone frame), fixed otherwise.
 */
export function BottomSheet({
  open, onOpenChange, title, eyebrow, footer, snap = 'half', container, closeButton = true,
  className, bodyClassName, children, closeLabel = uz.app.close,
}: BottomSheetProps) {
  const reduce = useReducedMotion()
  const controls = useDragControls()
  const inContainer = Boolean(container)
  const pos = inContainer ? 'absolute' : 'fixed'
  const sheetRef = useRef<HTMLDivElement>(null)

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const h = sheetRef.current?.offsetHeight ?? 400
    if (info.offset.y > Math.min(140, h * 0.3) || info.velocity.y > 700) onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount container={container ?? undefined}>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className={cn(pos, 'inset-0 z-40 bg-[rgba(12,17,24,0.42)]')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                ref={sheetRef}
                className={cn(
                  pos,
                  'inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-[22px] bg-card text-ink shadow-[var(--shadow-sheet)] outline-none',
                  'border-t border-line',
                  className,
                )}
                style={{ height: SNAP_H[snap], maxHeight: '92%' }}
                initial={reduce ? { opacity: 0 } : { y: '100%' }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: '100%' }}
                transition={reduce ? { duration: 0.15 } : SPRING}
                drag={reduce ? false : 'y'}
                dragListener={false}
                dragControls={controls}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={onDragEnd}
              >
                <div
                  className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
                  onPointerDown={(e) => controls.start(e)}
                >
                  <div className="flex justify-center pb-1 pt-2.5" aria-hidden="true">
                    <span className="h-[5px] w-10 rounded-full bg-line-strong" />
                  </div>
                  {(title || eyebrow || closeButton) && (
                    <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-1">
                      <div className="min-w-0">
                        {eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>}
                        {title ? (
                          <Dialog.Title className="m-0 font-display text-[18px] leading-tight">{title}</Dialog.Title>
                        ) : (
                          <Dialog.Title className="sr-only">{closeLabel}</Dialog.Title>
                        )}
                      </div>
                      {closeButton && (
                        <Dialog.Close
                          className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2"
                          aria-label={closeLabel}
                        >
                          <X size={20} strokeWidth={1.75} />
                        </Dialog.Close>
                      )}
                    </div>
                  )}
                </div>
                <div className={cn('scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pb-5', bodyClassName)}>{children}</div>
                {footer && <div className="shrink-0 border-t border-line bg-card px-5 py-3 pb-safe">{footer}</div>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
