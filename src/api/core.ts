/**
 * Soxta backend qatlami. Har chaqiruv Promise qaytaradi (150–600 ms kechikish).
 * UI hech qachon store'ga to'g'ridan-to'g'ri yozmaydi — faqat api.* orqali.
 */
import { useStore } from '@/store'
import { current, isDraft } from 'immer'
import type { AuditEntry, AuditKind, DataSnapshot, ISODate, Role } from '@/domain/types'

let fast = false
/** Tests/e2e/golden-path can switch off the artificial latency. */
export function setFastMode(v: boolean) { fast = v }

export function delay(min = 150, max = 600): Promise<void> {
  if (fast) return Promise.resolve()
  const ms = min + Math.random() * (max - min)
  return new Promise((r) => setTimeout(r, ms))
}

export class ApiError extends Error {
  code: string
  constructor(code: string, message: string) { super(message); this.code = code; this.name = 'ApiError' }
}

// ─── Event bus ───────────────────────────────────────────────────────────
export type BusEvents = {
  'listing.submitted': { listingId: string }
  'listing.offer_sent': { listingId: string; sellerId: string }
  'listing.published': { listingId: string }
  'listing.status': { listingId: string; status: string }
  'order.created': { orderId: string; buyerId: string }
  'order.status': { orderId: string; subOrderId: string; status: string; buyerId: string }
  'manifest.closed': { manifestId: string }
  'manifest.picked_up': { manifestId: string }
  'payout.paid': { payoutId: string; sellerKey: string }
  'push': { userId: string; title: string; body: string; kind: string; link?: string }
  'admin.toast': { title: string; body?: string; section?: string; tone?: 'info' | 'success' | 'brick' }
  'clock': { now: ISODate; label: string }
  'reset': { seed: number }
}
type Handler<K extends keyof BusEvents> = (payload: BusEvents[K]) => void
const handlers = new Map<string, Set<Handler<never>>>()
export const bus = {
  on<K extends keyof BusEvents>(ev: K, fn: Handler<K>): () => void {
    if (!handlers.has(ev)) handlers.set(ev, new Set())
    handlers.get(ev)!.add(fn as Handler<never>)
    return () => { handlers.get(ev)?.delete(fn as Handler<never>) }
  },
  emit<K extends keyof BusEvents>(ev: K, payload: BusEvents[K]) {
    handlers.get(ev)?.forEach((fn) => { try { (fn as Handler<K>)(payload) } catch (e) { console.error(e) } })
  },
}

// ─── Actor / audit helpers ───────────────────────────────────────────────
export interface Actor { id: string; name: string; role: Role }

export function currentActor(kind: 'staff' | 'user' | 'company' | 'bts' = 'staff'): Actor {
  const s = useStore.getState()
  if (kind === 'user') {
    const u = s.data.users.find((x) => x.id === s.session.userId)
    return { id: u?.id ?? 'u-?', name: u?.name ?? 'Foydalanuvchi', role: s.session.role === 'seller' ? 'seller' : 'buyer' }
  }
  if (kind === 'company') {
    const c = s.data.companies.find((x) => x.id === s.session.companyId)
    return { id: c?.id ?? 'c-?', name: c?.name ?? 'Kompaniya', role: 'company' }
  }
  if (kind === 'bts') return { id: 'bts', name: 'BTS xodimi', role: 'bts' }
  const st = s.data.staff.find((x) => x.id === s.session.staffId) ?? s.data.staff[0]
  return { id: st.id, name: st.name, role: st.role }
}

export function now(): ISODate { return useStore.getState().clock.now }

let auditCounter = 0
export function audit(
  d: DataSnapshot, actor: Actor, kind: AuditKind, entity: string, entityId: string,
  field: string, from: string | number | null, to: string | number | null, note?: string,
) {
  auditCounter += 1
  const e: AuditEntry = {
    id: `A-${Date.now().toString(36)}-${auditCounter}`,
    at: now(), actorId: actor.id, actorName: actor.name, role: actor.role,
    kind, entity, entityId, field, from, to, note,
  }
  d.audit.unshift(e)
  if (d.audit.length > 2000) d.audit.length = 2000
}

/** Run a mutation against the snapshot with automatic latency. */
export async function mutate<T>(recipe: (d: DataSnapshot) => T, opts: { latency?: [number, number] } = {}): Promise<T> {
  await delay(...(opts.latency ?? [150, 600]))
  let out!: T
  useStore.getState().update((d) => { out = finalize(recipe(d)) })
  return out
}

/** Immer drafts are revoked after commit — return plain snapshots to callers. */
export function finalize<T>(v: T): T {
  if (isDraft(v)) return current(v as never) as T
  if (Array.isArray(v)) return v.map((x) => finalize(x)) as unknown as T
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) o[k] = finalize(val)
    return o as T
  }
  return v
}

/** Read-only query with latency (for lists → skeletons feel real). */
export async function query<T>(selector: (d: DataSnapshot) => T, latency: [number, number] = [150, 450]): Promise<T> {
  await delay(...latency)
  return selector(useStore.getState().data)
}

export function pushNotification(d: DataSnapshot, userId: string, kind: import('@/domain/types').NotificationKind, title: string, body: string, link?: string) {
  const id = `N-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  d.notifications.unshift({ id, userId, kind, title, body, at: now(), read: false, link })
  // deliver as a live push (stage phone + toasts subscribe)
  queueMicrotask(() => bus.emit('push', { userId, title, body, kind, link }))
}

export function genId(prefix: string) {
  return `${prefix}-${Math.floor(10000 + Math.random() * 89999)}`
}

/** Emit after the current mutation commits. Payload is evaluated eagerly (immer proxies are revoked later). */
export function emitLater<K extends keyof BusEvents>(ev: K, payload: BusEvents[K]) {
  queueMicrotask(() => bus.emit(ev, payload))
}
