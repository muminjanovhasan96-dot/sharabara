import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn, SPRING } from '@/lib/utils'
import { uz } from '@/i18n/uz'

export type DrawerWidth = 'md' | 'lg'
const WIDTH: Record<DrawerWidth, number> = { md: 520, lg: 760 }

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  eyebrow?: ReactNode
  /** header right-side actions */
  actions?: ReactNode
  footer?: ReactNode
  width?: DrawerWidth
  container?: HTMLElement | null
  className?: string
  bodyClassName?: string
  children?: ReactNode
  closeLabel?: string
}

/** Desktop right-side drawer (Radix Dialog) with spring slide-in. */
export function Drawer({
  open, onOpenChange, title, eyebrow, actions, footer, width = 'md', container, className, bodyClassName, children,
  closeLabel = uz.app.close,
}: DrawerProps) {
  const reduce = useReducedMotion()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount container={container ?? undefined}>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-[rgba(12,17,24,0.42)]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className={cn(
                  'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card text-ink shadow-soft outline-none',
                  className,
                )}
                style={{ maxWidth: WIDTH[width] }}
                initial={reduce ? { opacity: 0 } : { x: '100%' }}
                animate={reduce ? { opacity: 1 } : { x: 0 }}
                exit={reduce ? { opacity: 0 } : { x: '100%' }}
                transition={reduce ? { duration: 0.15 } : SPRING}
              >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-4">
                  <div className="min-w-0">
                    {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
                    {title ? (
                      <Dialog.Title className="m-0 font-display text-[20px] leading-tight">{title}</Dialog.Title>
                    ) : (
                      <Dialog.Title className="sr-only">{closeLabel}</Dialog.Title>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {actions}
                    <Dialog.Close
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-2 hover:bg-paper-2"
                      aria-label={closeLabel}
                    >
                      <X size={18} strokeWidth={1.75} />
                    </Dialog.Close>
                  </div>
                </div>
                <div className={cn('scroll-thin min-h-0 flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>
                {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-6 py-3">{footer}</div>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
