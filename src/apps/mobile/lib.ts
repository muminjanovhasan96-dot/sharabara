/**
 * Mobil ilova uchun umumiy hook va yordamchilar.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore, useNow, type StoreState } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { api } from '@/api'
import { useAsync, useMinLoading } from '@/lib/hooks'
import { t } from '@/i18n/uz'
import { formatDemoDate, parseIso } from '@/domain/clock'
import type { Company, ISODate, Listing, Product, Region, RegionId, User } from '@/domain/types'
import { ms } from './strings'

/** Joriy foydalanuvchi (session.userId) — jonli. */
export function useMe(): User {
  return useStore((s) => s.data.users.find((u) => u.id === s.session.userId) ?? s.data.users[0])
}
export function useMeId(): string { return useStore((s) => s.session.userId) }

/** Massiv qaytaradigan selektorlar uchun — shallow taqqoslash (aks holda cheksiz re-render). */
export function useList<T>(selector: (s: StoreState) => T[]): T[] {
  return useStore(useShallow(selector))
}

/** Ro’yxat ekranlari uchun: API so’rovi (kechikish bilan) → skeleton, keyin jonli store ma’lumoti. */
export function useScreenLoad(deps: unknown[] = []) {
  const [tick, setTick] = useState(0)
  const st = useAsync(() => api.listings.list(), [...deps, tick])
  const loading = useMinLoading(st.loading, 300)
  const reload = useCallback(() => setTick((x) => x + 1), [])
  return { loading, error: st.error, reload }
}

/** "hozir · 5 daqiqa oldin · kecha · 27 sen" */
export function timeAgo(iso: ISODate, now: ISODate): string {
  const diff = parseIso(now).getTime() - parseIso(iso).getTime()
  const m = Math.round(diff / 60_000)
  if (m < 1) return ms.common.justNow
  if (m < 60) return t(ms.common.minAgo, { n: m })
  const h = Math.round(m / 60)
  if (h < 24) return t(ms.common.hourAgo, { n: h })
  const d = Math.round(h / 24)
  if (d === 1) return ms.common.yesterday
  if (d < 7) return t(ms.common.daysAgo, { n: d })
  return formatDemoDate(iso)
}

export function monthsSince(iso: ISODate, now: ISODate): number {
  const a = parseIso(iso); const b = parseIso(now)
  return Math.max(1, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth())
}

export function useRegions(): Region[] { return useStore((s) => s.data.regions) }
export function regionName(regions: Region[], id: RegionId | undefined): string {
  return regions.find((r) => r.id === id)?.name ?? ''
}

/** Haversine, km */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la = (a.lat * Math.PI) / 180; const lb = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Klaviatura ochilganda pastki CTA ni yuqoriga ko’taradi (visualViewport). */
export function useKeyboardOffset(): number {
  const [off, setOff] = useState(0)
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return
    const fn = () => {
      const delta = window.innerHeight - vv.height - vv.offsetTop
      setOff(delta > 80 ? delta : 0)
    }
    vv.addEventListener('resize', fn); vv.addEventListener('scroll', fn)
    return () => { vv.removeEventListener('resize', fn); vv.removeEventListener('scroll', fn) }
  }, [])
  return off
}

/** URLSearchParams — barqaror obyekt. */
export function useQuery(): URLSearchParams {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

/** Copy to clipboard with fallback. */
export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch {
    try {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select()
      const ok = document.execCommand('copy'); ta.remove(); return ok
    } catch { return false }
  }
}

/** Sotuvchi kaliti → nom/ikon */
export function sellerOf(key: string, users: User[], companies: Company[]): { kind: 'user' | 'company'; id: string; name: string; user?: User; company?: Company } {
  const id = key.slice(2)
  if (key.startsWith('c:')) { const c = companies.find((x) => x.id === id); return { kind: 'company', id, name: c?.name ?? 'Kompaniya', company: c } }
  const u = users.find((x) => x.id === id); return { kind: 'user', id, name: u?.name ?? 'Sotuvchi', user: u }
}

export function isListing(x: Listing | Product): x is Listing { return 'sellerId' in x }

/** 10 soniyadan keyin `view_long` yozadi. */
export function useViewLong(listing: Listing | null | undefined) {
  const id = listing?.id
  const started = useRef<string | null>(null)
  useEffect(() => {
    if (!id || !listing || started.current === id) return
    const l = listing
    const tm = setTimeout(() => {
      started.current = id
      void api.listings.trackEvent({ kind: 'view_long', itemId: l.id, source: 'listing', categoryId: l.categoryId, priceTiyin: l.priceTiyin, regionId: l.regionId, model: l.specs?.model })
    }, 10_000)
    return () => clearTimeout(tm)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function useTimeAgo() {
  const now = useNow()
  return useCallback((iso: ISODate) => timeAgo(iso, now), [now])
}

/** Kategoriya → illyustratsiya slug (Rasm bo’lmasa) */
export const CAT_SLUG: Record<string, string> = {
  telefonlar: 'phone', noutbuklar: 'laptop', televizorlar: 'tv', maishiy: 'appliance', mebel: 'furniture', kiyim: 'clothing', sport: 'sport', bolalar: 'baby',
}

export function starsText(rating: number): string { return rating.toFixed(1).replace('.', ',') }
