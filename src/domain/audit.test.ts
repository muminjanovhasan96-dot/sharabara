import { describe, it, expect, beforeEach } from 'vitest'
import { makeAudit, diffAudit, resetAuditCounter, nextAuditId, toAuditValue, AUDIT_KIND_UZ } from './audit'

const actor = { id: 's-mod', name: 'Kamola Nurmatova', role: 'moderator' as const }
const AT = '2026-09-27T14:32:00'

describe('audit', () => {
  beforeEach(() => resetAuditCounter())

  it('makeAudit builds an entry with sequential ids', () => {
    const e = makeAudit(actor, 'status', 'listing', 'L-58213', 'status', 'in_review', 'offer_sent', AT, 'Narx taklifi')
    expect(e).toEqual({
      id: 'A-00001', at: AT, actorId: 's-mod', actorName: 'Kamola Nurmatova', role: 'moderator', kind: 'status',
      entity: 'listing', entityId: 'L-58213', field: 'status', from: 'in_review', to: 'offer_sent', note: 'Narx taklifi',
    })
    const e2 = makeAudit(actor, 'price', 'listing', 'L-1', 'priceTiyin', 660_000_000, 620_000_000, AT)
    expect(e2.id).toBe('A-00002')
    expect(e2.note).toBeUndefined()
    expect(nextAuditId()).toBe('A-00003')
    resetAuditCounter(100)
    expect(nextAuditId()).toBe('A-00101')
  })

  it('toAuditValue normalises', () => {
    expect(toAuditValue(undefined)).toBeNull()
    expect(toAuditValue(null)).toBeNull()
    expect(toAuditValue(5)).toBe(5)
    expect(toAuditValue('x')).toBe('x')
    expect(toAuditValue(true)).toBe('true')
    expect(toAuditValue(false)).toBe('false')
    expect(toAuditValue({ a: 1 })).toBe('{"a":1}')
  })

  it('diffAudit emits one entry per changed field with inferred kinds', () => {
    const before = { status: 'in_review', priceTiyin: 660_000_000, title: 'a', feeTiyin: 1, customTiyin: 5, blocked: null, arr: [1] }
    const after = { status: 'offer_sent', priceTiyin: 620_000_000, title: 'a', feeTiyin: 1, customTiyin: 6, blocked: { at: AT }, arr: [1], extra: 'yes' }
    const entries = diffAudit(actor, 'listing', 'L-1', before, after, AT)
    expect(entries.map((e) => e.field)).toEqual(['blocked', 'customTiyin', 'extra', 'priceTiyin', 'status'])
    expect(entries.map((e) => e.kind)).toEqual(['auth', 'money', 'data', 'price', 'status'])
    expect(entries.find((e) => e.field === 'extra')).toMatchObject({ from: null, to: 'yes' })
    expect(entries.find((e) => e.field === 'blocked')?.to).toBe(JSON.stringify({ at: AT }))
  })

  it('diffAudit respects custom field kinds and notes; equal objects are skipped', () => {
    const entries = diffAudit(actor, 'order', 'O-1', { x: { a: 1 }, y: 1 }, { x: { a: 1 }, y: 2 }, AT, { y: 'fee' }, "Qo'lda")
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ field: 'y', kind: 'fee', note: "Qo'lda" })
    expect(diffAudit(actor, 'order', 'O-1', {}, {}, AT)).toEqual([])
    expect(Object.keys(AUDIT_KIND_UZ)).toHaveLength(6)
  })
})
