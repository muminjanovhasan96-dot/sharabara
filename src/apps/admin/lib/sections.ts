import type { AdminSection, DataSnapshot, Listing, Permission, Role, StaffRole } from '@/domain/types'
import { uz } from '@/i18n/uz'
import { useStore } from '@/store'
import { dateKey } from '@/domain/clock'

export const SECTIONS: AdminSection[] = [
  'dashboard', 'director', 'moderation', 'pricing', 'categories', 'orders', 'logistics', 'warehouse', 'payments', 'fees', 'returns',
  'companies', 'products', 'users', 'campaigns', 'reports', 'roles', 'audit',
]
export function isSection(s: string | undefined): s is AdminSection { return !!s && (SECTIONS as string[]).includes(s) }

export const SECTION_ICON: Record<AdminSection, string> = {
  dashboard: 'layout-dashboard', moderation: 'shield-check', pricing: 'badge-percent', categories: 'folder-tree',
  orders: 'shopping-bag', logistics: 'truck', payments: 'wallet', fees: 'receipt', returns: 'rotate-ccw',
  companies: 'building', products: 'package', users: 'users', campaigns: 'megaphone', reports: 'chart-column',
  roles: 'key-round', audit: 'scroll-text', warehouse: 'warehouse', director: 'gauge',
}

export interface NavGroup { key: string; label: string | null; items: AdminSection[] }
export const NAV_GROUPS: NavGroup[] = [
  { key: 'home', label: null, items: ['dashboard', 'director'] },
  { key: 'listings', label: uz.admin.groups.listings, items: ['moderation', 'pricing', 'categories'] },
  { key: 'sales', label: uz.admin.groups.sales, items: ['orders', 'logistics', 'warehouse', 'payments', 'fees', 'returns'] },
  { key: 'mall', label: uz.admin.groups.mall, items: ['companies', 'products'] },
  { key: 'system', label: uz.admin.groups.system, items: ['users', 'campaigns', 'reports', 'roles', 'audit'] },
]
export function groupOf(section: AdminSection): NavGroup | undefined { return NAV_GROUPS.find((g) => g.items.includes(section)) }
export function sectionTitle(s: AdminSection): string { return uz.admin.sections[s] }

export interface Access { view: boolean; edit: boolean; approve: boolean }
export function accessFor(perms: Permission[] | undefined): Access {
  const p = perms ?? []
  return { view: p.includes('view'), edit: p.includes('edit'), approve: p.includes('approve') }
}
/** Joriy rol uchun bo'lim huquqlari (jonli: rol yoki matritsa o'zgarsa yangilanadi). */
/**
 * Admin panelidagi joriy rol. Sahnada telefon roli (xaridor/sotuvchi) yoki hamkor roli tanlanganda
 * admin qulflanib qolmasin — bunday holda kirgan xodimning o'z roli ishlatiladi.
 */
export function selectAdminRole(s: { session: { role: Role; staffId: string }; data: { staff: { id: string; role: StaffRole }[] } }): StaffRole {
  const r = s.session.role
  if (r === 'buyer' || r === 'seller' || r === 'company' || r === 'bts') {
    return (s.data.staff.find((x) => x.id === s.session.staffId) ?? s.data.staff[0]).role
  }
  return r as StaffRole
}
export function useAdminRole(): StaffRole { return useStore(selectAdminRole) }

export function useAccess(section: AdminSection): Access {
  const perms = useStore((s) => s.data.roleMatrix[selectAdminRole(s) as keyof typeof s.data.roleMatrix]?.[section])
  return accessFor(perms)
}
export function useVisibleSections(): AdminSection[] {
  const role = useAdminRole()
  const matrix = useStore((s) => s.data.roleMatrix)
  const rm = matrix[role as keyof typeof matrix]
  return SECTIONS.filter((s) => rm?.[s]?.includes('view'))
}

export function isModerated(l: Listing): boolean { return Boolean((l as Listing & { moderated?: boolean }).moderated) }

/** Yon menyu badge'lari — navbat hajmlari. */
export function queueCounts(d: DataSnapshot, now: string): Partial<Record<AdminSection, number>> {
  const today = dateKey(now)
  const subs = d.orders.flatMap((o) => o.subOrders.map((so) => ({ so, o })))
  const openManifest = d.manifests.find((m) => m.status === 'open')
  return {
    moderation: d.listings.filter((l) => (l.status === 'in_review' || l.status === 'submitted') && !l.historical && !isModerated(l)).length,
    pricing: d.listings.filter((l) => l.status === 'in_review' && !l.historical).length,
    fees: d.feeApprovals.filter((a) => a.status === 'pending').length,
    orders: subs.filter((x) => x.so.status === 'packing').length,
    logistics: subs.filter((x) => (x.so.status === 'packing' || x.so.status === 'packed') && (dateKey(x.o.createdAt) === today || openManifest?.subOrderIds.includes(x.so.id) || x.so.status === 'packing')).length,
    payments: d.payouts.filter((p) => p.status === 'pending' || p.status === 'awaiting_second_approval').length,
    returns: d.returns.filter((r) => r.status === 'requested').length,
    products: d.products.filter((p) => p.check === 'pending' || p.check === 'overpriced').length,
  }
}
