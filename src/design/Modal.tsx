import { useState } from 'react'
import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { TriangleAlert, X } from 'lucide-react'
import { cn, SPRING } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { Button } from './Button'
import { Field, Textarea } from './Input'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  container?: HTMLElement | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: ReactNode
  closeLabel?: string
  /** hide X button */
  hideClose?: boolean
}

const SIZE = { sm: 400, md: 520, lg: 680 }

/** Centered dialog (Radix). Inside a container it positions absolutely. */
export function Modal({
  open, onOpenChange, title, description, footer, container, size = 'sm', className, children,
  closeLabel = uz.app.close, hideClose = false,
}: ModalProps) {
  const reduce = useReducedMotion()
  const pos = container ? 'absolute' : 'fixed'
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount container={container ?? undefined}>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className={cn(pos, 'inset-0 z-40 bg-[rgba(12,17,24,0.42)]')}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>
            <div className={cn(pos, 'inset-0 z-50 flex items-center justify-center p-4 pointer-events-none')}>
              <Dialog.Content asChild forceMount aria-describedby={description ? undefined : undefined}>
                <motion.div
                  className={cn('pointer-events-auto w-full rounded-card-lg border border-line bg-card p-5 text-ink shadow-soft outline-none', className)}
                  style={{ maxWidth: SIZE[size] }}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 4 }}
                  transition={reduce ? { duration: 0.15 } : SPRING}
                >
                  <div className="flex items-start justify-between gap-3">
                    {title ? (
                      <Dialog.Title className="m-0 font-display text-[18px] leading-tight">{title}</Dialog.Title>
                    ) : (
                      <Dialog.Title className="sr-only">{closeLabel}</Dialog.Title>
                    )}
                    {!hideClose && (
                      <Dialog.Close
                        className="-mr-2 -mt-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-ink-2 hover:bg-paper-2"
                        aria-label={closeLabel}
                      >
                        <X size={18} strokeWidth={1.75} />
                      </Dialog.Close>
                    )}
                  </div>
                  {description && (
                    <Dialog.Description className="mt-1.5 text-[14px] leading-snug text-ink-2">{description}</Dialog.Description>
                  )}
                  {children && <div className="mt-4">{children}</div>}
                  {footer && <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'destructive'
  /** show a required reason textarea; onConfirm receives the trimmed reason */
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  reasonError?: string
  onConfirm: (reason?: string) => void | Promise<void>
  loading?: boolean
  container?: HTMLElement | null
}

/** Confirmation dialog; destructive tone uses brick and can demand a reason. State resets on each open. */
export function ConfirmDialog(props: ConfirmDialogProps) {
  return <ConfirmDialogInner key={props.open ? 'open' : 'closed'} {...props} />
}

function ConfirmDialogInner({
  open, onOpenChange, title, description, confirmLabel = uz.app.confirm, cancelLabel = uz.app.cancel,
  tone = 'default', requireReason = false, reasonLabel = uz.app.reason, reasonPlaceholder, reasonError = uz.app.reasonRequired,
  onConfirm, loading = false, container,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const invalid = requireReason && reason.trim().length < 3
  const submit = () => {
    setTouched(true)
    if (invalid) return
    void onConfirm(requireReason ? reason.trim() : undefined)
  }
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      container={container}
      title={
        <span className="inline-flex items-center gap-2">
          {tone === 'destructive' && <TriangleAlert size={18} strokeWidth={1.75} className="text-brick" aria-hidden="true" />}
          {title}
        </span>
      }
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>{cancelLabel}</Button>
          <Button variant={tone === 'destructive' ? 'danger' : 'primary'} onClick={submit} loading={loading} disabled={touched && invalid}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {requireReason && (
        <Field label={reasonLabel} required error={touched && invalid ? reasonError : undefined}>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={reasonPlaceholder}
            rows={3}
            invalid={touched && invalid}
            autoFocus
          />
        </Field>
      )}
    </Modal>
  )
}
