import type { OrderStatus, SubOrderStatus } from '../types'
import { createMachine } from './machine'

export const orderMachine = createMachine<OrderStatus>('order', {
  created: ['paid', 'cancelled'],
  paid: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
})

export const subOrderMachine = createMachine<SubOrderStatus>('sub_order', {
  packing: ['packed', 'cancelled'],
  packed: ['handed_to_bts', 'cancelled'],
  handed_to_bts: ['in_transit'],
  in_transit: ['at_branch'],
  at_branch: ['delivered'],
  delivered: ['payout_scheduled', 'return_requested'],
  payout_scheduled: ['payout_paid'],
  payout_paid: [],
  cancelled: [],
  return_requested: ['return_approved', 'return_denied'],
  return_approved: ['refunded'],
  return_denied: ['payout_scheduled'],
  refunded: [],
})

export const SUB_ORDER_STATUS_UZ: Record<SubOrderStatus, string> = {
  packing: 'Qadoqlanmoqda',
  packed: 'Qadoqlandi',
  handed_to_bts: 'BTSga topshirildi',
  in_transit: "Yo'lda",
  at_branch: 'Filialda',
  delivered: 'Yetkazildi',
  payout_scheduled: "To'lov rejalashtirildi",
  payout_paid: "To'lov o'tkazildi",
  cancelled: 'Bekor qilindi',
  return_requested: "Qaytarish so'raldi",
  return_approved: 'Qaytarish tasdiqlandi',
  return_denied: 'Qaytarish rad etildi',
  refunded: 'Pul qaytarildi',
}

export const ORDER_STATUS_UZ: Record<OrderStatus, string> = {
  created: 'Yaratildi', paid: "To'landi", completed: 'Yakunlandi', cancelled: 'Bekor qilindi',
}

/** Happy path used by the demo timeline. */
export const SUB_ORDER_HAPPY_PATH: SubOrderStatus[] = [
  'packing', 'packed', 'handed_to_bts', 'in_transit', 'at_branch', 'delivered', 'payout_scheduled', 'payout_paid',
]
