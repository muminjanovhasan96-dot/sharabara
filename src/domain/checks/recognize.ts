/**
 * Deterministic "AI" recognition: brand/model/storage/color from the title and
 * attributes, IMEI sanity check and stock-image detection. No randomness.
 */
import type { Category, Listing, RecognizedSpecs } from '../types'
import { KNOWN_COLORS, MODEL_DICTIONARY, findModel, normalizeTitle, type ModelEntry } from './models'

export type ImeiStatus = NonNullable<RecognizedSpecs['imeiStatus']>

/** 'suspicious' if length != 15 digits or last digit is '0'. */
export function checkImei(imei: string | undefined | null): ImeiStatus {
  if (imei === undefined || imei === null || imei.trim() === '') return 'not_provided'
  const digits = imei.replace(/\s/g, '')
  if (!/^\d{15}$/.test(digits)) return 'suspicious'
  if (digits.endsWith('0')) return 'suspicious'
  return 'clean'
}

/** Deterministic: false only if any image id contains "stock". */
export function checkImagesOriginal(images: string[]): boolean {
  return !images.some((id) => id.toLowerCase().includes('stock'))
}

const STORAGE_RE = /\b(\d{1,4})\s?(gb|tb)\b/i

export function parseStorage(text: string): string | undefined {
  const m = STORAGE_RE.exec(text)
  if (!m) return undefined
  return `${m[1]} ${m[2].toUpperCase()}`
}

export function parseColor(text: string): string | undefined {
  const t = normalizeTitle(text)
  for (const c of KNOWN_COLORS) {
    if (t.includes(c.toLowerCase())) return c
  }
  return undefined
}

export function recognize(listing: Listing, category: Category, dictionary: ModelEntry[] = MODEL_DICTIONARY): RecognizedSpecs {
  const attrModel = typeof listing.attributes.model === 'string' ? listing.attributes.model : undefined
  let entry: ModelEntry | null = findModel(listing.title, dictionary)
  if (!entry && attrModel) entry = findModel(attrModel, dictionary)

  const attrStorage = typeof listing.attributes.xotira === 'string' ? listing.attributes.xotira : undefined
  const storage = parseStorage(listing.title) ?? (attrStorage ? parseStorage(attrStorage) ?? attrStorage : undefined)
  const attrColor = typeof listing.attributes.rang === 'string' ? listing.attributes.rang : undefined
  const color = parseColor(listing.title) ?? attrColor

  let confidence = 0.5
  if (entry) confidence += 0.3
  if (storage) confidence += 0.1
  if (color) confidence += 0.1

  const specs: RecognizedSpecs = {
    condition: listing.condition,
    conditionNote: category.conditionNotes[listing.condition],
    imagesOriginal: checkImagesOriginal(listing.images),
    confidence: Math.round(confidence * 100) / 100,
  }
  if (entry) { specs.brand = entry.brand; specs.model = entry.model }
  else if (attrModel) specs.model = attrModel
  if (storage) specs.storage = storage
  if (color) specs.color = color
  if (category.id === 'telefonlar') specs.imeiStatus = checkImei(listing.imei)
  else if (listing.imei) specs.imeiStatus = checkImei(listing.imei)
  return specs
}
