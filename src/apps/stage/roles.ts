/**
 * Sahna rollari: bitta ro'yxat demo paneli va Oltin yo'l avtopiloti uchun.
 * Rol → session patch → qaysi ekran ko'rinadi.
 */
import { staffIdForRole, useStore } from '@/store'
import { stageNav } from '@/lib/router'
import type { Role } from '@/domain/types'
import { uz } from '@/i18n/uz'
import { toast } from '@/design'

export type DesktopApp = 'admin' | 'partner' | 'bts'
export type StagePane = 'phone' | 'desktop'

export const STAGE_ROLES: Role[] = [
  'buyer', 'seller', 'super_admin', 'director', 'moderator', 'price_analyst', 'logistics', 'finance', 'operator', 'company', 'bts',
]

export function roleLabel(role: Role): string {
  return uz.admin.roles[role]
}

export function isClientRole(role: Role): role is 'buyer' | 'seller' {
  return role === 'buyer' || role === 'seller'
}

/** Which right-pane app a role lives in (client roles live on the phone → null). */
export function desktopFor(role: Role): DesktopApp | null {
  if (role === 'company') return 'partner'
  if (role === 'bts') return 'bts'
  if (isClientRole(role)) return null
  return 'admin'
}

export function paneFor(role: Role): StagePane {
  return isClientRole(role) ? 'phone' : 'desktop'
}

/** Apply a stage role to the session (the single place that knows the mapping). */
export function applyRole(role: Role) {
  const s = useStore.getState()
  toast.clear() // rol almashganda eski xabarlar yig'ilib qolmasin
  if (role === 'buyer') s.setSession({ userId: 'u-buyer', role })
  else if (role === 'seller') s.setSession({ userId: 'u-seller', role })
  else if (role === 'company' || role === 'bts') s.setSession({ role })
  else s.setSession({ role, staffId: staffIdForRole(role) })
  // Direktor rolida admin paneli darhol Direktor bo'limini ochadi
  if (role === 'director') queueMicrotask(() => stageNav.go('admin', '/director'))
}
