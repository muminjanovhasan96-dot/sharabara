import { audit, emitLater, currentActor, mutate, now, pushNotification, genId, ApiError } from './core'
import type { AdminSection, Campaign, Category, Company, CompanyModel, Permission, StaffRole } from '@/domain/types'

export const admin = {
  // ─── Users ────────────────────────────────────────────────────────────
  async verifySeller(userId: string, verified: boolean) {
    return mutate((d) => { const u = d.users.find((x) => x.id === userId)!; u.verifiedSeller = verified; audit(d, currentActor('staff'), 'data', 'user', u.id, 'verifiedSeller', String(!verified), String(verified)); return u })
  },
  async blockUser(userId: string, reason: string) {
    if (!reason.trim()) throw new ApiError('reason_required', 'Sabab kiritish shart')
    return mutate((d) => { const u = d.users.find((x) => x.id === userId)!; u.blocked = { at: now(), reason, by: currentActor('staff').id }; audit(d, currentActor('staff'), 'auth', 'user', u.id, 'blocked', null, reason); return u })
  },
  async unblockUser(userId: string) {
    return mutate((d) => { const u = d.users.find((x) => x.id === userId)!; u.blocked = null; audit(d, currentActor('staff'), 'auth', 'user', u.id, 'blocked', 'true', null); return u })
  },

  // ─── Roles matrix ─────────────────────────────────────────────────────
  async setPermission(role: StaffRole, section: AdminSection, perm: Permission, on: boolean) {
    return mutate((d) => {
      const cur = new Set(d.roleMatrix[role][section] ?? [])
      if (on) cur.add(perm); else cur.delete(perm)
      if (on && perm !== 'view') cur.add('view')
      if (!on && perm === 'view') { cur.clear() }
      const arr = [...cur] as Permission[]
      if (arr.length) d.roleMatrix[role][section] = arr; else delete d.roleMatrix[role][section]
      audit(d, currentActor('staff'), 'auth', 'role', role, section, null, arr.join(',') || '—')
    }, { latency: [60, 160] })
  },

  // ─── Categories ───────────────────────────────────────────────────────
  async updateCategory(id: string, patch: Partial<Pick<Category, 'discountRate' | 'maxNewRatio' | 'name' | 'conditionNotes' | 'attributes'>>) {
    return mutate((d) => {
      const c = d.categories.find((x) => x.id === id)!
      for (const k of Object.keys(patch) as (keyof typeof patch)[]) {
        audit(d, currentActor('staff'), k === 'discountRate' ? 'price' : 'data', 'category', c.id, k, typeof c[k] === 'object' ? JSON.stringify(c[k]) : (c[k] as string | number), typeof patch[k] === 'object' ? JSON.stringify(patch[k]) : (patch[k] as string | number))
      }
      Object.assign(c, patch)
      return c
    })
  },
  async addCategory(name: string, parentId: string | null, icon = 'tag') {
    return mutate((d) => {
      const c: Category = { id: `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${d.categories.length}`, parentId, name, icon, attributes: [], discountRate: 0.05, maxNewRatio: 0.85, conditionNotes: { A: 'Yangidek, izsiz', B: 'Yaxshi, mayda izlar', C: 'Ko’rinarli izlar, ishlaydi', D: 'Ta’mir talab' } }
      d.categories.push(c); audit(d, currentActor('staff'), 'data', 'category', c.id, 'created', null, name); return c
    })
  },

  // ─── Companies ────────────────────────────────────────────────────────
  async onboardCompany(input: { name: string; inn: string; model: CompanyModel; commissionRate: number; contractFile?: string; description?: string }) {
    return mutate((d) => {
      const c: Company = { id: genId('c'), name: input.name, inn: input.inn, model: input.model, status: 'onboarding', commissionRate: input.commissionRate, rating: 0, lateShipments: 0, returnsRate: 0, joinedAt: now(), contractFile: input.contractFile, shipSpeedDays: 2, description: input.description ?? '', sealIcon: 'store' }
      d.companies.unshift(c); audit(d, currentActor('staff'), 'data', 'company', c.id, 'created', null, c.name); return c
    })
  },
  async setCompanyStatus(id: string, status: Company['status']) {
    return mutate((d) => { const c = d.companies.find((x) => x.id === id)!; const from = c.status; c.status = status; audit(d, currentActor('staff'), 'status', 'company', c.id, 'status', from, status); return c })
  },
  async setCommission(id: string, rate: number) {
    return mutate((d) => { const c = d.companies.find((x) => x.id === id)!; audit(d, currentActor('staff'), 'money', 'company', c.id, 'commissionRate', c.commissionRate, rate); c.commissionRate = rate; return c })
  },

  // ─── Mall products moderation ─────────────────────────────────────────
  async productCheck(productId: string, result: 'passed' | 'overpriced') {
    return mutate((d) => {
      const p = d.products.find((x) => x.id === productId)!
      p.check = result; audit(d, currentActor('staff'), 'price', 'product', p.id, 'check', 'pending', result)
      return p
    })
  },

  // ─── Campaigns ────────────────────────────────────────────────────────
  async saveCampaign(input: Omit<Campaign, 'id' | 'status' | 'createdAt'> & { id?: string }): Promise<Campaign> {
    return mutate((d) => {
      let c = input.id ? d.campaigns.find((x) => x.id === input.id) : undefined
      if (!c) { c = { ...input, id: genId('CP'), status: 'draft', createdAt: now() }; d.campaigns.unshift(c) } else Object.assign(c, input)
      return c
    })
  },
  /** "Hozir yuborish" → real pushes to matching users (incl. stage phone) */
  async sendCampaign(id: string) {
    return mutate((d) => {
      const c = d.campaigns.find((x) => x.id === id)!
      const targets = d.users.filter((u) => (!c.segment.regionIds.length || c.segment.regionIds.includes(u.regionId)) && u.notificationsEnabled)
      // always include the demo buyer so the stage phone shows it
      const ids = new Set(targets.map((u) => u.id)); ids.add('u-buyer')
      for (const uid of ids) pushNotification(d, uid, 'campaign', c.title, c.body, '/m')
      c.status = 'sent'; c.sentAt = now(); c.reach = ids.size
      audit(d, currentActor('staff'), 'data', 'campaign', c.id, 'status', 'draft', 'sent', `${ids.size} ta foydalanuvchi`)
      emitLater('admin.toast', { title: 'Kampaniya yuborildi', body: `${ids.size} ta foydalanuvchiga`, tone: 'success' })
      return c
    }, { latency: [600, 1000] })
  },
}
