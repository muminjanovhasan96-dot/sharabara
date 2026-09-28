import { mallCheck } from '@/domain/pricing'
import { audit, emitLater, currentActor, mutate, now, genId } from './core'
import { subTransition } from './orders'
import { findSub } from './logistics'
import type { ApiKey, Product } from '@/domain/types'
import { formatMoney } from '@/domain/money'

export interface ImportRow { sku: string; title: string; priceTiyin: number; stock: number; categoryId?: string; warrantyMonths?: number; description?: string }

export const partner = {
  async updateProduct(id: string, patch: Partial<Pick<Product, 'priceTiyin' | 'stock' | 'title' | 'warrantyMonths' | 'returnDays' | 'description' | 'promo'>>) {
    return mutate((d) => {
      const p = d.products.find((x) => x.id === id)!
      const actor = currentActor('company')
      if (patch.priceTiyin !== undefined && patch.priceTiyin !== p.priceTiyin) {
        audit(d, actor, 'price', 'product', p.id, 'priceTiyin', p.priceTiyin, patch.priceTiyin)
        if (patch.priceTiyin < p.priceTiyin) p.previousPriceTiyin = p.priceTiyin
        // Sharabara price rule check against market median
        p.checkDelta = Math.round(((patch.priceTiyin - p.marketMedianTiyin) / p.marketMedianTiyin) * 1000) / 1000
        p.check = mallCheck(patch.priceTiyin, p.marketMedianTiyin)
      }
      if (patch.stock !== undefined && patch.stock !== p.stock) audit(d, actor, 'data', 'product', p.id, 'stock', p.stock, patch.stock)
      Object.assign(p, patch)
      return p
    }, { latency: [120, 350] })
  },

  /** Excel/CSV import (parsed rows) → adds/updates products for current company */
  async importProducts(rows: ImportRow[]): Promise<{ added: number; updated: number }> {
    return mutate((d) => {
      const s = currentActor('company')
      let added = 0, updated = 0
      for (const r of rows) {
        const existing = d.products.find((p) => p.companyId === s.id && p.sku === r.sku)
        if (existing) {
          existing.priceTiyin = r.priceTiyin; existing.stock = r.stock; if (r.title) existing.title = r.title
          existing.checkDelta = Math.round(((r.priceTiyin - existing.marketMedianTiyin) / existing.marketMedianTiyin) * 1000) / 1000
          existing.check = mallCheck(r.priceTiyin, existing.marketMedianTiyin)
          updated++
        } else {
          const cat = r.categoryId ?? d.categories[0].id
          const market = Math.round(r.priceTiyin * 1.04 / 100000) * 100000
          d.products.unshift({
            id: genId('P'), companyId: s.id, sku: r.sku, categoryId: cat, title: r.title, description: r.description ?? '', images: [`ill-${cat.replace('cat-', '')}-1`],
            priceTiyin: r.priceTiyin, marketMedianTiyin: market, stock: r.stock, warrantyMonths: r.warrantyMonths ?? 12, returnDays: 14,
            check: mallCheck(r.priceTiyin, market), checkDelta: Math.round(((r.priceTiyin - market) / market) * 1000) / 1000, attributes: {},
            stats: { views: 0, saves: 0, chats: 0, viewsByDay: Array(14).fill(0) }, createdAt: now(),
          })
          added++
        }
      }
      audit(d, s, 'data', 'company', s.id, 'import', null, `${added} qo'shildi, ${updated} yangilandi`)
      return { added, updated }
    }, { latency: [900, 1400] })
  },

  async createApiKey(label: string): Promise<{ key: ApiKey; secret: string }> {
    return mutate((d) => {
      const s = currentActor('company')
      const rnd = Math.random().toString(36).slice(2, 10)
      const secret = `sb_live_${rnd}${Math.random().toString(36).slice(2, 18)}`
      const key: ApiKey = { id: genId('K'), companyId: s.id, label, prefix: `sb_live_${rnd}`, createdAt: now(), revoked: false }
      d.apiKeys.unshift(key); audit(d, s, 'auth', 'apiKey', key.id, 'created', null, label)
      return { key, secret }
    })
  },
  async revokeApiKey(id: string) {
    return mutate((d) => { const k = d.apiKeys.find((x) => x.id === id)!; k.revoked = true; audit(d, currentActor('company'), 'auth', 'apiKey', k.id, 'revoked', 'false', 'true') })
  },

  /** Self-ship companies: "Tayyor" (packed) and "BTS'ga topshirdim" */
  async markReady(subOrderId: string) {
    return mutate((d) => { const { o, so } = findSub(d, subOrderId); so.waybill = so.waybill ?? `BTS-${Math.floor(10000 + Math.random() * 89999)}`; subTransition(d, o, so, 'packed', 'company'); return so })
  },
  async handedToBts(subOrderId: string) {
    return mutate((d) => { const { o, so } = findSub(d, subOrderId); subTransition(d, o, so, 'handed_to_bts', 'company'); return so })
  },

  async createPromo(productId: string, label: string, days: number, newPriceTiyin: number) {
    return mutate((d) => {
      const p = d.products.find((x) => x.id === productId)!
      const until = new Date(now()); until.setDate(until.getDate() + days)
      p.promo = { label, until: until.toISOString() }
      if (newPriceTiyin < p.priceTiyin) { p.previousPriceTiyin = p.priceTiyin; p.priceTiyin = newPriceTiyin }
      audit(d, currentActor('company'), 'price', 'product', p.id, 'promo', null, `${label} · ${formatMoney(newPriceTiyin)}`)
      emitLater('admin.toast', { title: 'Yangi aksiya', body: `${p.title} — ${label}`, section: 'products' })
      return p
    })
  },
}
