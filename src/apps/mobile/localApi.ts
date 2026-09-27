/**
 * Mobil ilova uchun mavjud bo’lmagan mayda yozuvlar. Hammasi store'ning `update`/`setUi`/`setSession`
 * orqali; boshqa qatlamlarga tegilmaydi.
 */
import { useStore } from '@/store'
import type { User } from '@/domain/types'

export const localApi = {
  /** Sozlamalar: til, push, naqd to’lov. */
  async setUserPrefs(patch: Partial<Pick<User, 'language' | 'notificationsEnabled' | 'cashOnDelivery'>>) {
    const s = useStore.getState()
    s.update((d) => {
      const u = d.users.find((x) => x.id === s.session.userId)
      if (u) Object.assign(u, patch)
    })
  },
  /** AI ekranida belgilarni kosmetik tahrirlash (listing.attributes). */
  async setListingAttributes(listingId: string, attrs: Record<string, string | number>) {
    useStore.getState().update((d) => {
      const l = d.listings.find((x) => x.id === listingId)
      if (l) Object.assign(l.attributes, attrs)
    })
  },
  /** Oxirgi qidiruvlar (ui state). */
  addRecentSearch(q: string) {
    const v = q.trim()
    if (!v) return
    useStore.getState().setUi((u) => {
      const i = u.recentSearches.findIndex((x) => x.toLowerCase() === v.toLowerCase())
      if (i >= 0) u.recentSearches.splice(i, 1)
      u.recentSearches.unshift(v)
      if (u.recentSearches.length > 8) u.recentSearches.length = 8
    })
  },
  /** Demo: xaridor ↔ sotuvchi. */
  switchUser(userId: string) {
    useStore.getState().setSession({ userId, role: userId === 'u-seller' ? 'seller' : 'buyer' })
  },
}
