/** Fixed ids and numbers of the golden demo path. */
export const DEMO_NOW = '2026-09-27T14:32:00'

export const GOLDEN = {
  listingId: 'L-58213',
  buyerId: 'u-buyer',
  sellerId: 'u-seller',
  branchId: 'br-namangan-markaz',
  /** 6 200 000 so'm */
  suggested: 620_000_000,
  /** market median normalised to condition A: 6 900 000 so'm */
  marketMedian: 690_000_000,
  /** B holat: 6 900 000 × 0,95 − 6 900 000 = −345 000 so'm */
  conditionAdjust: -34_500_000,
  /** aynan −5%: 6 555 000 × 0,05 = −327 750 so'm */
  ruleAdjust: -32_775_000,
  /** 6 227 250 → 6 200 000 (50 000 so'mgacha pastga) */
  roundingAdjust: -2_725_000,
  /** 3% of 6 200 000 */
  fee: 18_600_000,
  sellerGets: 601_400_000,
  /** delivery fee 35 000 so'm */
  deliveryFee: 3_500_000,
  total: 623_500_000,
  asking: 660_000_000,
  newRetail: 950_000_000,
} as const
