import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from './toast'
import { useMinLoading } from '@/lib/hooks'
import { A } from '../strings'

/** Ro'yxat skeletoni: montajda ~320ms "yuklanish" (api kechikishini taqlid qiladi). */
export function useSectionLoading(deps: unknown[] = []): boolean {
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 320); return () => clearTimeout(t) }, deps)
  return useMinLoading(loading, 250)
}

/** api.* chaqiruvini o'rab, xatoni toast qiladi; pending holatini beradi. */
export function useAct() {
  const [pending, setPending] = useState<string | null>(null)
  const run = useCallback(async <T,>(key: string, fn: () => Promise<T>, ok?: string | ((r: T) => string)): Promise<T | undefined> => {
    setPending(key)
    try {
      const r = await fn()
      if (ok) toast.success(typeof ok === 'function' ? ok(r) : ok)
      return r
    } catch (e) {
      toast.error(A.common.errorAction, { description: e instanceof Error ? e.message : String(e) })
      return undefined
    } finally { setPending(null) }
  }, [])
  return { run, pending }
}

/** URL query param (?id=) — o'qish va yozish (replace). */
export function useQueryParam(key: string): [string | null, (v: string | null) => void] {
  const [sp, setSp] = useSearchParams()
  const value = sp.get(key)
  const set = useCallback((v: string | null) => {
    setSp((prev) => { const n = new URLSearchParams(prev); if (v === null || v === '') n.delete(key); else n.set(key, v); return n }, { replace: true })
  }, [key, setSp])
  return [value, set]
}

export interface SavedView<F> { name: string; filters: F }
/** Saqlangan ko'rinishlar (localStorage). */
export function useSavedViews<F>(storageKey: string, presets: SavedView<F>[]) {
  const k = `sb-admin-views:${storageKey}`
  const [custom, setCustom] = useState<SavedView<F>[]>(() => { try { return JSON.parse(localStorage.getItem(k) ?? '[]') as SavedView<F>[] } catch { return [] } })
  const save = useCallback((v: SavedView<F>) => {
    setCustom((cs) => { const next = [...cs.filter((c) => c.name !== v.name), v]; try { localStorage.setItem(k, JSON.stringify(next)) } catch { /* noop */ } return next })
  }, [k])
  const remove = useCallback((name: string) => {
    setCustom((cs) => { const next = cs.filter((c) => c.name !== name); try { localStorage.setItem(k, JSON.stringify(next)) } catch { /* noop */ } return next })
  }, [k])
  const all = useMemo(() => [...presets, ...custom], [presets, custom])
  return { views: all, custom, save, remove }
}

/** Kichik lokal holat: root konteynerning kengligi (ResizeObserver). */
export function useContainerWidth(el: HTMLElement | null): number {
  const [w, setW] = useState(el?.clientWidth ?? 1440)
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver((entries) => { for (const e of entries) setW(e.contentRect.width) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return w
}
