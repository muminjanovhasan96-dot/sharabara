import { audit, emitLater, currentActor, mutate, now, pushNotification, query, ApiError } from './core'
import { useStore } from '@/store'
import type { Condition, Listing, ListingStatus, PriceSuggestion, Tiyin, UserEvent, ChatThread } from '@/domain/types'
import { listingMachine } from '@/domain/machines'
import { suggestPrice } from '@/domain/pricing'
import { recognize } from '@/domain/checks/recognize'
import { MODEL_DICTIONARY } from '@/domain/checks/models'
import { calcFee } from '@/domain/fees'
import { priceDropTargets, matchSavedSearches } from '@/domain/recs'
import { formatMoney } from '@/domain/money'
import { genId } from './core'

function publishedRules(d = useStore.getState().data) {
  return d.feeRuleSets.find((r) => r.status === 'published') ?? d.feeRuleSets[0]
}

function transition(d: { listings: Listing[] }, l: Listing, to: ListingStatus, actorKind: 'staff' | 'user' = 'staff', note?: string) {
  listingMachine.assert(l.status, to)
  const from = l.status
  l.status = to
  const actor = currentActor(actorKind)
  audit(d as never, actor, 'status', 'listing', l.id, 'status', from, to, note)
  emitLater('listing.status', { listingId: l.id, status: to })
}

export interface NewListingInput {
  id?: string
  categoryId: string
  title: string
  description: string
  images: string[]
  regionId: Listing['regionId']
  district?: string
  condition: Condition
  askingTiyin: Tiyin
  imei?: string
  attributes: Record<string, string | number>
}

export const listings = {
  /** Sotuvchi e'lonni yuboradi: draft → submitted */
  async submit(input: NewListingInput): Promise<Listing> {
    return mutate((d) => {
      const seller = currentActor('user')
      let l = input.id ? d.listings.find((x) => x.id === input.id) : undefined
      if (!l) {
        l = {
          id: input.id ?? genId('L'), sellerId: seller.id, categoryId: input.categoryId, title: input.title,
          description: input.description, images: input.images, attributes: input.attributes, imei: input.imei,
          regionId: input.regionId, district: input.district, condition: input.condition,
          askingTiyin: input.askingTiyin, priceTiyin: input.askingTiyin, status: 'draft', priceVerified: false,
          createdAt: now(), stats: { views: 0, saves: 0, chats: 0, viewsByDay: Array(14).fill(0) },
        }
        d.listings.unshift(l)
      } else {
        Object.assign(l, { ...input, priceTiyin: input.askingTiyin })
      }
      l.submittedAt = now()
      if (l.status === 'draft' || l.status === 'returned_for_edit' || l.status === 'declined_by_seller') transition(d, l, 'submitted', 'user')
      emitLater('listing.submitted', { listingId: l!.id })
      return l
    })
  },

  /** AI tahlili: submitted → ai_checked → in_review. Returns steps for the animated screen. */
  async aiCheck(listingId: string): Promise<{ listing: Listing; suggestion: PriceSuggestion }> {
    return mutate((d) => {
      const l = d.listings.find((x) => x.id === listingId)
      if (!l) throw new ApiError('not_found', "E'lon topilmadi")
      const cat = d.categories.find((c) => c.id === l.categoryId)!
      l.specs = recognize(l, cat, MODEL_DICTIONARY)
      const model = MODEL_DICTIONARY.find((m) => m.model === l.specs?.model && (!m.storage || m.storage === l.specs?.storage))
        ?? MODEL_DICTIONARY.find((m) => m.model === l.specs?.model)
      const suggestion = suggestPrice({ listing: l, category: cat, history: d.listings, newRetailTiyin: model?.newRetailTiyin ?? null, now: now() })
      l.suggestion = suggestion
      if (l.status === 'submitted') transition(d, l, 'ai_checked', 'user', `AI tavsiya: ${formatMoney(suggestion.suggestedTiyin)}`)
      if (l.status === 'ai_checked') transition(d, l, 'in_review', 'user')
      emitLater('admin.toast', { title: `Yangi e'lon: ${l.title}`, body: 'Narx tekshiruvi kerak', section: 'pricing', tone: 'info' })
      return { listing: l, suggestion }
    }, { latency: [300, 600] })
  },

  /** Narx tahlilchisi sotuvchiga taklif yuboradi */
  async sendOffer(listingId: string, offeredTiyin: Tiyin, note: string): Promise<Listing> {
    return mutate((d) => {
      const l = d.listings.find((x) => x.id === listingId)
      if (!l) throw new ApiError('not_found', "E'lon topilmadi")
      const staff = currentActor('staff')
      const fee = calcFee(offeredTiyin, l.categoryId, publishedRules(d))
      l.offer = {
        offeredTiyin, feeTiyin: fee.feeTiyin, sellerGetsTiyin: fee.sellerGetsTiyin, note, byStaffId: staff.id, at: now(),
        aiSuggestedTiyin: l.suggestion?.suggestedTiyin ?? offeredTiyin,
      }
      audit(d, staff, 'price', 'listing', l.id, 'offer', l.askingTiyin, offeredTiyin, note)
      transition(d, l, 'offer_sent')
      d.priceDecisions.unshift({
        id: genId('PD'), listingId: l.id, at: now(), askingTiyin: l.askingTiyin,
        aiSuggestedTiyin: l.suggestion?.suggestedTiyin ?? offeredTiyin, moderatorTiyin: offeredTiyin,
        confidence: l.suggestion?.confidence ?? 0, byStaffId: staff.id,
      })
      pushNotification(d, l.sellerId, 'price_offer', 'Narx taklifi keldi', `${l.title} — ${formatMoney(offeredTiyin)}`, `/m/sell/offer/${l.id}`)
      emitLater('listing.offer_sent', { listingId: l.id, sellerId: l.sellerId })
      return l
    })
  },

  /** Moderator: tahrirga qaytarish / rad etish / qaytarish navbatga */
  async returnForEdit(listingId: string, reason: string) {
    return mutate((d) => {
      const l = d.listings.find((x) => x.id === listingId)!
      l.editRequestReason = reason
      transition(d, l, 'returned_for_edit', 'staff', reason)
      pushNotification(d, l.sellerId, 'listing_status', 'E’lonni tahrirlash kerak', reason, `/m/sell/my`)
      return l
    })
  },
  async reject(listingId: string, reason: string) {
    if (!reason.trim()) throw new ApiError('reason_required', 'Sabab kiritish shart')
    return mutate((d) => {
      const l = d.listings.find((x) => x.id === listingId)!
      l.rejectReason = reason
      transition(d, l, 'rejected_by_admin', 'staff', reason)
      pushNotification(d, l.sellerId, 'listing_status', 'E’lon rad etildi', reason, `/m/sell/my`)
      return l
    })
  },
  /** Moderator approves listing content (moderation queue): in_review stays; marks moderated */
  async approveContent(listingId: string) {
    return mutate((d) => {
      const l = d.listings.find((x) => x.id === listingId)!
      audit(d, currentActor('staff'), 'data', 'listing', l.id, 'moderation', 'pending', 'approved')
      ;(l as Listing & { moderated?: boolean }).moderated = true
      return l
    })
  },

  /** Sotuvchi taklifga rozi: offer_sent → accepted → published */
  async acceptOffer(listingId: string): Promise<Listing> {
    return mutate((d) => {
      const l = d.listings.find((x) => x.id === listingId)
      if (!l || !l.offer) throw new ApiError('no_offer', 'Taklif topilmadi')
      const prev = l.priceTiyin
      l.priceTiyin = l.offer.offeredTiyin
      l.priceVerified = true
      l.publishedAt = now()
      audit(d, currentActor('user'), 'price', 'listing', l.id, 'priceTiyin', prev, l.priceTiyin, 'Sotuvchi taklifni qabul qildi')
      transition(d, l, 'accepted', 'user')
      transition(d, l, 'published', 'user')
      const pd = d.priceDecisions.find((p) => p.listingId === l.id)
      if (pd) pd.sellerAccepted = true
      // recommendation triggers
      const interested = priceDropTargets(l, d.events).filter((u) => u !== l.sellerId)
      const targets = new Set<string>(interested)
      for (const ss of matchSavedSearches(l, d.savedSearches)) { targets.add(ss.userId); ss.lastMatchAt = now() }
      // demo: buyer viewed iPhone 13 yesterday → "siz qiziqqan" push
      const model = l.specs?.model ?? l.title
      for (const uid of targets) {
        if (uid === l.sellerId) continue
        pushNotification(d, uid, 'saved_search', `Siz qiziqqan ${model} — ${formatMoney(l.priceTiyin)}`, 'Narxi tekshirilgan e’lon endi sotuvda', `/m/listing/${l.id}`)
      }
      emitLater('listing.published', { listingId: l.id })
      return l
    })
  },
  async declineOffer(listingId: string): Promise<Listing> {
    return mutate((d) => {
      const l = d.listings.find((x) => x.id === listingId)!
      transition(d, l, 'declined_by_seller', 'user')
      const pd = d.priceDecisions.find((p) => p.listingId === l.id)
      if (pd) pd.sellerAccepted = false
      return l
    })
  },

  async remove(listingId: string) {
    return mutate((d) => { const l = d.listings.find((x) => x.id === listingId)!; transition(d, l, 'removed', 'user') })
  },
  async renew(listingId: string) {
    return mutate((d) => { const l = d.listings.find((x) => x.id === listingId)!; transition(d, l, 'published', 'user') })
  },
  /** Seller lowers price on a published listing → price-drop pushes */
  async changePrice(listingId: string, newTiyin: Tiyin) {
    return mutate((d) => {
      const l = d.listings.find((x) => x.id === listingId)!
      const prev = l.priceTiyin
      if (newTiyin < prev) l.previousPriceTiyin = prev
      l.priceTiyin = newTiyin
      audit(d, currentActor('user'), 'price', 'listing', l.id, 'priceTiyin', prev, newTiyin)
      if (newTiyin < prev) {
        for (const uid of priceDropTargets(l, d.events)) if (uid !== l.sellerId)
          pushNotification(d, uid, 'price_drop', 'Narx tushdi', `${l.title}: ${formatMoney(prev)} → ${formatMoney(newTiyin)}`, `/m/listing/${l.id}`)
      }
      return l
    })
  },

  async boost(listingId: string, packageId: string) {
    return mutate((d) => {
      const l = d.listings.find((x) => x.id === listingId)!
      const pkg = d.boostPackages.find((p) => p.id === packageId)!
      const until = new Date(now()); until.setDate(until.getDate() + pkg.days)
      l.boosted = { until: until.toISOString(), packageId }
      d.transactions.unshift({ id: genId('TX'), kind: 'boost', provider: 'payme', amountTiyin: pkg.priceTiyin, at: now(), refId: l.id, status: 'ok', note: `E'lonni ko'tarish: ${pkg.name}` })
      audit(d, currentActor('user'), 'money', 'listing', l.id, 'boost', null, pkg.name)
      return l
    }, { latency: [900, 1500] })
  },

  // ─── Buyer interactions (recorded as events for recs) ────────────────
  async trackEvent(ev: Omit<UserEvent, 'at' | 'userId'> & { userId?: string }) {
    const s = useStore.getState()
    s.update((d) => {
      d.events.push({ ...ev, userId: ev.userId ?? s.session.userId, at: now() })
      if (d.events.length > 3000) d.events.splice(0, d.events.length - 3000)
      if (ev.kind === 'view' && ev.itemId) {
        const l = d.listings.find((x) => x.id === ev.itemId)
        if (l) { l.stats.views += 1; l.stats.viewsByDay[l.stats.viewsByDay.length - 1] += 1 }
        const p = d.products.find((x) => x.id === ev.itemId)
        if (p) { p.stats.views += 1 }
      }
    })
  },
  async toggleSave(itemId: string, source: 'listing' | 'product') {
    const s = useStore.getState()
    const list = source === 'listing' ? s.ui.savedListingIds : s.ui.savedProductIds
    const saved = list.includes(itemId)
    s.setUi((u) => {
      const arr = source === 'listing' ? u.savedListingIds : u.savedProductIds
      const i = arr.indexOf(itemId); if (i >= 0) arr.splice(i, 1); else arr.push(itemId)
    })
    s.update((d) => {
      const l = d.listings.find((x) => x.id === itemId)
      if (l) l.stats.saves += saved ? -1 : 1
      if (!saved) d.events.push({ userId: s.session.userId, kind: 'save', at: now(), itemId, source, categoryId: l?.categoryId, priceTiyin: l?.priceTiyin, regionId: l?.regionId, model: l?.specs?.model })
    })
    return !saved
  },
  async saveSearch(queryText: string, opts: { categoryId?: string; maxPriceTiyin?: Tiyin } = {}) {
    return mutate((d) => {
      const s = useStore.getState()
      const ss = { id: genId('SS'), userId: s.session.userId, query: queryText, ...opts, createdAt: now() }
      d.savedSearches.unshift(ss)
      return ss
    }, { latency: [120, 300] })
  },
  async deleteSavedSearch(id: string) {
    return mutate((d) => { const i = d.savedSearches.findIndex((x) => x.id === id); if (i >= 0) d.savedSearches.splice(i, 1) })
  },
  async clearHistory() {
    return mutate((d) => {
      const uid = useStore.getState().session.userId
      for (let i = d.events.length - 1; i >= 0; i--) if (d.events[i].userId === uid) d.events.splice(i, 1)
    })
  },

  // ─── Chat ───────────────────────────────────────────────────────────
  async openThread(listingId: string): Promise<ChatThread> {
    return mutate((d) => {
      const s = useStore.getState()
      const l = d.listings.find((x) => x.id === listingId)!
      let t = d.chats.find((c) => c.listingId === listingId && c.buyerId === s.session.userId)
      if (!t) {
        t = { id: genId('CH'), listingId, buyerId: s.session.userId, sellerId: l.sellerId, messages: [], updatedAt: now() }
        d.chats.unshift(t); l.stats.chats += 1
        d.events.push({ userId: s.session.userId, kind: 'chat', at: now(), itemId: listingId, source: 'listing', categoryId: l.categoryId, priceTiyin: l.priceTiyin, model: l.specs?.model })
      }
      return t
    }, { latency: [100, 250] })
  },
  async sendMessage(threadId: string, text: string, from?: string) {
    return mutate((d) => {
      const t = d.chats.find((c) => c.id === threadId)!
      const sender = from ?? useStore.getState().session.userId
      t.messages.push({ id: genId('M'), from: sender, text, at: now(), read: false })
      t.updatedAt = now()
      const to = sender === t.buyerId ? t.sellerId : t.buyerId
      pushNotification(d, to, 'chat', 'Yangi xabar', text.slice(0, 80), `/m/chat/${t.id}`)
      return t
    }, { latency: [80, 200] })
  },

  async markNotificationsRead(ids?: string[]) {
    return mutate((d) => {
      const uid = useStore.getState().session.userId
      for (const n of d.notifications) if (n.userId === uid && (!ids || ids.includes(n.id))) n.read = true
    }, { latency: [50, 120] })
  },

  // ─── Queries ────────────────────────────────────────────────────────
  list: (filter?: (l: Listing) => boolean) => query((d) => d.listings.filter((l) => !l.historical && (!filter || filter(l)))),
  get: (id: string) => query((d) => d.listings.find((l) => l.id === id) ?? null, [80, 200]),
}
