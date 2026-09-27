import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> { data: T | null; loading: boolean; error: Error | null; reload: () => void }

/** Run an async loader; re-runs when deps change. Keeps previous data while reloading. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    setLoading(true); setError(null)
    loader().then((d) => { if (alive.current) { setData(d); setLoading(false) } })
      .catch((e: unknown) => { if (alive.current) { setError(e instanceof Error ? e : new Error(String(e))); setLoading(false) } })
    return () => { alive.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}

/** Wrap an async action with pending/error state for buttons. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const run = useCallback(async (...args: A): Promise<R | undefined> => {
    setPending(true); setError(null)
    try { return await fn(...args) } catch (e) { setError(e instanceof Error ? e : new Error(String(e))); return undefined } finally { setPending(false) }
  }, [fn])
  return { run, pending, error }
}

export function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(q)
    const fn = () => setM(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [q])
  return m
}
export function useIsMobile() { return useMediaQuery('(max-width: 767px)') }

/** Minimum-duration skeleton so loading states never flash. */
export function useMinLoading(loading: boolean, ms = 250) {
  const [show, setShow] = useState(loading)
  useEffect(() => {
    const t = setTimeout(() => setShow(loading), loading ? 0 : ms)
    return () => clearTimeout(t)
  }, [loading, ms])
  return show || loading
}

export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

export function useKey(key: string, handler: (e: KeyboardEvent) => void, opts: { meta?: boolean; enabled?: boolean } = {}) {
  useEffect(() => {
    if (opts.enabled === false) return
    const fn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (!opts.meta && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) return
      if (opts.meta && !(e.metaKey || e.ctrlKey)) return
      if (e.key.toLowerCase() === key.toLowerCase()) handler(e)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [key, handler, opts.meta, opts.enabled])
}
