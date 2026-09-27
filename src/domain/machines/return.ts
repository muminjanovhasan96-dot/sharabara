import type { ReturnStatus } from '../types'
import { createMachine } from './machine'

export const returnMachine = createMachine<ReturnStatus>('return', {
  requested: ['approved_full', 'approved_partial', 'denied'],
  approved_full: ['refunded'],
  approved_partial: ['refunded'],
  denied: [],
  refunded: [],
})

export const RETURN_STATUS_UZ: Record<ReturnStatus, string> = {
  requested: "So'rov yuborildi", approved_full: "To'liq tasdiqlandi", approved_partial: 'Qisman tasdiqlandi',
  denied: 'Rad etildi', refunded: 'Pul qaytarildi',
}
