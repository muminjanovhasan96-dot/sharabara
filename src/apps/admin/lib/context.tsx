import { createContext, useContext } from 'react'
import type { AdminSection } from '@/domain/types'

export interface AdminCtx {
  root: HTMLElement | null
  embedded: boolean
  compact: boolean
  /** telefon qobig'i (kenglik < 640) */
  mobile: boolean
  width: number
  /** yon menyu badge'ini "pulsatsiya" qildirish */
  pulse: (section: AdminSection) => void
  openPalette: () => void
}
export const AdminContext = createContext<AdminCtx>({ root: null, embedded: false, compact: false, mobile: false, width: 1440, pulse: () => {}, openPalette: () => {} })
export function useAdmin() { return useContext(AdminContext) }
/** Drawer/Modal/Toaster uchun portal konteyneri (theme scope ichida qolishi uchun). */
export function useContainer(): HTMLElement | null { return useContext(AdminContext).root }
