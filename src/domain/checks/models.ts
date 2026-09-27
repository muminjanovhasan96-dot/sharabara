/**
 * Model dictionary used by the deterministic recognizer and by the seed.
 * newRetailTiyin = approximate price of a NEW unit in Uzbekistan (tiyin).
 */
import type { Id, Tiyin } from '../types'

export interface ModelEntry {
  id: string
  brand: string
  model: string
  /** lowercase aliases that may appear in a title (longest match wins) */
  aliases: string[]
  categoryId: Id
  newRetailTiyin: Tiyin
  /** optional storage variant ("256 GB") when an entry is priced per variant */
  storage?: string
}

const S = 100 // so'm -> tiyin
const e = (id: string, brand: string, model: string, categoryId: Id, newRetailSum: number, aliases: string[] = []): ModelEntry => ({
  id, brand, model, categoryId, newRetailTiyin: newRetailSum * S,
  aliases: Array.from(new Set([model.toLowerCase(), ...aliases.map((a) => a.toLowerCase())])),
})

export const MODEL_DICTIONARY: ModelEntry[] = [
  // Telefonlar
  e('iphone-11', 'Apple', 'iPhone 11', 'telefonlar', 4_500_000, ['айфон 11']),
  e('iphone-12', 'Apple', 'iPhone 12', 'telefonlar', 5_500_000, ['айфон 12']),
  e('iphone-13', 'Apple', 'iPhone 13', 'telefonlar', 7_200_000, ['айфон 13']),
  e('iphone-13-pro', 'Apple', 'iPhone 13 Pro', 'telefonlar', 9_500_000, ['айфон 13 pro']),
  e('iphone-13-pro-max', 'Apple', 'iPhone 13 Pro Max', 'telefonlar', 10_500_000),
  e('iphone-14', 'Apple', 'iPhone 14', 'telefonlar', 9_800_000, ['айфон 14']),
  e('iphone-14-pro', 'Apple', 'iPhone 14 Pro', 'telefonlar', 12_500_000),
  e('iphone-15', 'Apple', 'iPhone 15', 'telefonlar', 11_900_000, ['айфон 15']),
  e('iphone-15-pro', 'Apple', 'iPhone 15 Pro', 'telefonlar', 14_900_000),
  e('samsung-s22', 'Samsung', 'Samsung Galaxy S22', 'telefonlar', 6_900_000, ['galaxy s22', 'samsung s22']),
  e('samsung-s23', 'Samsung', 'Samsung Galaxy S23', 'telefonlar', 8_900_000, ['galaxy s23', 'samsung s23']),
  e('samsung-s24', 'Samsung', 'Samsung Galaxy S24', 'telefonlar', 10_900_000, ['galaxy s24', 'samsung s24']),
  e('samsung-a54', 'Samsung', 'Samsung Galaxy A54', 'telefonlar', 4_200_000, ['galaxy a54', 'samsung a54']),
  e('samsung-a34', 'Samsung', 'Samsung Galaxy A34', 'telefonlar', 3_300_000, ['galaxy a34', 'samsung a34']),
  e('redmi-note-12', 'Xiaomi', 'Redmi Note 12', 'telefonlar', 2_600_000, ['xiaomi redmi note 12']),
  e('redmi-note-13', 'Xiaomi', 'Redmi Note 13', 'telefonlar', 3_100_000, ['xiaomi redmi note 13']),
  e('xiaomi-13', 'Xiaomi', 'Xiaomi 13', 'telefonlar', 7_500_000),
  e('poco-x5-pro', 'Xiaomi', 'Poco X5 Pro', 'telefonlar', 3_400_000),
  // Noutbuklar
  e('macbook-air-m1', 'Apple', 'MacBook Air M1', 'noutbuklar', 10_900_000, ['macbook air 13 m1']),
  e('macbook-air-m2', 'Apple', 'MacBook Air M2', 'noutbuklar', 13_900_000, ['macbook air 13 m2']),
  e('macbook-pro-14-m2', 'Apple', 'MacBook Pro 14 M2', 'noutbuklar', 22_000_000, ['macbook pro 14']),
  e('lenovo-ideapad-3', 'Lenovo', 'Lenovo IdeaPad 3', 'noutbuklar', 6_500_000, ['ideapad 3']),
  e('hp-pavilion-15', 'HP', 'HP Pavilion 15', 'noutbuklar', 7_800_000, ['pavilion 15']),
  e('asus-vivobook-15', 'Asus', 'Asus VivoBook 15', 'noutbuklar', 6_900_000, ['vivobook 15']),
  e('acer-aspire-5', 'Acer', 'Acer Aspire 5', 'noutbuklar', 6_200_000, ['aspire 5']),
  e('dell-inspiron-15', 'Dell', 'Dell Inspiron 15', 'noutbuklar', 7_200_000, ['inspiron 15']),
  // Televizorlar
  e('samsung-55-4k', 'Samsung', 'Samsung 55 4K', 'televizorlar', 7_500_000, ['samsung 55 dyuym 4k', 'samsung 55"']),
  e('lg-50-uhd', 'LG', 'LG 50 UHD', 'televizorlar', 6_200_000, ['lg 50 dyuym']),
  e('artel-43', 'Artel', 'Artel 43 Smart', 'televizorlar', 3_400_000, ['artel 43 dyuym', 'artel 43']),
  e('tcl-65', 'TCL', 'TCL 65 QLED', 'televizorlar', 8_900_000, ['tcl 65 dyuym', 'tcl 65']),
  // Maishiy texnika
  e('samsung-wash-7', 'Samsung', 'Samsung kir yuvish mashinasi 7 kg', 'maishiy', 5_400_000, ['samsung kir yuvish 7 kg']),
  e('artel-fridge', 'Artel', 'Artel muzlatgich HD 345', 'maishiy', 4_800_000, ['artel muzlatgich']),
  e('lg-ac-12', 'LG', 'LG konditsioner 12', 'maishiy', 6_200_000, ['lg konditsioner']),
  e('dyson-v11', 'Dyson', 'Dyson V11', 'maishiy', 7_900_000, ['dyson v11 changyutgich']),
]

type AliasIndex = { alias: string; entry: ModelEntry }[]
const INDEX_CACHE = new WeakMap<ModelEntry[], AliasIndex>()
function aliasIndex(dict: ModelEntry[]): AliasIndex {
  let idx = INDEX_CACHE.get(dict)
  if (!idx) {
    idx = dict
      .flatMap((m) => m.aliases.map((a) => ({ alias: a, entry: m })))
      .sort((a, b) => b.alias.length - a.alias.length)
    INDEX_CACHE.set(dict, idx)
  }
  return idx
}

export function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[,«»"'']/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Longest alias that appears in the text (word-boundary aware). */
export function findModel(text: string, dictionary: ModelEntry[] = MODEL_DICTIONARY): ModelEntry | null {
  const t = ` ${normalizeTitle(text)} `
  for (const { alias, entry } of aliasIndex(dictionary)) {
    const idx = t.indexOf(alias)
    if (idx < 0) continue
    const before = t[idx - 1]
    const after = t[idx + alias.length]
    const boundary = (c: string | undefined) => c === undefined || !/[a-z0-9а-я]/i.test(c)
    if (boundary(before) && boundary(after)) return entry
  }
  return null
}

export function modelById(id: string): ModelEntry | null {
  return MODEL_DICTIONARY.find((m) => m.id === id) ?? null
}

export function newRetailFor(model: string | undefined): Tiyin | null {
  if (!model) return null
  const hit = MODEL_DICTIONARY.find((m) => m.model.toLowerCase() === model.toLowerCase())
  return hit ? hit.newRetailTiyin : null
}

export const KNOWN_COLORS = [
  'Sierra Blue', 'Graphite', 'Midnight', 'Starlight', 'Space Gray', 'Silver', 'Gold',
  'Phantom Black', 'Deep Purple', 'Alpine Green', 'Qora', 'Oq', 'Kumush', "Ko'k", 'Yashil', 'Qizil', 'Binafsha',
]
