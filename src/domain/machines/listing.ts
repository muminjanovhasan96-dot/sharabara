import type { ListingStatus } from '../types'
import { createMachine } from './machine'

export const listingMachine = createMachine<ListingStatus>('listing', {
  draft: ['submitted'],
  submitted: ['ai_checked'],
  ai_checked: ['in_review'],
  in_review: ['offer_sent', 'returned_for_edit', 'rejected_by_admin'],
  offer_sent: ['accepted', 'declined_by_seller'],
  accepted: ['published'],
  published: ['reserved', 'sold', 'expired', 'removed'],
  reserved: ['sold', 'published'],
  sold: [],
  returned_for_edit: ['submitted'],
  rejected_by_admin: [],
  declined_by_seller: ['submitted'],
  expired: ['published'],
  removed: [],
})

export const LISTING_STATUS_UZ: Record<ListingStatus, string> = {
  draft: 'Qoralama',
  submitted: 'Yuborildi',
  ai_checked: 'AI tekshirdi',
  in_review: "Ko'rib chiqilmoqda",
  offer_sent: 'Narx taklifi yuborildi',
  accepted: 'Qabul qilindi',
  published: "E'lon qilindi",
  reserved: 'Band qilindi',
  sold: 'Sotildi',
  returned_for_edit: 'Tahrirga qaytarildi',
  rejected_by_admin: 'Rad etildi',
  declined_by_seller: 'Sotuvchi rad etdi',
  expired: 'Muddati tugadi',
  removed: 'Olib tashlandi',
}
