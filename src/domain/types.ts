/**
 * Sharabara domain types. Pure TypeScript, no UI imports.
 * Money is ALWAYS an integer number of tiyin (1 so'm = 100 tiyin).
 */

export type Tiyin = number // integer
export type ISODate = string // ISO-8601 string
export type Id = string

// ─── Roles ───────────────────────────────────────────────────────────────
export type StaffRole =
  | 'super_admin'
  | 'director'
  | 'moderator'
  | 'price_analyst'
  | 'logistics'
  | 'finance'
  | 'operator'
export type PartnerRole = 'company' | 'bts'
export type ClientRole = 'buyer' | 'seller'
export type Role = StaffRole | PartnerRole | ClientRole

export type AdminSection =
  | 'dashboard' | 'moderation' | 'pricing' | 'fees' | 'orders' | 'logistics'
  | 'payments' | 'returns' | 'companies' | 'products' | 'users' | 'categories'
  | 'campaigns' | 'reports' | 'roles' | 'audit' | 'warehouse' | 'director'
export type Permission = 'view' | 'edit' | 'approve'
export type RoleMatrix = Record<StaffRole, Partial<Record<AdminSection, Permission[]>>>

// ─── Geography ───────────────────────────────────────────────────────────
export type RegionId =
  | 'toshkent_sh' | 'toshkent_v' | 'andijon' | 'fargona' | 'namangan' | 'samarqand'
  | 'buxoro' | 'xorazm' | 'qashqadaryo' | 'surxondaryo' | 'jizzax' | 'sirdaryo'
  | 'navoiy' | 'qoraqalpogiston'
export interface Region { id: RegionId; name: string; lat: number; lng: number }

export interface BtsBranch {
  id: Id
  regionId: RegionId
  name: string
  address: string
  lat: number
  lng: number
  hours: string
  phoneMasked: string
}

// ─── Catalog ─────────────────────────────────────────────────────────────
export type Condition = 'A' | 'B' | 'C' | 'D'
export type AttributeType = 'select' | 'number' | 'text'
export interface AttributeDef {
  key: string
  label: string
  type: AttributeType
  options?: string[]
  unit?: string
  required?: boolean
}
export interface Category {
  id: Id
  parentId: Id | null
  name: string
  icon: string // lucide icon name
  attributes: AttributeDef[]
  /** Sharabara rule discount (0.05 = 5%) applied to computed market price */
  discountRate: number
  /** Max ratio of used price to new retail price (e.g. 0.85) */
  maxNewRatio: number
  conditionNotes: Record<Condition, string>
}

// ─── Users ───────────────────────────────────────────────────────────────
export interface User {
  id: Id
  name: string
  phoneMasked: string
  regionId: RegionId
  avatarSeed: number
  rating: number // 0..5
  soldCount: number
  joinedAt: ISODate
  verifiedSeller: boolean
  blocked: { at: ISODate; reason: string; by: Id } | null
  language: 'uz' | 'ru'
  notificationsEnabled: boolean
  cashOnDelivery: boolean
}

export interface Staff {
  id: Id
  name: string
  role: StaffRole
  avatarSeed: number
}

// ─── Listings (C2C) ──────────────────────────────────────────────────────
export type ListingStatus =
  | 'draft' | 'submitted' | 'ai_checked' | 'in_review' | 'offer_sent' | 'accepted'
  | 'published' | 'reserved' | 'sold'
  | 'returned_for_edit' | 'rejected_by_admin' | 'declined_by_seller' | 'expired' | 'removed'

export interface RecognizedSpecs {
  brand?: string
  model?: string
  storage?: string
  color?: string
  condition: Condition
  conditionNote: string
  imeiStatus?: 'clean' | 'suspicious' | 'not_provided'
  imagesOriginal: boolean
  confidence: number // 0..1 of recognition
}

export interface PriceBreakdownRow { label: string; amountTiyin: Tiyin; kind: 'base' | 'adjust' | 'total' }
export interface Comparable {
  listingId: Id
  title: string
  condition: Condition
  regionId: RegionId
  priceTiyin: Tiyin
  outcome: 'sold' | 'active' | 'stale'
  daysToSell?: number
  daysListed: number
  weight: number
}
export type PriceFlag = 'overpriced' | 'fair' | 'low_data' | 'imei_issue' | 'images_suspicious'
export interface PriceSuggestion {
  suggestedTiyin: Tiyin
  confidence: number // 0..1
  breakdown: PriceBreakdownRow[]
  comparables: Comparable[]
  flags: PriceFlag[]
  marketMedianTiyin: Tiyin
  newRetailTiyin: Tiyin | null
  computedAt: ISODate
}

export interface PriceOffer {
  offeredTiyin: Tiyin
  feeTiyin: Tiyin
  sellerGetsTiyin: Tiyin
  note: string
  byStaffId: Id
  at: ISODate
  aiSuggestedTiyin: Tiyin
}

export interface ListingStats { views: number; saves: number; chats: number; viewsByDay: number[] }

export interface Listing {
  id: Id
  sellerId: Id
  categoryId: Id
  title: string
  description: string
  images: string[] // illustration ids or data URLs
  attributes: Record<string, string | number>
  imei?: string
  regionId: RegionId
  district?: string
  condition: Condition
  askingTiyin: Tiyin
  priceTiyin: Tiyin // current/published price
  previousPriceTiyin?: Tiyin // for "Narx tushdi"
  status: ListingStatus
  specs?: RecognizedSpecs
  suggestion?: PriceSuggestion
  offer?: PriceOffer
  rejectReason?: string
  editRequestReason?: string
  priceVerified: boolean
  createdAt: ISODate
  submittedAt?: ISODate
  publishedAt?: ISODate
  soldAt?: ISODate
  stats: ListingStats
  boosted?: { until: ISODate; packageId: string }
  /** historical/comparable-only rows are not shown in feed */
  historical?: boolean
}

// ─── Mall (B2C) ──────────────────────────────────────────────────────────
export type CompanyModel = 'wholesale' | 'warehouse' | 'self_ship'
export type CompanyStatus = 'active' | 'onboarding' | 'suspended'
export interface Company {
  id: Id
  name: string
  inn: string
  model: CompanyModel
  status: CompanyStatus
  commissionRate: number // 0.08 = 8%
  rating: number
  lateShipments: number
  returnsRate: number
  joinedAt: ISODate
  contractFile?: string
  shipSpeedDays: number
  description: string
  sealIcon: string
}
export type ProductCheck = 'passed' | 'overpriced' | 'pending'
export interface Product {
  id: Id
  companyId: Id
  sku: string
  categoryId: Id
  title: string
  description: string
  images: string[]
  priceTiyin: Tiyin
  previousPriceTiyin?: Tiyin
  marketMedianTiyin: Tiyin
  stock: number
  warrantyMonths: number
  returnDays: number
  check: ProductCheck
  checkDelta: number // -0.09 = 9% cheaper than market
  attributes: Record<string, string | number>
  stats: ListingStats
  createdAt: ISODate
  promo?: { label: string; until: ISODate }
}
export interface ApiKey { id: Id; companyId: Id; label: string; prefix: string; createdAt: ISODate; lastUsedAt?: ISODate; revoked: boolean }

// ─── Cart / Orders ───────────────────────────────────────────────────────
export type ItemSource = 'listing' | 'product'
export interface CartItem {
  key: string
  source: ItemSource
  refId: Id
  sellerKey: string // `u:${userId}` or `c:${companyId}`
  qty: number
  priceTiyin: Tiyin
  title: string
  image: string
}
export type DeliveryMethod = 'bts_branch' | 'courier_tashkent' | 'pickup'
export type PaymentMethod = 'payme' | 'click' | 'cash'
export type OrderStatus = 'created' | 'paid' | 'cancelled' | 'completed'
export type EscrowStatus = 'none' | 'held' | 'released' | 'refunded' | 'partially_refunded'
export type SubOrderStatus =
  | 'packing' | 'packed' | 'handed_to_bts' | 'in_transit' | 'at_branch' | 'delivered'
  | 'payout_scheduled' | 'payout_paid'
  | 'cancelled' | 'return_requested' | 'return_approved' | 'return_denied' | 'refunded'

export interface StatusEvent<S extends string = string> { status: S; at: ISODate; by: Id; role: Role; note?: string }

export interface SubOrder {
  id: Id
  orderId: Id
  sellerKey: string
  sellerName: string
  items: CartItem[]
  subtotalTiyin: Tiyin
  feeTiyin: Tiyin // platform fee/commission on this sub-order
  feeOverride?: FeeOverride
  status: SubOrderStatus
  timeline: StatusEvent<SubOrderStatus>[]
  waybill?: string // BTS waybill no
  manifestId?: Id
  branchId?: Id
  problem?: string
}

/** Savdo kanali: ilova, Telegram, Instagram yoki oflayn (do'kon/telefon) */
export type SalesChannel = 'app' | 'telegram' | 'instagram' | 'offline'

export interface Order {
  id: Id
  buyerId: Id
  createdAt: ISODate
  status: OrderStatus
  channel: SalesChannel
  payment: { method: PaymentMethod; txId?: string; paidAt?: ISODate; escrow: EscrowStatus }
  delivery: { method: DeliveryMethod; branchId?: Id; address?: string; feeTiyin: Tiyin }
  subOrders: SubOrder[]
  itemsTiyin: Tiyin
  totalTiyin: Tiyin
  rating?: { stars: number; comment: string; at: ISODate }
}

// ─── Fees ────────────────────────────────────────────────────────────────
export type FeeRuleType = 'fixed' | 'percent' | 'percent_capped'
export interface FeeRule {
  id: Id
  minTiyin: Tiyin // inclusive
  maxTiyin: Tiyin | null // exclusive; null = infinity
  type: FeeRuleType
  fixedTiyin?: Tiyin
  rate?: number
  capTiyin?: Tiyin
  categoryId?: Id | null // null/undefined = default rule
}
export interface FeeRuleSet {
  id: Id
  version: number
  status: 'draft' | 'published' | 'archived'
  rules: FeeRule[]
  publishedAt?: ISODate
  createdBy: Id
  note: string
}
export interface FeeOverride { amountTiyin: Tiyin; reason: string; by: Id; at: ISODate; originalTiyin: Tiyin }
export interface FeeResult { feeTiyin: Tiyin; ruleId: Id; sellerGetsTiyin: Tiyin; rate?: number }
export interface FeeApproval {
  id: Id
  subOrderId: Id
  orderId: Id
  sellerKey: string
  priceTiyin: Tiyin
  autoFeeTiyin: Tiyin
  finalFeeTiyin: Tiyin
  status: 'pending' | 'approved' | 'adjusted'
  override?: FeeOverride
  createdAt: ISODate
}

// ─── Shipments / BTS ─────────────────────────────────────────────────────
export type ManifestStatus = 'open' | 'closed' | 'picked_up'
export interface Manifest {
  id: Id
  date: string // YYYY-MM-DD demo date
  status: ManifestStatus
  subOrderIds: Id[]
  closedAt?: ISODate
  pickedUpAt?: ISODate
  byRegion: Record<string, number>
}

// ─── Payouts ─────────────────────────────────────────────────────────────
export type PayoutStatus = 'pending' | 'scheduled' | 'awaiting_second_approval' | 'paid'
export interface Payout {
  id: Id
  sellerKey: string
  sellerName: string
  subOrderIds: Id[]
  amountTiyin: Tiyin
  status: PayoutStatus
  scheduledFor?: string
  paidAt?: ISODate
  approvals: { by: Id; at: ISODate }[]
  cardLast4: string
}
export interface Transaction {
  id: Id
  kind: 'payment_in' | 'payout' | 'refund' | 'boost' | 'commission'
  provider?: PaymentMethod
  amountTiyin: Tiyin
  at: ISODate
  refId: Id
  status: 'ok' | 'pending' | 'failed'
  note: string
}

// ─── Returns / disputes ──────────────────────────────────────────────────
export type ReturnStatus = 'requested' | 'approved_full' | 'approved_partial' | 'denied' | 'refunded'
export interface ReturnRequest {
  id: Id
  orderId: Id
  subOrderId: Id
  buyerId: Id
  reason: string
  description: string
  images: string[]
  sellerReply?: string
  status: ReturnStatus
  decision?: { kind: 'full' | 'partial' | 'deny'; amountTiyin: Tiyin; note: string; by: Id; at: ISODate }
  createdAt: ISODate
  slaHours: number
}

// ─── Chat ────────────────────────────────────────────────────────────────
export interface ChatMessage { id: Id; from: Id; text: string; at: ISODate; read: boolean }
export interface ChatThread { id: Id; listingId: Id; buyerId: Id; sellerId: Id; messages: ChatMessage[]; updatedAt: ISODate }

// ─── Notifications ───────────────────────────────────────────────────────
export type NotificationKind =
  | 'price_drop' | 'saved_search' | 'order_status' | 'price_offer' | 'payment' | 'campaign' | 'chat' | 'listing_status' | 'payout' | 'rate_request'
export interface AppNotification {
  id: Id
  userId: Id
  kind: NotificationKind
  title: string
  body: string
  at: ISODate
  read: boolean
  link?: string
}

// ─── Recommendations ─────────────────────────────────────────────────────
export type UserEventKind = 'view' | 'view_long' | 'search' | 'save' | 'chat' | 'cart' | 'purchase'
export interface UserEvent {
  userId: Id
  kind: UserEventKind
  at: ISODate
  itemId?: Id
  source?: ItemSource
  categoryId?: Id
  model?: string
  priceTiyin?: Tiyin
  regionId?: RegionId
  query?: string
}
export interface SavedSearch { id: Id; userId: Id; query: string; categoryId?: Id; maxPriceTiyin?: Tiyin; createdAt: ISODate; lastMatchAt?: ISODate }
export interface FeedItem {
  source: ItemSource
  id: Id
  score: number
  bucket: 'personal' | 'fresh' | 'mall'
  reason?: string
}

// ─── Campaigns ───────────────────────────────────────────────────────────
export interface Campaign {
  id: Id
  title: string
  body: string
  segment: { regionIds: RegionId[]; categoryIds: Id[] }
  kind: 'push' | 'banner'
  status: 'draft' | 'sent'
  sentAt?: ISODate
  reach?: number
  createdAt: ISODate
}

// ─── Audit ───────────────────────────────────────────────────────────────
export type AuditKind = 'status' | 'money' | 'price' | 'fee' | 'data' | 'auth'
export interface AuditEntry {
  id: Id
  at: ISODate
  actorId: Id
  actorName: string
  role: Role
  kind: AuditKind
  entity: string // 'listing' | 'order' | ...
  entityId: Id
  field: string
  from: string | number | null
  to: string | number | null
  note?: string
}

// ─── Price decision history (AI learning log) ────────────────────────────
export interface PriceDecision {
  id: Id
  listingId: Id
  at: ISODate
  askingTiyin: Tiyin
  aiSuggestedTiyin: Tiyin
  moderatorTiyin: Tiyin
  confidence: number
  byStaffId: Id
  sellerAccepted?: boolean
  soldInDays?: number
}

// ─── Boost packages ──────────────────────────────────────────────────────
export interface BoostPackage { id: string; name: string; days: number; priceTiyin: Tiyin; description: string }

// ─── Warehouse (Ombor) ───────────────────────────────────────────────────
export interface Warehouse { id: Id; name: string; regionId: RegionId; address: string; capacity: number }
export type ReceiptStatus = 'expected' | 'received' | 'checked'
export interface StockReceiptLine { productId: Id; qty: number; unitCostTiyin: Tiyin; acceptedQty?: number; note?: string }
/** Kompaniyadan omborga kirim (yuk xati) */
export interface StockReceipt {
  id: Id
  companyId: Id
  warehouseId: Id
  status: ReceiptStatus
  lines: StockReceiptLine[]
  totalTiyin: Tiyin
  expectedAt: ISODate
  receivedAt?: ISODate
  checkedBy?: Id
  invoiceNo: string
  note?: string
}
export type MovementKind = 'in' | 'out' | 'adjust' | 'return' | 'transfer'
/** Har bir zaxira o'zgarishi voqea sifatida saqlanadi */
export interface StockMovement {
  id: Id
  at: ISODate
  productId: Id
  warehouseId: Id
  kind: MovementKind
  qty: number // +/-
  refId?: Id // receipt / order / return id
  channel?: SalesChannel
  by: Id
  note?: string
}
export interface StockLevel { productId: Id; warehouseId: Id; qty: number; reserved: number; minQty: number }

// ─── Daily history for charts ────────────────────────────────────────────
export interface DailyStat {
  date: string
  listingsSalesTiyin: Tiyin
  mallSalesTiyin: Tiyin
  orders: number
  newListings: number
  commissionTiyin: Tiyin
  avgReviewMinutes: number
  byRegion: Partial<Record<RegionId, Tiyin>>
}

// ─── Root snapshot (what seed produces / what store holds) ───────────────
export interface DataSnapshot {
  seed: number
  regions: Region[]
  branches: BtsBranch[]
  categories: Category[]
  users: User[]
  staff: Staff[]
  listings: Listing[]
  companies: Company[]
  products: Product[]
  apiKeys: ApiKey[]
  orders: Order[]
  feeRuleSets: FeeRuleSet[]
  feeApprovals: FeeApproval[]
  manifests: Manifest[]
  payouts: Payout[]
  transactions: Transaction[]
  returns: ReturnRequest[]
  chats: ChatThread[]
  notifications: AppNotification[]
  events: UserEvent[]
  savedSearches: SavedSearch[]
  campaigns: Campaign[]
  audit: AuditEntry[]
  priceDecisions: PriceDecision[]
  boostPackages: BoostPackage[]
  dailyStats: DailyStat[]
  roleMatrix: RoleMatrix
  warehouses: Warehouse[]
  receipts: StockReceipt[]
  movements: StockMovement[]
  stockLevels: StockLevel[]
}
