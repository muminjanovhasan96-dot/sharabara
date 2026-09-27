/**
 * PriceAdvisor — AI qatlami interfeysi.
 * Demo'da `MockPriceAdvisor` ishlaydi (brauzer ichida, deterministik).
 * Production'da backend orqali haqiqiy provayder (Claude API) ulanadi — UI o'zgarmaydi.
 */
import type { Category, Listing, PriceSuggestion, RecognizedSpecs, Tiyin } from '@/domain/types'
import { suggestPrice } from '@/domain/pricing'
import { recognize } from '@/domain/checks/recognize'
import { MODEL_DICTIONARY } from '@/domain/checks/models'
import { delay } from './core'

export interface AiStep { key: 'images' | 'model' | 'condition' | 'imei' | 'originality' | 'market'; text: string; ok: boolean }

export interface PriceAdvisor {
  /** Rasm + matn → aniqlangan belgilar (soxta: lug'at asosida) */
  recognize(listing: Listing, category: Category): Promise<RecognizedSpecs>
  /** Taqqoslash asosida narx tavsiyasi + izoh */
  suggest(listing: Listing, category: Category, history: Listing[], now: string): Promise<PriceSuggestion>
  /** Animatsiyali ekran uchun qadam-baqadam natija */
  explainSteps(listing: Listing, specs: RecognizedSpecs, comparableCount: number): AiStep[]
}

export class MockPriceAdvisor implements PriceAdvisor {
  async recognize(listing: Listing, category: Category) {
    await delay(200, 400)
    return recognize(listing, category, MODEL_DICTIONARY)
  }
  async suggest(listing: Listing, category: Category, history: Listing[], now: string) {
    await delay(300, 600)
    const model = MODEL_DICTIONARY.find((m) => m.model === listing.specs?.model)
    const newRetailTiyin: Tiyin | null = model?.newRetailTiyin ?? null
    return suggestPrice({ listing, category, history, newRetailTiyin, now })
  }
  explainSteps(_listing: Listing, specs: RecognizedSpecs, n: number): AiStep[] {
    const modelText = [specs.model, specs.storage, specs.color].filter(Boolean).join(' · ') || 'aniqlanmadi'
    return [
      { key: 'images', text: 'Rasmlarni ko’ryapman…', ok: true },
      { key: 'model', text: `Modelni aniqladim: ${modelText}`, ok: !!specs.model },
      { key: 'condition', text: `Holatni baholadim: ${specs.condition} — ${specs.conditionNote}`, ok: true },
      { key: 'imei', text: specs.imeiStatus === 'suspicious' ? 'IMEI shubhali — moderator tekshiradi' : specs.imeiStatus === 'clean' ? 'IMEI toza' : 'IMEI kiritilmagan', ok: specs.imeiStatus !== 'suspicious' },
      { key: 'originality', text: specs.imagesOriginal ? 'Rasmlar original' : 'Rasmlar internetdan olinganga o’xshaydi', ok: specs.imagesOriginal },
      { key: 'market', text: `Bozor narxini solishtiryapman (${n} ta o’xshash e’lon)`, ok: n >= 3 },
    ]
  }
}

export const advisor: PriceAdvisor = new MockPriceAdvisor()
