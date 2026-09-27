/**
 * Ilovalar ikki rejimda ishlaydi:
 *  1) top-level: BrowserRouter ichida `/m/*`, `/admin/*` … (base = '/m')
 *  2) embedded: /stage sahifasida MemoryRouter ichida (base = '')
 * Shuning uchun har ilova `useBase()` orqali havola yasaydi va `Routes` ichida nisbiy yo'llar ishlatadi.
 */
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react'
import { useNavigate, type NavigateOptions } from 'react-router-dom'

export type AppKey = 'mobile' | 'admin' | 'partner' | 'bts' | 'director'

const BaseCtx = createContext<{ base: string; app: AppKey; embedded: boolean }>({ base: '', app: 'mobile', embedded: false })

export function AppBase({ base, app, embedded = false, children }: { base: string; app: AppKey; embedded?: boolean; children: ReactNode }) {
  return <BaseCtx.Provider value={{ base, app, embedded }}>{children}</BaseCtx.Provider>
}

export function useBase() { return useContext(BaseCtx) }

/** Build an href inside the current app: href('/listing/1') → '/m/listing/1' or '/listing/1' */
export function useHref() {
  const { base } = useBase()
  return useCallback((path: string) => `${base}${path.startsWith('/') ? path : `/${path}`}`, [base])
}

/** Strip a known app prefix from a stored link like '/m/orders/O-1' so it works embedded too. */
export function stripAppPrefix(link: string): string {
  return link.replace(/^\/(m|admin|partner|bts)(?=\/|$)/, '') || '/'
}

export function useAppNavigate() {
  const nav = useNavigate()
  const href = useHref()
  return useCallback((path: string, opts?: NavigateOptions) => nav(href(stripAppPrefix(path)), opts), [nav, href])
}

// ─── Stage remote control: /stage drives embedded apps without owning their routers ───
type Listener = (path: string) => void
const listeners = new Map<AppKey, Set<Listener>>()
export const stageNav = {
  /** Navigate an embedded (or top-level) app to a path relative to its base. */
  go(app: AppKey, path: string) { listeners.get(app)?.forEach((fn) => fn(path)) },
  subscribe(app: AppKey, fn: Listener) {
    if (!listeners.has(app)) listeners.set(app, new Set())
    listeners.get(app)!.add(fn)
    return () => { listeners.get(app)?.delete(fn) }
  },
}
/** Call once inside each app root (under its Router). */
export function useStageNav() {
  const { app } = useBase()
  const nav = useAppNavigate()
  useEffect(() => stageNav.subscribe(app, (p) => nav(stripAppPrefix(p))), [app, nav])
}
