/**
 * Deterministic demo snapshot. Same (seed, now) ⇒ deep-equal output.
 * Every date is derived from `now`.
 */
import type { DataSnapshot, ISODate } from '../domain/types'
import { rng } from './rng'
import { DEMO_NOW, GOLDEN } from './golden'
import { CATEGORIES, REGIONS, ROLE_MATRIX } from './static'
import { makeBranches, makeStaff, makeUsers } from './people'
import { makeListings } from './listings'
import { makeApiKeys, makeCompanies, makeProducts } from './mall'
import { makeCommerce, makeFeeRuleSets } from './commerce'
import { makeCampaigns, makeChats, makeEvents, makeNotifications, makeSavedSearches } from './social'
import { makeAuditLog, makeBoostPackages, makeDailyStats, makePriceDecisions } from './misc'
import { channelFor, makeWarehouse } from './warehouse'

export { MODEL_DICTIONARY } from '../domain/checks/models'
export { GOLDEN, DEMO_NOW } from './golden'
export { rng } from './rng'

export const DEFAULT_SEED = 2026

export function generateSnapshot(seed: number = DEFAULT_SEED, now: ISODate = DEMO_NOW): DataSnapshot {
  const root = rng(seed)
  const regions = REGIONS.map((x) => ({ ...x }))
  const categories = CATEGORIES.map((c) => ({ ...c, attributes: c.attributes.map((a) => ({ ...a, ...(a.options ? { options: [...a.options] } : {}) })), conditionNotes: { ...c.conditionNotes } }))
  const branches = makeBranches(root.fork('branches'))
  const users = makeUsers(root.fork('users'), now)
  const staff = makeStaff()
  const feeRuleSets = makeFeeRuleSets(now)
  const published = feeRuleSets.find((s) => s.status === 'published')!
  const { listings } = makeListings(root.fork('listings'), now, users, categories, published)
  const companies = makeCompanies(now)
  const products = makeProducts(root.fork('products'), now)
  const apiKeys = makeApiKeys(root.fork('apikeys'), now, companies)
  const commerce = makeCommerce(root.fork('commerce'), now, users, listings, products, companies, branches, published)
  for (const o of commerce.orders) o.channel = channelFor(o.id)
  const wh = makeWarehouse(root.fork('warehouse'), now, companies, products, commerce.orders)
  const events = makeEvents(root.fork('events'), now, users, listings, products)
  const savedSearches = makeSavedSearches(now)
  const chats = makeChats(root.fork('chats'), now, users, listings)
  const notifications = makeNotifications(now, commerce.orders, listings)
  const campaigns = makeCampaigns(now)
  const priceDecisions = makePriceDecisions(root.fork('decisions'), listings)
  const audit = makeAuditLog(root.fork('audit'), now, staff, listings, commerce.payouts, users)
  const boostPackages = makeBoostPackages()
  const dailyStats = makeDailyStats(root.fork('daily'), now, commerce.orders, listings, branches)

  return {
    seed,
    regions,
    branches,
    categories,
    users,
    staff,
    listings,
    companies,
    products,
    apiKeys,
    orders: commerce.orders,
    feeRuleSets,
    feeApprovals: commerce.feeApprovals,
    manifests: commerce.manifests,
    payouts: commerce.payouts,
    transactions: commerce.transactions,
    returns: commerce.returns,
    chats,
    notifications,
    events,
    savedSearches,
    campaigns,
    audit,
    priceDecisions,
    boostPackages,
    dailyStats,
    roleMatrix: { ...ROLE_MATRIX },
    warehouses: wh.warehouses,
    receipts: wh.receipts,
    movements: wh.movements,
    stockLevels: wh.stockLevels,
  }
}

/** Convenience: the golden listing from a snapshot. */
export function goldenListing(snapshot: DataSnapshot) {
  return snapshot.listings.find((l) => l.id === GOLDEN.listingId)!
}
