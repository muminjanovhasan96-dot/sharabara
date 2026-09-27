/** Excel import: parsing, header guessing, validation. Pure functions (xlsx only). */
import { read, utils, write, writeFile } from 'xlsx'
import type { ImportRow } from '@/api'
import type { Product } from '@/domain/types'
import { P } from './strings'

export type FieldKey = 'sku' | 'title' | 'price' | 'stock' | 'categoryId' | 'warrantyMonths' | 'description'
export const REQUIRED: FieldKey[] = ['sku', 'title', 'price', 'stock']
export const ALL_FIELDS: FieldKey[] = ['sku', 'title', 'price', 'stock', 'categoryId', 'warrantyMonths', 'description']
export type Mapping = Partial<Record<FieldKey, number>>

export interface ParsedSheet { sheet: string; headers: string[]; rows: unknown[][] }

export function parseWorkbook(buf: ArrayBuffer): ParsedSheet {
  const wb = read(buf, { type: 'array' })
  const name = wb.SheetNames[0]
  if (!name) throw new Error('empty')
  const ws = wb.Sheets[name]
  const aoa = utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
  const nonEmpty = aoa.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== ''))
  if (nonEmpty.length < 2) throw new Error('empty')
  const headers = (nonEmpty[0] as unknown[]).map((h, i) => String(h ?? '').trim() || `Ustun ${i + 1}`)
  return { sheet: name, headers, rows: nonEmpty.slice(1) as unknown[][] }
}

const GUESS: Record<FieldKey, RegExp> = {
  sku: /^(sku|artikul|kod|code|article)/i,
  title: /(nomi?|title|name|tovar|наимен)/i,
  price: /(narx|price|summa|цена)/i,
  stock: /(zaxira|stock|qoldiq|miqdor|qty|остаток|кол)/i,
  categoryId: /(kateg|categ)/i,
  warrantyMonths: /(kafolat|warranty|гарант)/i,
  description: /(tavsif|desc|описан)/i,
}
export function guessMapping(headers: string[]): Mapping {
  const m: Mapping = {}
  const used = new Set<number>()
  for (const f of ALL_FIELDS) {
    const idx = headers.findIndex((h, i) => !used.has(i) && GUESS[f].test(h))
    if (idx >= 0) { m[f] = idx; used.add(idx) }
  }
  return m
}

export interface RowError { row: number; msg: string }
export interface Validated { ok: ImportRow[]; errors: RowError[]; adds: number; updates: number }

const cell = (r: unknown[], i: number | undefined) => (i === undefined ? '' : String(r[i] ?? '').trim())
const num = (s: string) => Number(s.replace(/\s| |so'm|so’m/gi, '').replace(',', '.'))

export function validateRows(rows: unknown[][], map: Mapping, existing: Product[], categories: { id: string; name: string }[]): Validated {
  const ok: ImportRow[] = []
  const errors: RowError[] = []
  const seen = new Set<string>()
  const existingSkus = new Set(existing.map((p) => p.sku.toLowerCase()))
  let adds = 0, updates = 0
  rows.forEach((r, idx) => {
    const line = idx + 2
    const sku = cell(r, map.sku), title = cell(r, map.title), priceS = cell(r, map.price), stockS = cell(r, map.stock)
    const errs: string[] = []
    if (!sku) errs.push(P.import.errSkuEmpty)
    else if (seen.has(sku.toLowerCase())) errs.push(P.import.errSkuDup)
    if (!title) errs.push(P.import.errTitleEmpty)
    const price = num(priceS)
    if (!priceS) errs.push(P.import.errPriceEmpty)
    else if (!Number.isFinite(price) || price <= 0) errs.push(P.import.errPriceBad)
    const stock = stockS === '' ? 0 : num(stockS)
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) errs.push(P.import.errStockBad)
    if (errs.length) { for (const e of errs) errors.push({ row: line, msg: e }); return }
    if (sku) seen.add(sku.toLowerCase())
    const catName = cell(r, map.categoryId).toLowerCase()
    const cat = categories.find((c) => c.name.toLowerCase() === catName || c.id === catName)
    const warranty = num(cell(r, map.warrantyMonths))
    ok.push({ sku, title, priceTiyin: Math.round(price) * 100, stock, categoryId: cat?.id, warrantyMonths: Number.isFinite(warranty) && warranty > 0 ? Math.round(warranty) : undefined, description: cell(r, map.description) || undefined })
    if (existingSkus.has(sku.toLowerCase())) updates++; else adds++
  })
  return { ok, errors, adds, updates }
}

export const TEMPLATE_HEADERS = ['SKU', 'Nomi', "Narx (so'm)", 'Zaxira', 'Kategoriya', 'Kafolat (oy)', 'Tavsif']

function templateRows(): (string | number)[][] {
  return [
    ['NAM-2001', 'Samsung Galaxy A55, 128 GB, yangi', 4_290_000, 24, 'Telefonlar', 12, 'Rasmiy kafolat, qutida'],
    ['NAM-2002', 'Artel 43" Smart TV, yangi', 3_150_000, 9, 'Televizorlar', 24, 'Android TV, 2 pult'],
    ['NAM-2003', 'Lenovo IdeaPad 3, 8/256, yangi', 5_990_000, 6, 'Noutbuklar', 12, 'Windows 11, kafolat'],
  ]
}

function buildWorkbook(rows: (string | number)[][]) {
  const ws = utils.aoa_to_sheet([TEMPLATE_HEADERS, ...rows])
  ws['!cols'] = [{ wch: 12 }, { wch: 42 }, { wch: 14 }, { wch: 9 }, { wch: 16 }, { wch: 12 }, { wch: 30 }]
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Tovarlar')
  return wb
}

export function downloadTemplate() { writeFile(buildWorkbook(templateRows()), P.import.templateName) }

/** Namuna fayl: 24 qator — 18 yangi, 4 mavjud SKU (yangilanadi), 3 xatoli qator. */
export function sampleWorkbookBuffer(existing: Product[]): ArrayBuffer {
  const rows: (string | number)[][] = []
  const names = [
    ['Samsung Galaxy A35, 128 GB, yangi', 3_690_000, 'Telefonlar', 12], ['Xiaomi Redmi Note 13, 256 GB, yangi', 3_290_000, 'Telefonlar', 12],
    ['Tecno Spark 20, 128 GB, yangi', 1_890_000, 'Telefonlar', 12], ['Artel 32" HD TV, yangi', 1_990_000, 'Televizorlar', 24],
    ['Shivaki 50" 4K Smart TV, yangi', 4_790_000, 'Televizorlar', 24], ['Acer Aspire 5, 16/512, yangi', 7_490_000, 'Noutbuklar', 12],
    ['HP 15s, 8/256, yangi', 5_690_000, 'Noutbuklar', 12], ['Asus Vivobook 15, 16/512, yangi', 7_990_000, 'Noutbuklar', 12],
    ['Artel kir yuvish mashinasi 6 kg, yangi', 3_590_000, 'Maishiy texnika', 24], ['Samsung muzlatgich 350 l, yangi', 8_990_000, 'Maishiy texnika', 24],
    ['Midea konditsioner 12, yangi', 5_490_000, 'Maishiy texnika', 36], ['Bosch changyutgich 2000 W, yangi', 1_790_000, 'Maishiy texnika', 12],
    ['Redmond multipishirgich 5 l, yangi', 890_000, 'Maishiy texnika', 12], ['Philips soch quritgich, yangi', 390_000, 'Maishiy texnika', 12],
    ['Realme C67, 128 GB, yangi', 2_390_000, 'Telefonlar', 12], ['Honor X8b, 256 GB, yangi', 2_990_000, 'Telefonlar', 12],
    ['Samsung 65" QLED, yangi', 12_900_000, 'Televizorlar', 24], ['Lenovo Tab M10, 4/64, yangi', 2_190_000, 'Noutbuklar', 12],
  ] as const
  names.forEach((n, i) => rows.push([`IMP-${3001 + i}`, n[0], n[1], 5 + ((i * 7) % 40), n[2], n[3], 'Namuna import qatori']))
  existing.slice(0, 4).forEach((p) => rows.push([p.sku, p.title, Math.round(p.priceTiyin / 100 * 0.97 / 10000) * 10000, p.stock + 20, '', p.warrantyMonths, 'Yangilangan narx va zaxira']))
  rows.push(['IMP-3101', 'Vivo Y28, 128 GB, yangi', '', 12, 'Telefonlar', 12, ''])
  rows.push(['IMP-3005', 'Takror SKU — Shivaki 50" TV', 4_790_000, 3, 'Televizorlar', 24, ''])
  rows.push(['', 'Nomsiz qator — SKU yo’q', 1_200_000, 4, 'Telefonlar', 12, ''])
  const out = write(buildWorkbook(rows), { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return out
}
