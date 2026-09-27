import { useState } from 'react'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { Button, Modal, Money, Seal, usePhoneContainer } from '@/design'
import { uz } from '@/i18n/uz'
import type { PaymentMethod, Tiyin } from '@/domain/types'
import { TID } from '@/lib/testids'
import { ms } from '../strings'

export interface GatewayModalProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  amountTiyin: Tiyin
  method: PaymentMethod
  /** the actual API call; the spinner shows for at least 1.5 s */
  onPay: () => Promise<void>
  title?: string
  confirmTestId?: string
}

const PROVIDER: Record<PaymentMethod, { name: string; icon: string }> = {
  payme: { name: 'Payme', icon: 'credit-card' }, click: { name: 'Click', icon: 'smartphone' }, cash: { name: uz.checkout.pay.cash, icon: 'banknote' },
}

/** Soxta to’lov oynasi: karta raqami YO’Q — faqat summa + Tasdiqlash → 1,5 s spinner → API. */
export function GatewayModal(props: GatewayModalProps) {
  return <GatewayModalInner key={props.open ? 'open' : 'closed'} {...props} />
}

function GatewayModalInner({ open, onOpenChange, amountTiyin, method, onPay, title, confirmTestId }: GatewayModalProps) {
  const container = usePhoneContainer()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pay = async () => {
    setBusy(true); setError(null)
    try {
      await Promise.all([onPay(), new Promise((r) => setTimeout(r, 1500))])
    } catch (e) {
      setError(e instanceof Error ? e.message : uz.app.error); setBusy(false)
    }
  }
  const p = PROVIDER[method]
  return (
    <Modal open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o) }} container={container} title={title ?? ms.checkout.gatewayTitle} hideClose={busy} size="sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <Seal size={56} variant="ink" icon={p.icon} ticks />
        <div className="eyebrow">{p.name}</div>
        <div className="eyebrow !text-[10px]">{ms.checkout.gatewayAmount}</div>
        <Money tiyin={amountTiyin} size="display" softCurrency />
        <p className="m-0 max-w-[30ch] text-[12.5px] leading-snug text-ink-3">{method === 'cash' ? ms.checkout.gatewayCash : ms.checkout.gatewayNote}</p>
        {error && <p role="alert" className="m-0 text-[13px] text-brick">{error}</p>}
        {busy ? (
          <div className="flex h-11 items-center gap-2 text-[14px] text-ink-2" role="status">
            <LoaderCircle size={18} className="animate-spin" strokeWidth={1.75} />
            {uz.checkout.processing}
          </div>
        ) : (
          <Button data-testid={confirmTestId} variant="gold" size="lg" fullWidth onClick={pay} leading={<ShieldCheck strokeWidth={1.75} />}>{ms.checkout.payNow}</Button>
        )}
        <div className="text-[11px] text-ink-3">{uz.checkout.escrowNote}</div>
      </div>
    </Modal>
  )
}
export const PAY_CONFIRM_TID = TID.mPayConfirm
