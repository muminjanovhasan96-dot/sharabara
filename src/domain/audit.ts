/** Audit log helpers. Ids are deterministic-ish: `A-` + zero-padded counter. */
import type { AuditEntry, AuditKind, ISODate, Id, Role } from './types'

export interface Actor { id: Id; name: string; role: Role }

let counter = 0

/** Reset the id counter (tests / seed determinism). */
export function resetAuditCounter(start = 0): void {
  counter = start
}

export function nextAuditId(): Id {
  counter += 1
  return `A-${String(counter).padStart(5, '0')}`
}

export type AuditValue = string | number | null

export function toAuditValue(v: unknown): AuditValue {
  if (v === null || v === undefined) return null
  if (typeof v === 'number' || typeof v === 'string') return v
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return JSON.stringify(v)
}

export function makeAudit(
  actor: Actor,
  kind: AuditKind,
  entity: string,
  entityId: Id,
  field: string,
  from: unknown,
  to: unknown,
  at: ISODate,
  note?: string,
): AuditEntry {
  const entry: AuditEntry = {
    id: nextAuditId(),
    at,
    actorId: actor.id,
    actorName: actor.name,
    role: actor.role,
    kind,
    entity,
    entityId,
    field,
    from: toAuditValue(from),
    to: toAuditValue(to),
  }
  if (note) entry.note = note
  return entry
}

const DEFAULT_FIELD_KINDS: Record<string, AuditKind> = {
  status: 'status',
  priceTiyin: 'price',
  askingTiyin: 'price',
  offeredTiyin: 'price',
  feeTiyin: 'fee',
  amountTiyin: 'money',
  totalTiyin: 'money',
  blocked: 'auth',
  role: 'auth',
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a === 'object' && typeof b === 'object' && a && b) return JSON.stringify(a) === JSON.stringify(b)
  return false
}

/** One AuditEntry per changed top-level field. Field kind falls back to 'data'. */
export function diffAudit(
  actor: Actor,
  entity: string,
  entityId: Id,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  at: ISODate,
  fieldKinds: Record<string, AuditKind> = DEFAULT_FIELD_KINDS,
  note?: string,
): AuditEntry[] {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort()
  const out: AuditEntry[] = []
  for (const key of keys) {
    const a = before[key]
    const b = after[key]
    if (shallowEqual(a, b)) continue
    const kind = fieldKinds[key] ?? (key.endsWith('Tiyin') ? 'money' : 'data')
    out.push(makeAudit(actor, kind, entity, entityId, key, a, b, at, note))
  }
  return out
}

export const AUDIT_KIND_UZ: Record<AuditKind, string> = {
  status: 'Holat', money: 'Pul', price: 'Narx', fee: 'Komissiya', data: "Ma'lumot", auth: 'Kirish/huquq',
}
