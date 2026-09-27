import { useEffect, useMemo, useRef, useState } from 'react'
import { useData } from '@/store'
import { useMinLoading } from '@/lib/hooks'
import type { Manifest, Order, SubOrder } from '@/domain/types'

export interface ShipRow { so: SubOrder; o: Order }

export function useAllSubs(): ShipRow[] {
  const orders = useData((d) => d.orders)
  return useMemo(() => { const out: ShipRow[] = []; for (const o of orders) for (const so of o.subOrders) out.push({ so, o }); return out }, [orders])
}

/** Bugungi harakat qilinadigan manifest: closed → open → eng so'nggi picked_up */
export function useTodayManifest(): Manifest | null {
  const manifests = useData((d) => d.manifests)
  return useMemo(() => {
    const byDate = [...manifests].sort((a, b) => b.date.localeCompare(a.date))
    return byDate.find((m) => m.status === 'closed') ?? byDate.find((m) => m.status === 'open') ?? byDate.find((m) => m.status === 'picked_up') ?? null
  }, [manifests])
}

export function useListLoading(key: string, ms = 220): boolean {
  const [readyKey, setReadyKey] = useState<string | null>(null)
  useEffect(() => { const t = setTimeout(() => setReadyKey(key), ms); return () => clearTimeout(t) }, [key, ms])
  return useMinLoading(readyKey !== key, 300)
}

export function useContainerWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(1200)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    setW(el.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => { for (const e of entries) setW(e.contentRect.width) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}
