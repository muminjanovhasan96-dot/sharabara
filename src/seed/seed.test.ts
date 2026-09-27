import { describe, it, expect } from 'vitest'
import { generateSnapshot, GOLDEN, DEMO_NOW, MODEL_DICTIONARY, goldenListing } from './index'
import { rng } from './rng'
import { suggestPrice, breakdownIsConsistent } from '../domain/pricing'
import { calcFee } from '../domain/fees'
import { rankFeed } from '../domain/recs'
import { subOrderMachine, needsSecondApproval } from '../domain/machines'
import { modelOf } from '../domain/pricing'

const snap = generateSnapshot(2026, DEMO_NOW)

describe('rng', () => {
  it('is deterministic and well-behaved', () => {
    const a = rng(7); const b = rng(7)
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()))
    const r = rng(1)
    for (let i = 0; i < 200; i++) { const v = r.int(3, 9); expect(v).toBeGreaterThanOrEqual(3); expect(v).toBeLessThanOrEqual(9) }
    expect(r.int(9, 3)).toBeGreaterThanOrEqual(3)
    expect([1, 2, 3]).toContain(r.pick([1, 2, 3]))
    expect(() => r.pick([])).toThrow()
    expect(r.shuffle([1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4])
    expect(typeof r.chance(0.5)).toBe('boolean')
    const f = r.float(1, 2); expect(f).toBeGreaterThanOrEqual(1); expect(f).toBeLessThan(2)
    expect(rng(5).fork('x').next()).toBe(rng(5).fork('x').next())
    expect(rng(5).fork('x').next()).not.toBe(rng(5).fork('y').next())
  })
})

describe('generateSnapshot determinism', () => {
  it('same seed ⇒ deep-equal; different seed ⇒ different', () => {
    expect(generateSnapshot(2026, DEMO_NOW)).toEqual(snap)
    const other = generateSnapshot(7, DEMO_NOW)
    expect(other.seed).toBe(7)
    expect(other.users.map((u) => u.name)).not.toEqual(snap.users.map((u) => u.name))
    expect(generateSnapshot().seed).toBe(2026)
  })
})

describe('counts and fixed ids', () => {
  const catalogue = snap.listings.filter((l) => !l.historical && l.id !== GOLDEN.listingId)
  it('reference data', () => {
    expect(snap.regions).toHaveLength(14)
    expect(snap.regions.map((r) => r.name)).toContain("Qoraqalpog'iston")
    expect(snap.branches).toHaveLength(45)
    const br = snap.branches.find((b) => b.id === GOLDEN.branchId)!
    expect(br).toMatchObject({ name: 'BTS Namangan Markaz (namuna)', regionId: 'namangan' })
    expect(snap.branches.filter((b) => b.regionId === 'toshkent_sh').length).toBeGreaterThanOrEqual(10)
    expect(new Set(snap.branches.map((b) => b.id)).size).toBe(45)
    expect(snap.categories).toHaveLength(8)
    expect(snap.categories.find((c) => c.id === 'kiyim')).toMatchObject({ discountRate: 0.08, maxNewRatio: 0.6 })
    expect(snap.staff).toHaveLength(9)
    expect(snap.staff.map((s) => s.role)).toEqual(expect.arrayContaining(['super_admin', 'moderator', 'price_analyst', 'logistics', 'finance', 'operator', 'director']))
    expect(snap.boostPackages.map((b) => [b.name, b.days, b.priceTiyin])).toEqual([['Kun', 1, 900_000], ['Hafta', 7, 3_900_000], ['Premium', 14, 6_900_000]])
    expect(Object.keys(snap.roleMatrix)).toHaveLength(7)
    expect(snap.roleMatrix.finance.payments).toEqual(['view', 'edit', 'approve'])
    expect(snap.roleMatrix.operator.users).toEqual(['view'])
  })
  it('users', () => {
    expect(snap.users).toHaveLength(40)
    expect(new Set(snap.users.map((u) => u.name)).size).toBe(40)
    expect(snap.users.find((u) => u.id === 'u-buyer')).toMatchObject({ name: 'Aziz Karimov', regionId: 'namangan' })
    expect(snap.users.find((u) => u.id === 'u-seller')).toMatchObject({ name: 'Dilnoza Rashidova', regionId: 'toshkent_sh', soldCount: 312, rating: 4.9, verifiedSeller: true, joinedAt: '2026-05-28T14:32:00' })
    for (const u of snap.users) { expect(u.rating).toBeGreaterThanOrEqual(4.2); expect(u.rating).toBeLessThanOrEqual(5); expect(u.phoneMasked).toMatch(/^\+998 \d\d ••• •• \d\d$/) }
  })
  it('listings', () => {
    expect(catalogue).toHaveLength(160)
    const published = catalogue.filter((l) => l.status === 'published').length
    expect(published / 160).toBeGreaterThan(0.4)
    expect(published / 160).toBeLessThan(0.5)
    expect(new Set(snap.listings.map((l) => l.id)).size).toBe(snap.listings.length)
    expect(snap.listings.filter((l) => l.historical).length).toBeGreaterThanOrEqual(30)
    expect(catalogue.some((l) => l.previousPriceTiyin && l.previousPriceTiyin > l.priceTiyin && l.status === 'published')).toBe(true)
    for (const l of snap.listings) {
      expect(Number.isInteger(l.priceTiyin)).toBe(true)
      expect(l.stats.viewsByDay).toHaveLength(14)
      expect(l.images.every((i) => /^ill-[a-z]+-[1-4]$/.test(i))).toBe(true)
      expect(l.title).not.toMatch(/lorem/i)
      if (l.status === 'published') expect(l.publishedAt).toBeDefined()
    }
    // no non-historical iPhone 13 Pro 256 GB comparables may leak into the golden computation
    expect(catalogue.filter((l) => modelOf(l) === 'iPhone 13 Pro')).toHaveLength(0)
    expect(catalogue.filter((l) => modelOf(l) === 'iPhone 13' && l.status === 'published').length).toBeGreaterThanOrEqual(5)
  })
  it('mall', () => {
    expect(snap.companies.map((c) => c.id)).toEqual(['c-namuna', 'c-baraka', 'c-oltin'])
    expect(snap.companies.map((c) => c.commissionRate)).toEqual([0.08, 0.1, 0.07])
    expect(snap.products.length).toBe(150)
    expect(snap.products.some((p) => p.stock <= 3)).toBe(true)
    expect(snap.products.some((p) => p.promo)).toBe(true)
    expect(snap.products.some((p) => p.check === 'overpriced')).toBe(true)
    expect(snap.products.some((p) => p.check === 'pending')).toBe(true)
    expect(snap.apiKeys).toHaveLength(6)
    expect(snap.apiKeys.every((k) => /^sb_live_[0-9a-f]{4}$/.test(k.prefix))).toBe(true)
  })
  it('commerce', () => {
    expect(snap.orders.length).toBeGreaterThanOrEqual(135)
    const buyerOrders = snap.orders.filter((o) => o.buyerId === 'u-buyer')
    expect(buyerOrders).toHaveLength(3)
    expect(buyerOrders.map((o) => o.subOrders[0].status).sort()).toEqual(['at_branch', 'delivered', 'in_transit'])
    expect(buyerOrders.every((o) => o.delivery.branchId === GOLDEN.branchId)).toBe(true)
    const statuses = new Set(snap.orders.flatMap((o) => o.subOrders.map((s) => s.status)))
    for (const s of ['packing', 'packed', 'handed_to_bts', 'in_transit', 'at_branch', 'delivered', 'payout_scheduled', 'payout_paid', 'cancelled', 'return_requested']) expect(statuses.has(s as never)).toBe(true)
    for (const o of snap.orders) {
      expect(o.totalTiyin).toBe(o.itemsTiyin + o.delivery.feeTiyin)
      for (const s of o.subOrders) {
        expect(s.subtotalTiyin).toBe(s.items.reduce((a, i) => a + i.priceTiyin * i.qty, 0))
        for (let i = 1; i < s.timeline.length; i++) subOrderMachine.assert(s.timeline[i - 1].status, s.timeline[i].status)
        expect(s.timeline.at(-1)!.status).toBe(s.status)
        if (s.waybill) expect(s.waybill).toMatch(/^BTS-\d{4}-\d{5}$/)
      }
    }
    expect(snap.feeRuleSets.map((f) => [f.version, f.status])).toEqual([[1, 'published'], [2, 'draft']])
    expect(snap.feeApprovals).toHaveLength(6)
    expect(snap.feeApprovals.every((f) => f.status === 'pending')).toBe(true)
    expect(snap.returns).toHaveLength(4)
    expect(snap.returns.every((r) => r.status === 'requested' && r.slaHours === 48)).toBe(true)
    expect(snap.transactions.length).toBeGreaterThanOrEqual(140)
    expect(snap.transactions.length).toBeLessThanOrEqual(170)
  })
  it('manifests and payouts', () => {
    const today = snap.manifests.find((m) => m.status === 'open')!
    expect(today.date).toBe('2026-09-27')
    expect(today.subOrderIds.length).toBeGreaterThan(0)
    const yesterday = snap.manifests.find((m) => m.date === '2026-09-26')!
    expect(yesterday.status).toBe('picked_up')
    expect(snap.payouts).toHaveLength(8)
    const big = snap.payouts.find((p) => p.status === 'awaiting_second_approval')!
    expect(big.sellerKey).toBe('c:c-namuna')
    expect(needsSecondApproval(big.amountTiyin)).toBe(true)
    expect(new Set(snap.payouts.map((p) => p.status))).toEqual(new Set(['pending', 'scheduled', 'awaiting_second_approval', 'paid']))
  })
  it('social & misc', () => {
    expect(snap.chats).toHaveLength(6)
    expect(snap.chats[0].buyerId).toBe('u-buyer')
    expect(snap.notifications.filter((n) => n.userId === 'u-buyer')).toHaveLength(6)
    expect(snap.notifications.filter((n) => n.userId === 'u-seller')).toHaveLength(4)
    expect(snap.savedSearches[0]).toMatchObject({ userId: 'u-buyer', query: 'iphone 13 pro', maxPriceTiyin: 700_000_000 })
    expect(snap.campaigns.filter((c) => c.status === 'sent')).toHaveLength(2)
    expect(snap.campaigns.filter((c) => c.status === 'draft')).toHaveLength(1)
    expect(snap.audit.length).toBeGreaterThanOrEqual(55)
    expect(snap.priceDecisions).toHaveLength(40)
    expect(snap.dailyStats).toHaveLength(30)
    expect(snap.dailyStats.at(-1)!.date).toBe('2026-09-27')
    const buyerEvents = snap.events.filter((e) => e.userId === 'u-buyer')
    expect(buyerEvents.filter((e) => e.kind === 'view_long')).toHaveLength(3)
    expect(buyerEvents.some((e) => e.kind === 'search' && e.query === 'iphone 13')).toBe(true)
    expect(buyerEvents.some((e) => e.kind === 'save')).toBe(true)
    expect(MODEL_DICTIONARY.length).toBeGreaterThan(20)
  })
})

describe('golden path from the generated snapshot', () => {
  const listing = goldenListing(snap)
  const category = snap.categories.find((c) => c.id === 'telefonlar')!
  it('golden listing shape', () => {
    expect(listing).toMatchObject({
      id: 'L-58213', sellerId: 'u-seller', title: 'iPhone 13 Pro, 256 GB, Sierra Blue', condition: 'B', askingTiyin: 660_000_000,
      status: 'draft', imei: '356789104123457', regionId: 'toshkent_sh', images: ['ill-phone-1', 'ill-phone-2', 'ill-phone-3', 'ill-phone-4'],
      attributes: { model: 'iPhone 13 Pro', xotira: '256 GB', rang: 'Sierra Blue', batareya: 89 },
    })
    expect(listing.description).toContain('orqa qopqoqda mayda tirnalish')
  })
  it('suggestPrice returns the exact demo numbers', () => {
    const s = suggestPrice({ listing, category, history: snap.listings, newRetailTiyin: GOLDEN.newRetail, now: DEMO_NOW })
    expect(s.marketMedianTiyin).toBe(GOLDEN.marketMedian)
    expect(s.suggestedTiyin).toBe(GOLDEN.suggested)
    expect(s.breakdown.map((b) => b.amountTiyin)).toEqual([690_000_000, -35_000_000, -35_000_000, 620_000_000])
    expect(s.breakdown[1].label).toBe('Holat tuzatmasi (B)')
    expect(s.breakdown[2].label).toBe('Sharabara qoidasi (−5%)')
    expect(breakdownIsConsistent(s)).toBe(true)
    expect(s.comparables.length).toBeGreaterThanOrEqual(10)
    expect(s.confidence).toBeGreaterThanOrEqual(0.85)
    expect(s.confidence).toBeLessThanOrEqual(0.89)
    expect(s.flags).toEqual(['fair'])
  })
  it('fee and totals', () => {
    const fee = calcFee(GOLDEN.suggested, 'telefonlar', snap.feeRuleSets[0])
    expect(fee.feeTiyin).toBe(GOLDEN.fee)
    expect(fee.sellerGetsTiyin).toBe(GOLDEN.sellerGets)
    expect(GOLDEN.suggested + GOLDEN.deliveryFee).toBe(GOLDEN.total)
  })
  it('feed for u-buyer puts iPhones first with an iPhone reason and hides the draft golden listing', () => {
    const feed = rankFeed({ userId: 'u-buyer', events: snap.events, listings: snap.listings, products: snap.products, now: DEMO_NOW, limit: 20 })
    expect(feed.length).toBe(20)
    const titleOf = (f: { id: string }) => (snap.listings.find((l) => l.id === f.id) ?? snap.products.find((p) => p.id === f.id))!.title
    expect(titleOf(feed[0])).toMatch(/iPhone/)
    expect(feed[0].reason).toMatch(/iPhone|iphone/)
    expect(feed.slice(0, 3).every((f) => /iPhone/.test(titleOf(f)))).toBe(true)
    expect(feed.some((f) => f.id === GOLDEN.listingId)).toBe(false)
    expect(feed.some((f) => f.id.startsWith('H-'))).toBe(false)
    expect(feed.some((f) => f.bucket === 'mall')).toBe(true)
  })
})
