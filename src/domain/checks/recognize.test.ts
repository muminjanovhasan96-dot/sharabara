import { describe, it, expect } from 'vitest'
import { checkImei, checkImagesOriginal, parseStorage, parseColor, recognize } from './recognize'
import { MODEL_DICTIONARY, findModel, modelById, newRetailFor } from './models'
import type { Category, Listing } from '../types'

const cat: Category = {
  id: 'telefonlar', parentId: null, name: 'Telefonlar', icon: 'smartphone', attributes: [],
  discountRate: 0.05, maxNewRatio: 0.85,
  conditionNotes: { A: 'Yangidek', B: 'Yaxshi', C: 'Qoniqarli', D: 'Nuqsonli' },
}
const base: Listing = {
  id: 'L-1', sellerId: 'u-1', categoryId: 'telefonlar', title: 'iPhone 13 Pro, 256 GB, Sierra Blue',
  description: '', images: ['ill-phone-1'], attributes: {}, imei: '356789104123457', regionId: 'toshkent_sh',
  condition: 'B', askingTiyin: 660_000_000, priceTiyin: 660_000_000, status: 'draft', priceVerified: false,
  createdAt: '2026-09-27T10:00:00', stats: { views: 0, saves: 0, chats: 0, viewsByDay: [] },
}

describe('checkImei', () => {
  it('classifies', () => {
    expect(checkImei('356789104123457')).toBe('clean')
    expect(checkImei('356789104123450')).toBe('suspicious')
    expect(checkImei('12345')).toBe('suspicious')
    expect(checkImei('35678910412345a')).toBe('suspicious')
    expect(checkImei(undefined)).toBe('not_provided')
    expect(checkImei('  ')).toBe('not_provided')
  })
})

describe('checkImagesOriginal', () => {
  it('flags stock images only', () => {
    expect(checkImagesOriginal(['ill-phone-1', 'ill-phone-2'])).toBe(true)
    expect(checkImagesOriginal(['ill-phone-1', 'stock-iphone-01'])).toBe(false)
    expect(checkImagesOriginal([])).toBe(true)
  })
})

describe('model dictionary', () => {
  it('has ~25+ entries with retail prices', () => {
    expect(MODEL_DICTIONARY.length).toBeGreaterThanOrEqual(25)
    for (const m of MODEL_DICTIONARY) expect(m.newRetailTiyin % 100).toBe(0)
  })
  it('longest alias wins', () => {
    expect(findModel('iPhone 13 Pro Max 128 GB')?.model).toBe('iPhone 13 Pro Max')
    expect(findModel('iPhone 13 Pro 256 GB')?.model).toBe('iPhone 13 Pro')
    expect(findModel('Sotiladi iPhone 13, ideal')?.model).toBe('iPhone 13')
    expect(findModel('Samsung 55 dyuym 4K televizor')?.model).toBe('Samsung 55 4K')
    expect(findModel('Galaxy S23 ultra emas')?.model).toBe('Samsung Galaxy S23')
    expect(findModel('Stol va stul')).toBeNull()
    expect(findModel('iPhone 130')).toBeNull()
  })
  it('lookups', () => {
    expect(modelById('iphone-13-pro')?.newRetailTiyin).toBe(950_000_000)
    expect(modelById('nope')).toBeNull()
    expect(newRetailFor('iPhone 13 Pro')).toBe(950_000_000)
    expect(newRetailFor('Nokia 3310')).toBeNull()
    expect(newRetailFor(undefined)).toBeNull()
  })
})

describe('parse helpers', () => {
  it('storage and color', () => {
    expect(parseStorage('iPhone 13 Pro 256GB')).toBe('256 GB')
    expect(parseStorage('MacBook 1 TB')).toBe('1 TB')
    expect(parseStorage('MacBook 1TB')).toBe('1 TB')
    expect(parseStorage('Model X100GB')).toBeUndefined()
    expect(parseStorage('Stol')).toBeUndefined()
    expect(parseColor('iPhone 13 Sierra Blue')).toBe('Sierra Blue')
    expect(parseColor('Telefon qora rangda')).toBe('Qora')
    expect(parseColor('Stol')).toBeUndefined()
  })
})

describe('recognize', () => {
  it('golden listing', () => {
    const s = recognize(base, cat, MODEL_DICTIONARY)
    expect(s).toMatchObject({
      brand: 'Apple', model: 'iPhone 13 Pro', storage: '256 GB', color: 'Sierra Blue',
      condition: 'B', conditionNote: 'Yaxshi', imeiStatus: 'clean', imagesOriginal: true, confidence: 1,
    })
  })
  it('falls back to attributes', () => {
    const s = recognize({ ...base, title: 'Telefon sotiladi', imei: undefined, attributes: { model: 'iPhone 12', xotira: '128 GB', rang: 'Qora' } }, cat, MODEL_DICTIONARY)
    expect(s.model).toBe('iPhone 12')
    expect(s.storage).toBe('128 GB')
    expect(s.color).toBe('Qora')
    expect(s.imeiStatus).toBe('not_provided')
  })
  it('unknown model keeps attribute text, lower confidence', () => {
    const s = recognize({ ...base, title: 'Nokia 3310 klassik', attributes: { model: 'Nokia 3310' }, images: ['stock-1'] }, cat, [])
    expect(s.model).toBe('Nokia 3310')
    expect(s.brand).toBeUndefined()
    expect(s.imagesOriginal).toBe(false)
    expect(s.confidence).toBe(0.5)
  })
  it('dictionary fallback and non-phone categories', () => {
    const mebel = { ...cat, id: 'mebel' }
    const s = recognize({ ...base, title: 'Divan 3 kishilik', attributes: {}, imei: undefined }, mebel, MODEL_DICTIONARY)
    expect(s.imeiStatus).toBeUndefined()
    const s2 = recognize({ ...base, title: 'Noutbuk macbook air 13 m2 8/256', attributes: {}, imei: '123' }, { ...cat, id: 'noutbuklar' }, MODEL_DICTIONARY)
    expect(s2.model).toBe('MacBook Air M2')
    expect(s2.imeiStatus).toBe('suspicious')
    const s3 = recognize({ ...base, title: "Zo'r telefon айфон 11", attributes: {} }, cat, MODEL_DICTIONARY)
    expect(s3.model).toBe('iPhone 11')
  })
})
