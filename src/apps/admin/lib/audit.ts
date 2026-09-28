/**
 * Audit yozuvlarini odam tilida ko'rsatish: maydon nomi, obyekt turi va qiymat (tiyin → so'm, status → o'zbekcha).
 * Ekranda hech qachon kod nomi (priceTiyin, packing) yoki xom tiyin (623500000) ko'rinmasin.
 */
import type { AuditEntry } from '@/domain/types'
import { formatMoney } from '@/domain/money'
import { formatDemoTime } from '@/domain/clock'
import { uz } from '@/i18n/uz'
import { A } from '../strings'

const FIELD: Record<string, string> = {
  status: 'Holat', priceTiyin: 'Narx', offer: 'Narx taklifi', blocked: 'Bloklash', role: 'Rol', discountRate: 'Sharabara qoidasi',
  now: 'Demo vaqti', moderation: 'Moderatsiya', boost: 'E’lonni ko’tarish', fee: 'Xizmat haqi', payment: 'To’lov', decision: 'Qaror',
  commissionRate: 'Komissiya', verifiedSeller: 'Tasdiqlangan sotuvchi', problem: 'Muammo', transfer: 'Ko’chirish', qty: 'Miqdor',
  created: 'Yaratildi', stock: 'Zaxira', import: 'Excel import', check: 'Narx tekshiruvi', promo: 'Aksiya', rules: 'Qoidalar',
  revoked: 'Bekor qilindi', maxNewRatio: 'Yangi narx chegarasi', name: 'Nomi', rating: 'Baho', note: 'Izoh',
}
const ENTITY: Record<string, string> = {
  listing: 'E’lon', order: 'Buyurtma', subOrder: 'Yuk', payout: 'To’lov', user: 'Foydalanuvchi', company: 'Kompaniya', product: 'Tovar',
  manifest: 'Kechki partiya', return: 'Qaytarish', feeRuleSet: 'Haq qoidalari', role: 'Rol', staff: 'Xodim', category: 'Kategoriya',
  campaign: 'Xabar kampaniyasi', receipt: 'Kirim', stock: 'Zaxira', apiKey: 'API kaliti', clock: 'Demo soati',
}
const PAYOUT: Record<string, string> = { pending: 'Kutilmoqda', scheduled: 'Rejalashtirildi', awaiting_second_approval: 'Ikkinchi tasdiq kutilmoqda', paid: 'To’landi' }
const MANIFEST: Record<string, string> = { open: 'Ochiq', closed: 'Yopildi', picked_up: 'BTS olib ketdi' }
const ORDER: Record<string, string> = { created: 'Yaratildi', paid: 'To’landi', completed: 'Yakunlandi', cancelled: 'Bekor qilindi' }
const RETURN: Record<string, string> = { requested: 'So’ralgan', approved_full: 'To’liq qaytariladi', approved_partial: 'Qisman qaytariladi', denied: 'Rad etildi', refunded: 'Qaytarildi' }
const RECEIPT: Record<string, string> = { expected: 'Kutilmoqda', received: 'Qabul qilindi', checked: 'Tekshirildi' }
const GENERIC: Record<string, string> = { draft: 'Qoralama', published: 'E’lon qilingan', active: 'Faol', onboarding: 'Ulanmoqda', suspended: 'To’xtatilgan', sent: 'Yuborildi', scheduled: 'Rejalashtirildi', passed: 'O’tdi', overpriced: 'Qimmat', pending: 'Kutilmoqda', true: 'Ha', false: 'Yo’q' }

export function auditField(field: string): string { return FIELD[field] ?? field }
export function auditEntity(entity: string): string { return ENTITY[entity] ?? entity }

function statusLabel(entity: string, v: string): string {
  const listing = uz.listing.status as Record<string, string>
  const sub = uz.orders.status as Record<string, string>
  switch (entity) {
    case 'listing': return listing[v] ?? GENERIC[v] ?? v
    case 'subOrder': return sub[v] ?? GENERIC[v] ?? v
    case 'order': return ORDER[v] ?? sub[v] ?? GENERIC[v] ?? v
    case 'payout': return PAYOUT[v] ?? GENERIC[v] ?? v
    case 'manifest': return MANIFEST[v] ?? GENERIC[v] ?? v
    case 'return': return RETURN[v] ?? GENERIC[v] ?? v
    case 'receipt': return RECEIPT[v] ?? GENERIC[v] ?? v
    case 'product': return (A.common.productCheck as Record<string, string>)[v] ?? GENERIC[v] ?? v
    case 'company': return (A.common.companyStatus as Record<string, string>)[v] ?? GENERIC[v] ?? v
    default: return GENERIC[v] ?? v
  }
}

/** Qiymatni odam tilida: pul → so'm, foiz → %, status → o'zbekcha, vaqt → "25-sen, 11:00". */
export function auditValue(a: Pick<AuditEntry, 'entity' | 'field' | 'kind'>, v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—'
  const f = a.field
  if (typeof v === 'number') {
    if (f.endsWith('Tiyin') || f === 'fee' || f === 'boost' || f === 'payment' || f === 'offer' || f === 'amount') return formatMoney(v)
    if (f.endsWith('Rate') || f === 'maxNewRatio') return `${Math.round(v * 1000) / 10}%`
    if (Math.abs(v) >= 10_000_000) return formatMoney(v) // xom tiyin — 100 000 so'mdan katta summa
    return String(v)
  }
  const s = String(v)
  if (f === 'status' || f === 'check' || f === 'moderation') return statusLabel(a.entity, s)
  if (f === 'role') return (uz.admin.roles as Record<string, string>)[s] ?? s
  if (f === 'now' || /^\d{4}-\d{2}-\d{2}T/.test(s)) return formatDemoTime(s)
  if (/^-?\d{8,}$/.test(s)) return formatMoney(Number(s))
  if (GENERIC[s] && (f === 'blocked' || f === 'verifiedSeller' || f === 'revoked')) return GENERIC[s]
  return s
}
