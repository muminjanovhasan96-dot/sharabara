/**
 * Direktor paneli konteksti: tab, davr (`?period=`), filtr (`?f=`), havola rejimi.
 * Standalone (/direktor) — tab yo'l orqali; admin ichida (/admin/director) — `?tab=` orqali.
 */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { PeriodKey, TabKey } from '../strings'

export type LinkMode = 'absolute' | 'admin'
export type LayoutMode = 'mobile' | 'desktop'

export interface DirectorCtx {
  tab: TabKey
  /** tabga o'tish; `extra` qo'shimcha query (masalan `{ f: 'lowStock' }`) */
  go: (tab: TabKey, extra?: Record<string, string | null>) => void
  period: PeriodKey
  setPeriod: (p: PeriodKey) => void
  /** muammolar filtri (`?f=`) */
  filter: string | null
  setFilter: (f: string | null) => void
  linkMode: LinkMode
  mode: LayoutMode
  /** admin ichida — portal konteyneri (theme scope) */
  container: HTMLElement | null
  embedded: boolean
}

const Ctx = createContext<DirectorCtx | null>(null)
export function useDirector(): DirectorCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useDirector: DirectorProvider tashqarisida')
  return c
}

export const TABS: TabKey[] = ['umumiy', 'savdo', 'pul', 'ombor', 'muammolar']
export function isTab(s: string | undefined | null): s is TabKey { return !!s && (TABS as string[]).includes(s) }
export function isPeriod(s: string | null): s is PeriodKey { return s === 'bugun' || s === 'hafta' || s === 'oy' }

export function DirectorProvider({ tab, onGo, linkMode, mode, container = null, embedded = false, children }: {
  tab: TabKey
  /** tab o'zgarishini yo'lga yozish; query ham beriladi */
  onGo: (tab: TabKey, search: URLSearchParams) => void
  linkMode: LinkMode
  mode: LayoutMode
  container?: HTMLElement | null
  embedded?: boolean
  children: ReactNode
}) {
  const [sp, setSp] = useSearchParams()
  const period: PeriodKey = isPeriod(sp.get('period')) ? (sp.get('period') as PeriodKey) : 'bugun'
  const filter = sp.get('f')
  const setPeriod = useCallback((p: PeriodKey) => setSp((prev) => { const n = new URLSearchParams(prev); n.set('period', p); return n }, { replace: true }), [setSp])
  const setFilter = useCallback((f: string | null) => setSp((prev) => { const n = new URLSearchParams(prev); if (f) n.set('f', f); else n.delete('f'); return n }, { replace: true }), [setSp])
  const go = useCallback((t: TabKey, extra?: Record<string, string | null>) => {
    const n = new URLSearchParams()
    const p = sp.get('period'); if (p) n.set('period', p)
    if (extra) for (const [k, v] of Object.entries(extra)) { if (v) n.set(k, v); else n.delete(k) }
    onGo(t, n)
  }, [sp, onGo])
  const value = useMemo<DirectorCtx>(() => ({ tab, go, period, setPeriod, filter, setFilter, linkMode, mode, container, embedded }), [tab, go, period, setPeriod, filter, setFilter, linkMode, mode, container, embedded])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
