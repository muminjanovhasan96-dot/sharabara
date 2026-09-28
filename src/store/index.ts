import { create } from 'zustand'
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { CartItem, DataSnapshot, ISODate, Role, StaffRole } from '@/domain/types'
import { generateSnapshot, seedFingerprint } from '@/seed'

export const STORE_KEY = 'sharabara-demo-v1'
export const DEFAULT_SEED = 2026

/** Demo "now" – a fixed weekday at 14:32 so the 17:00 cutoff story works. */
export function defaultNow(): ISODate {
  // 2026-09-24 is a Thursday → "Juma — to'lov kuni" is +1 day
  return new Date(2026, 8, 24, 14, 32, 0).toISOString()
}

export interface Session {
  /** the person using the mobile app */
  userId: string
  /** active staff for admin */
  staffId: string
  role: Role
  companyId: string
  theme: 'light' | 'dark'
}

export interface UiState {
  cart: CartItem[]
  savedListingIds: string[]
  savedProductIds: string[]
  recentSearches: string[]
  readNotifIds: string[]
  compact: boolean
}

export interface StoreState {
  data: DataSnapshot
  session: Session
  clock: { now: ISODate; dayOffset: number }
  ui: UiState
  /** increments on every mutation; used for sync + memo invalidation */
  version: number
  /** persist'dagi seed barmoq izi — mos kelmasa ma'lumot avtomatik yangilanadi */
  seedFp: string
  /** avtomatik yangilanish bo'ldi — ilova bir marta xabar ko'rsatadi */
  resetNotice: boolean
  clearResetNotice: () => void
  /** random per-tab id to avoid echo loops */
  tabId: string
  // actions
  update: (recipe: (d: DataSnapshot) => void) => void
  setSession: (patch: Partial<Session>) => void
  setUi: (recipe: (u: UiState) => void) => void
  setClock: (now: ISODate) => void
  reset: (seed?: number) => void
  /** apply a full state coming from another tab */
  applyRemote: (s: Pick<StoreState, 'data' | 'clock' | 'ui' | 'version'>) => void
}

const ROLE_STAFF: Record<StaffRole, string> = {
  super_admin: 's-super', director: 's-dir', moderator: 's-mod', price_analyst: 's-price',
  logistics: 's-log', finance: 's-fin', operator: 's-op',
}
export function staffIdForRole(role: Role): string {
  return (ROLE_STAFF as Record<string, string>)[role] ?? 's-super'
}

function initialUi(): UiState {
  return { cart: [], savedListingIds: [], savedProductIds: [], recentSearches: ['iphone 13', 'noutbuk', 'divan'], readNotifIds: [], compact: false }
}

function initialSession(): Session {
  return { userId: 'u-buyer', staffId: 's-super', role: 'super_admin', companyId: 'c-namuna', theme: 'light' }
}

/** Joriy kod uchun seed barmoq izi (bir marta hisoblanadi). */
const CURRENT_FP = seedFingerprint(generateSnapshot(DEFAULT_SEED, defaultNow()))

export const useStore = create<StoreState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        data: generateSnapshot(DEFAULT_SEED, defaultNow()),
        session: initialSession(),
        clock: { now: defaultNow(), dayOffset: 0 },
        ui: initialUi(),
        version: 0,
        seedFp: CURRENT_FP,
        resetNotice: false,
        clearResetNotice: () => set((s) => { s.resetNotice = false }),
        tabId: Math.random().toString(36).slice(2, 10),
        update: (recipe) => set((s) => { recipe(s.data); s.version += 1 }),
        setSession: (patch) => set((s) => { Object.assign(s.session, patch) }),
        setUi: (recipe) => set((s) => { recipe(s.ui); s.version += 1 }),
        setClock: (now) => set((s) => { s.clock.now = now; s.version += 1 }),
        reset: (seed = DEFAULT_SEED) => set((s) => {
          s.data = generateSnapshot(seed, defaultNow())
          s.clock = { now: defaultNow(), dayOffset: 0 }
          s.ui = initialUi()
          s.version += 1
          s.seedFp = seed === DEFAULT_SEED ? CURRENT_FP : `seed-${seed}:${CURRENT_FP}`
        }),
        applyRemote: (r) => set((s) => {
          s.data = r.data; s.clock = r.clock; s.ui = r.ui; s.version = r.version
        }),
      })),
      {
        name: STORE_KEY,
        version: 2,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ data: s.data, session: s.session, clock: s.clock, ui: s.ui, version: s.version, seedFp: s.seedFp }),
        /** Eski persist: seed barmoq izi mos kelmasa (yoki yo'q bo'lsa) — ma'lumot, soat va savat yangi seed'dan; sessiya (rol, mavzu) saqlanadi. */
        merge: (persisted, current) => {
          const p = (persisted ?? {}) as Partial<Pick<StoreState, 'data' | 'session' | 'clock' | 'ui' | 'version' | 'seedFp'>>
          const fp = p.seedFp ?? ''
          const sameSeed = fp === CURRENT_FP || (fp.startsWith('seed-') && fp.endsWith(`:${CURRENT_FP}`))
          if (p.data && sameSeed) return { ...current, ...p } as StoreState
          return { ...current, session: { ...current.session, ...p.session }, resetNotice: Boolean(p.data) }
        },
        /** persist versiyasi eskirgan bo'lsa ham merge o'zi hal qiladi */
        migrate: (persisted) => persisted as never,
      },
    ),
  ),
)

// ─── Selectors (cheap, memo-friendly) ─────────────────────────────────────
export const selectData = (s: StoreState) => s.data
export const selectNow = (s: StoreState) => s.clock.now
export const selectSession = (s: StoreState) => s.session
export const selectUser = (s: StoreState) => s.data.users.find((u) => u.id === s.session.userId)!
export const selectStaff = (s: StoreState) => s.data.staff.find((u) => u.id === s.session.staffId) ?? s.data.staff[0]

/** Convenience hook: read a slice of data with shallow selector. */
export function useData<T>(selector: (d: DataSnapshot) => T): T {
  return useStore((s) => selector(s.data))
}
export function useNow(): ISODate { return useStore(selectNow) }
export function useSession(): Session { return useStore(selectSession) }
