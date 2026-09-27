import type { AuditEntry, BoostPackage, DailyStat, ISODate, Listing, Order, PriceDecision, Payout, RegionId, Staff, BtsBranch, User } from '../domain/types'
import { makeAudit, resetAuditCounter } from '../domain/audit'
import { addDays, addHours, dateKey } from '../domain/clock'
import { mulRate, roundToStep } from '../domain/money'
import type { Rng } from './rng'

const S = 100

export function makeBoostPackages(): BoostPackage[] {
  return [
    { id: 'boost-kun', name: 'Kun', days: 1, priceTiyin: 9_000 * S, description: "E'lon 1 kun davomida ro'yxat boshida turadi" },
    { id: 'boost-hafta', name: 'Hafta', days: 7, priceTiyin: 39_000 * S, description: '7 kun yuqorida va «Tavsiya» belgisi bilan' },
    { id: 'boost-premium', name: 'Premium', days: 14, priceTiyin: 69_000 * S, description: '14 kun yuqorida, bosh sahifadagi bannerda va pushda' },
  ]
}

export function makePriceDecisions(r: Rng, listings: Listing[]): PriceDecision[] {
  const withOffer = listings.filter((l) => l.offer && l.suggestion && !l.historical).slice(0, 40)
  return withOffer.map((l, i) => {
    const ai = l.suggestion!.suggestedTiyin
    const agree = r.chance(0.7)
    const moderator = agree ? ai : roundToStep(mulRate(ai, 1 + r.float(-0.06, 0.06)), 5_000_000)
    const d: PriceDecision = {
      id: `PD-${String(i + 1).padStart(3, '0')}`, listingId: l.id, at: l.offer!.at, askingTiyin: l.askingTiyin,
      aiSuggestedTiyin: ai, moderatorTiyin: moderator, confidence: l.suggestion!.confidence, byStaffId: l.offer!.byStaffId,
    }
    if (l.status !== 'offer_sent') d.sellerAccepted = l.status !== 'declined_by_seller'
    if (l.status === 'sold' && l.soldAt && l.publishedAt) d.soldInDays = Math.max(1, Math.round((new Date(l.soldAt).getTime() - new Date(l.publishedAt).getTime()) / 86_400_000))
    return d
  })
}

export function makeAuditLog(r: Rng, now: ISODate, staff: Staff[], listings: Listing[], payouts: Payout[], users: User[]): AuditEntry[] {
  resetAuditCounter(0)
  const actor = (id: string) => { const s = staff.find((x) => x.id === id)!; return { id: s.id, name: s.name, role: s.role } }
  const out: AuditEntry[] = []
  const offered = listings.filter((l) => l.offer && !l.historical).slice(0, 24)
  for (const l of offered) {
    const a = actor(l.offer!.byStaffId)
    out.push(makeAudit(a, 'status', 'listing', l.id, 'status', 'in_review', 'offer_sent', l.offer!.at, 'Narx taklifi yuborildi'))
    out.push(makeAudit(a, 'price', 'listing', l.id, 'priceTiyin', l.askingTiyin, l.offer!.offeredTiyin, l.offer!.at))
  }
  for (const l of listings.filter((x) => x.status === 'rejected_by_admin').slice(0, 4)) {
    out.push(makeAudit(actor('s-mod'), 'status', 'listing', l.id, 'status', 'in_review', 'rejected_by_admin', addHours(l.submittedAt!, 3), l.rejectReason))
  }
  for (const p of payouts.filter((x) => x.status === 'paid')) {
    out.push(makeAudit(actor('s-fin'), 'money', 'payout', p.id, 'status', 'scheduled', 'paid', p.paidAt!, `${p.sellerName}`))
  }
  const awaiting = payouts.find((p) => p.status === 'awaiting_second_approval')
  if (awaiting) out.push(makeAudit(actor('s-fin'), 'money', 'payout', awaiting.id, 'status', 'pending', 'awaiting_second_approval', awaiting.approvals[0]?.at ?? now, "50 mln so'mdan yuqori — ikkinchi tasdiq kerak"))
  const blocked = users.find((u) => u.blocked)
  if (blocked) out.push(makeAudit(actor('s-mod'), 'auth', 'user', blocked.id, 'blocked', null, blocked.blocked!.reason, blocked.blocked!.at))
  out.push(makeAudit(actor('s-fin'), 'fee', 'feeRuleSet', 'frs-2', 'status', null, 'draft', addDays(now, -2), 'v2 qoralama yaratildi'))
  out.push(makeAudit(actor('s-super'), 'auth', 'staff', 's-mod3', 'role', null, 'moderator', addDays(now, -15), "Yangi moderator qo'shildi"))
  out.push(makeAudit(actor('s-price'), 'data', 'category', 'kiyim', 'discountRate', 0.05, 0.08, addDays(now, -20)))
  out.push(makeAudit(actor('s-log'), 'status', 'manifest', `M-${dateKey(addDays(now, -1)).replace(/-/g, '')}`, 'status', 'closed', 'picked_up', addHours(addDays(now, -1), 3), 'BTS kuryeri oldi'))
  for (let i = 0; out.length < 60 && i < offered.length; i++) {
    const l = offered[i]
    out.push(makeAudit(actor('s-mod'), 'status', 'listing', l.id, 'status', 'ai_checked', 'in_review', addHours(l.submittedAt!, r.int(0, 2))))
  }
  return out.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
}

export function makeDailyStats(r: Rng, now: ISODate, orders: Order[], listings: Listing[], branches: BtsBranch[]): DailyStat[] {
  const branchRegion = new Map(branches.map((b) => [b.id, b.regionId]))
  const out: DailyStat[] = []
  for (let d = 29; d >= 0; d--) {
    const date = dateKey(addDays(now, -d))
    const dayOrders = orders.filter((o) => dateKey(o.createdAt) === date && o.status !== 'cancelled')
    let listingsSales = 0
    let mallSales = 0
    let commission = 0
    const byRegion: Partial<Record<RegionId, number>> = {}
    for (const o of dayOrders) {
      for (const s of o.subOrders) {
        if (s.sellerKey.startsWith('u:')) listingsSales += s.subtotalTiyin
        else mallSales += s.subtotalTiyin
        commission += s.feeTiyin
      }
      const region = (o.delivery.branchId && branchRegion.get(o.delivery.branchId)) || 'toshkent_sh'
      byRegion[region] = (byRegion[region] ?? 0) + o.itemsTiyin
    }
    // smooth demo curve: add synthetic background volume so charts are not spiky
    const bg = r.int(8, 22)
    const bgListing = bg * r.int(900_000, 2_400_000) * S
    const bgMall = bg * r.int(1_500_000, 4_000_000) * S
    const stat: DailyStat = {
      date,
      listingsSalesTiyin: listingsSales + bgListing,
      mallSalesTiyin: mallSales + bgMall,
      orders: dayOrders.length + bg,
      newListings: listings.filter((l) => dateKey(l.createdAt) === date && !l.historical).length + r.int(3, 12),
      commissionTiyin: commission + mulRate(bgListing, 0.03) + mulRate(bgMall, 0.08),
      avgReviewMinutes: r.int(14, 55),
      byRegion,
    }
    out.push(stat)
  }
  return out
}
