import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'sb-theme'

interface ThemeCtx { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }
const Ctx = createContext<ThemeCtx | null>(null)

function readStored(key: string): Theme | null {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    return v === 'dark' || v === 'light' ? v : null
  } catch { return null }
}

function resolveEl(scope: 'document' | HTMLElement | null | undefined): HTMLElement | null {
  if (scope && scope !== 'document') return scope
  return typeof document !== 'undefined' ? document.documentElement : null
}

export interface ThemeProviderProps {
  children: ReactNode
  /** element that receives data-theme; default document.documentElement */
  scope?: 'document' | HTMLElement | null
  /** localStorage key; default "sb-theme". Pass a different key for an independent phone theme. */
  storageKey?: string
  defaultTheme?: Theme
  /** follow prefers-color-scheme when nothing stored */
  system?: boolean
}

export function ThemeProvider({ children, scope = 'document', storageKey = THEME_KEY, defaultTheme = 'light', system = false }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = readStored(storageKey)
    if (stored) return stored
    if (system && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    return defaultTheme
  })
  useEffect(() => {
    const el = resolveEl(scope)
    if (!el) return
    if (theme === 'dark') el.setAttribute('data-theme', 'dark')
    else el.removeAttribute('data-theme')
  }, [theme, scope])
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem(storageKey, t) } catch { /* noop */ }
  }, [storageKey])
  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme])
  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Theme state + toggle. Outside a provider it falls back to a document-scoped standalone state. */
export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx)
  const [fallback, setFallback] = useState<Theme>(() => readStored(THEME_KEY) ?? 'light')
  const setTheme = useCallback((t: Theme) => {
    setFallback(t)
    const el = resolveEl('document')
    if (el) { if (t === 'dark') el.setAttribute('data-theme', 'dark'); else el.removeAttribute('data-theme') }
    try { localStorage.setItem(THEME_KEY, t) } catch { /* noop */ }
  }, [])
  const toggle = useCallback(() => setTheme(fallback === 'dark' ? 'light' : 'dark'), [fallback, setTheme])
  if (ctx) return ctx
  return { theme: fallback, setTheme, toggle }
}
