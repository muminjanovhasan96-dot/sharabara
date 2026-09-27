import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, useData, useSession } from '@/store'
import { useMinLoading } from '@/lib/hooks'
import type { Company, Order, SubOrder } from '@/domain/types'

export function useCompany(): Company {
  const { companyId } = useSession()
  const companies = useData((d) => d.companies)
  return companies.find((c) => c.id === companyId) ?? companies[0]
}

export interface SubRow { so: SubOrder; o: Order }

/** Shu kompaniyaning barcha sub-buyurtmalari (yangi → eski). */
export function useCompanySubs(companyId: string): SubRow[] {
  const orders = useData((d) => d.orders)
  return useMemo(() => {
    const key = `c:${companyId}`
    const out: SubRow[] = []
    for (const o of orders) for (const so of o.subOrders) if (so.sellerKey === key) out.push({ so, o })
    out.sort((a, b) => b.o.createdAt.localeCompare(a.o.createdAt))
    return out
  }, [orders, companyId])
}

/** Ro'yxatlar uchun qisqa "yuklanish" holati — har `key` o'zgarganda skeleton ko'rinadi. */
export function useListLoading(key: string, ms = 220): boolean {
  const [readyKey, setReadyKey] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setReadyKey(key), ms)
    return () => clearTimeout(t)
  }, [key, ms])
  return useMinLoading(readyKey !== key, 300)
}

/** Konteyner kengligi (ResizeObserver) — oyna o'lchamiga emas, ildiz elementga qaraydi. */
export function useContainerWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(1440)
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

export function useCompanyProducts(companyId: string) {
  const products = useData((d) => d.products)
  return useMemo(() => products.filter((p) => p.companyId === companyId), [products, companyId])
}

export function setCompany(companyId: string) { useStore.getState().setSession({ companyId }) }
