/**
 * Admin uchun api/* da yo'q yupqa yordamchilar. Har biri store.update orqali yozadi va audit qoldiradi.
 * (Hisobotda qayd etilgan: keyin src/api/listings.ts ga ko'chirish mumkin.)
 */
import { useStore } from '@/store'
import { audit, currentActor, delay } from '@/api/core'
import type { Listing, RecognizedSpecs } from '@/domain/types'

export const localApi = {
  /** Narx tahlili: AI aniqlagan xususiyatlarni moderator qo'lda tuzatadi. */
  async updateSpecs(listingId: string, patch: Partial<Pick<RecognizedSpecs, 'brand' | 'model' | 'storage' | 'color' | 'condition'>>) {
    await delay(80, 200)
    useStore.getState().update((d) => {
      const l = d.listings.find((x) => x.id === listingId) as Listing | undefined
      if (!l) return
      const specs: RecognizedSpecs = l.specs ?? { condition: l.condition, conditionNote: '', imagesOriginal: true, confidence: 0.5 }
      for (const [k, v] of Object.entries(patch) as [keyof typeof patch, string | undefined][]) {
        const from = (specs[k] as string | undefined) ?? null
        if (from === (v ?? null)) continue
        audit(d, currentActor('staff'), 'data', 'listing', l.id, `specs.${k}`, from, v ?? null, 'Moderator tuzatdi')
        ;(specs as unknown as Record<string, unknown>)[k] = v
      }
      if (patch.condition) l.condition = patch.condition
      l.specs = specs
    })
  },
}
