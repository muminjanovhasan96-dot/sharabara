import type { ApiKey, Company, ISODate, Product } from '../domain/types'
import { MODEL_DICTIONARY } from '../domain/checks/models'
import { addDays, setHour } from '../domain/clock'
import { mulRate, roundToStep } from '../domain/money'
import type { Rng } from './rng'
import { CATEGORY_SLUG, TEMPLATES } from './static'

const S = 100

export function makeCompanies(now: ISODate): Company[] {
  return [
    {
      id: 'c-namuna', name: 'Namuna Elektronika', inn: '305 112 447', model: 'warehouse', status: 'active', commissionRate: 0.08,
      rating: 4.7, lateShipments: 3, returnsRate: 0.021, joinedAt: addDays(now, -240), contractFile: 'shartnoma-namuna.pdf',
      shipSpeedDays: 1, description: 'Smartfon, noutbuk va televizorlar rasmiy kafolat bilan. Sharabara omboridan yetkaziladi.', sealIcon: 'shield-check',
    },
    {
      id: 'c-baraka', name: 'Baraka Mebel', inn: '302 887 015', model: 'self_ship', status: 'active', commissionRate: 0.1,
      rating: 4.5, lateShipments: 7, returnsRate: 0.034, joinedAt: addDays(now, -180), contractFile: 'shartnoma-baraka.pdf',
      shipSpeedDays: 3, description: "Toshkentda ishlab chiqarilgan mebel. O'zi yetkazib beradi, yig'ish bepul.", sealIcon: 'armchair',
    },
    {
      id: 'c-oltin', name: 'Oltin Uy Jihozlari', inn: '308 450 921', model: 'wholesale', status: 'active', commissionRate: 0.07,
      rating: 4.6, lateShipments: 2, returnsRate: 0.015, joinedAt: addDays(now, -95), contractFile: 'shartnoma-oltin.pdf',
      shipSpeedDays: 2, description: 'Maishiy texnika, bolalar va sport tovarlari ulgurji narxlarda.', sealIcon: 'badge-check',
    },
  ]
}

export function makeApiKeys(r: Rng, now: ISODate, companies: Company[]): ApiKey[] {
  const out: ApiKey[] = []
  const hex = () => Array.from({ length: 4 }, () => '0123456789abcdef'[r.int(0, 15)]).join('')
  for (const c of companies) {
    out.push({ id: `ak-${c.id}-1`, companyId: c.id, label: 'Ombor sinxronizatsiyasi', prefix: `sb_live_${hex()}`, createdAt: addDays(c.joinedAt, 3), lastUsedAt: addDays(now, -r.int(0, 2)), revoked: false })
    out.push({ id: `ak-${c.id}-2`, companyId: c.id, label: 'Buyurtma webhook', prefix: `sb_live_${hex()}`, createdAt: addDays(c.joinedAt, 20), lastUsedAt: addDays(now, -r.int(3, 30)), revoked: r.chance(0.3) })
  }
  return out
}

const NEW_PHRASES = ['yangi, kafolat bilan', 'rasmiy kafolat 12 oy', 'yangi, qutida']

export function makeProducts(r: Rng, now: ISODate): Product[] {
  const out: Product[] = []
  let n = 0
  const push = (companyId: string, categoryId: string, title: string, description: string, marketSum: number, attributes: Record<string, string | number>) => {
    n += 1
    const market = roundToStep(marketSum * S, 1_000_000)
    const delta = Math.round(r.float(-0.12, 0.15) * 100) / 100
    const price = roundToStep(mulRate(market, 1 + delta), 1_000_000)
    const check: Product['check'] = r.chance(0.1) ? 'pending' : delta > 0.05 ? 'overpriced' : 'passed'
    const stock = r.chance(0.15) ? r.int(0, 3) : r.int(4, 60)
    const created = setHour(addDays(now, -r.int(1, 80)), r.int(8, 20))
    const views = r.int(20, 900)
    const p: Product = {
      id: `P-${String(n).padStart(3, '0')}`, companyId, sku: `${companyId.slice(2, 5).toUpperCase()}-${String(1000 + n)}`, categoryId,
      title, description, images: [`ill-${CATEGORY_SLUG[categoryId]}-${r.int(1, 4)}`, `ill-${CATEGORY_SLUG[categoryId]}-${r.int(1, 4)}`],
      priceTiyin: price, marketMedianTiyin: market, stock, warrantyMonths: r.pick([6, 12, 12, 24]), returnDays: r.pick([7, 14, 14, 30]),
      check, checkDelta: Math.round(((price - market) / market) * 100) / 100, attributes,
      stats: { views, saves: r.int(0, 30), chats: 0, viewsByDay: Array.from({ length: 14 }, () => r.int(0, Math.max(1, Math.round(views / 10)))) },
      createdAt: created,
    }
    if (r.chance(0.15)) {
      p.previousPriceTiyin = roundToStep(mulRate(price, 1.1), 1_000_000)
      p.promo = { label: r.pick(['−10%', 'Aksiya', 'Haftalik chegirma']), until: addDays(now, r.int(2, 10)) }
    }
    out.push(p)
  }

  // Namuna Elektronika: 60 products from the dictionary
  const electronics = MODEL_DICTIONARY.filter((m) => ['telefonlar', 'noutbuklar', 'televizorlar', 'maishiy'].includes(m.categoryId))
  for (let i = 0; i < 60; i++) {
    const m = electronics[i % electronics.length]
    const variant = m.categoryId === 'telefonlar' ? r.pick(['128 GB', '256 GB']) : m.categoryId === 'noutbuklar' ? r.pick(['8/256', '16/512']) : ''
    push('c-namuna', m.categoryId, `${m.model}${variant ? `, ${variant}` : ''}, ${r.pick(NEW_PHRASES)}`,
      `${m.model} — yangi, rasmiy kafolat. Sharabara omboridan 1 kunda yetkaziladi. Namuna mahsulot.`, m.newRetailTiyin / S,
      m.categoryId === 'telefonlar' ? { model: m.model, xotira: variant, rang: r.pick(['Qora', 'Oq', "Ko'k"]) } : { model: m.model })
  }
  // Baraka Mebel: 30
  for (let i = 0; i < 30; i++) {
    const t = TEMPLATES.mebel[i % TEMPLATES.mebel.length]
    push('c-baraka', 'mebel', `${t.title.replace(/, .*$/, '')} — ${r.pick(['Baraka', 'Premium', 'Klassik'])} seriya`, `${t.desc} Ishlab chiqaruvchidan, yig'ish bepul. Namuna mahsulot.`, Math.round(t.max * 1.3), { ...t.attributes })
  }
  // Oltin Uy Jihozlari: 60
  const oltinCats: (keyof typeof TEMPLATES | 'maishiy')[] = ['bolalar', 'sport', 'kiyim', 'maishiy']
  const appliances = MODEL_DICTIONARY.filter((m) => m.categoryId === 'maishiy')
  for (let i = 0; i < 60; i++) {
    const c = oltinCats[i % oltinCats.length]
    if (c === 'maishiy') {
      const m = appliances[i % appliances.length]
      push('c-oltin', 'maishiy', `${m.model}, ${r.pick(NEW_PHRASES)}`, `${m.model} — ulgurji narxda, kafolat bilan. Namuna mahsulot.`, m.newRetailTiyin / S, { model: m.model })
    } else {
      const t = TEMPLATES[c][i % TEMPLATES[c].length]
      push('c-oltin', c, `${t.title.replace(/, .*$/, '')}, yangi`, `${t.desc} Ulgurji narx. Namuna mahsulot.`, Math.round(t.max * 1.25), { ...t.attributes })
    }
  }
  return out
}
