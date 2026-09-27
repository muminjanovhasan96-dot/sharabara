import type { PayoutStatus, Tiyin } from '../types'
import { createMachine } from './machine'

export const payoutMachine = createMachine<PayoutStatus>('payout', {
  pending: ['scheduled', 'awaiting_second_approval'],
  awaiting_second_approval: ['scheduled'],
  scheduled: ['paid'],
  paid: [],
})

/** 50 000 000 so'm in tiyin */
export const SECOND_APPROVAL_THRESHOLD: Tiyin = 5_000_000_000

export function needsSecondApproval(amountTiyin: Tiyin): boolean {
  return amountTiyin > SECOND_APPROVAL_THRESHOLD
}

/** First step from `pending` given the amount. */
export function firstPayoutStep(amountTiyin: Tiyin): PayoutStatus {
  return needsSecondApproval(amountTiyin) ? 'awaiting_second_approval' : 'scheduled'
}

export const PAYOUT_STATUS_UZ: Record<PayoutStatus, string> = {
  pending: 'Kutilmoqda', scheduled: 'Rejalashtirildi', awaiting_second_approval: 'Ikkinchi tasdiq kutilmoqda', paid: "To'landi",
}
