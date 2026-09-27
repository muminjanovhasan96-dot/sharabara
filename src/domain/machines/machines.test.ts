import { describe, it, expect } from 'vitest'
import {
  createMachine, TransitionError, listingMachine, orderMachine, subOrderMachine, manifestMachine, payoutMachine,
  returnMachine, needsSecondApproval, firstPayoutStep, SUB_ORDER_HAPPY_PATH, LISTING_STATUS_UZ, SUB_ORDER_STATUS_UZ,
  ORDER_STATUS_UZ, MANIFEST_STATUS_UZ, PAYOUT_STATUS_UZ, RETURN_STATUS_UZ,
} from './index'

function walk<S extends string>(m: { assert(a: S, b: S): void }, path: S[]) {
  for (let i = 1; i < path.length; i++) m.assert(path[i - 1], path[i])
}

describe('createMachine', () => {
  const m = createMachine<'a' | 'b' | 'c'>('demo', { a: ['b'], b: ['c'], c: [] })
  it('basic API', () => {
    expect(m.name).toBe('demo')
    expect(m.states).toEqual(['a', 'b', 'c'])
    expect(m.can('a', 'b')).toBe(true)
    expect(m.can('a', 'c')).toBe(false)
    expect(m.can('a', 'a')).toBe(false)
    expect(m.next('a')).toEqual(['b'])
    expect(m.next('c')).toEqual([])
    expect(m.isTerminal('c')).toBe(true)
    expect(m.isTerminal('a')).toBe(false)
    expect(() => m.assert('a', 'b')).not.toThrow()
  })
  it('assert throws Uzbek TransitionError', () => {
    try {
      m.assert('a', 'c')
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(TransitionError)
      const te = e as TransitionError
      expect(te.message).toBe("Noto'g'ri o'tish: a → c (demo)")
      expect(te.from).toBe('a'); expect(te.to).toBe('c'); expect(te.machine).toBe('demo'); expect(te.name).toBe('TransitionError')
    }
  })
  it('unknown state is handled gracefully', () => {
    // @ts-expect-error runtime robustness
    expect(m.next('zzz')).toEqual([])
    // @ts-expect-error runtime robustness
    expect(m.can('zzz', 'a')).toBe(false)
  })
})

describe('listingMachine', () => {
  it('golden path', () => {
    walk(listingMachine, ['draft', 'submitted', 'ai_checked', 'in_review', 'offer_sent', 'accepted', 'published', 'reserved', 'sold'])
  })
  it('side paths', () => {
    walk(listingMachine, ['in_review', 'returned_for_edit', 'submitted'])
    walk(listingMachine, ['offer_sent', 'declined_by_seller', 'submitted'])
    walk(listingMachine, ['published', 'expired', 'published', 'removed'])
    walk(listingMachine, ['reserved', 'published', 'sold'])
    expect(listingMachine.can('in_review', 'rejected_by_admin')).toBe(true)
  })
  it('invalid paths', () => {
    expect(listingMachine.can('in_review', 'in_review')).toBe(false)
    expect(listingMachine.can('draft', 'published')).toBe(false)
    expect(listingMachine.can('sold', 'published')).toBe(false)
    expect(listingMachine.can('rejected_by_admin', 'submitted')).toBe(false)
    expect(() => listingMachine.assert('draft', 'published')).toThrow("Noto'g'ri o'tish: draft → published (listing)")
    expect(listingMachine.isTerminal('sold')).toBe(true)
    expect(listingMachine.isTerminal('removed')).toBe(true)
  })
  it('labels cover every state', () => {
    for (const s of listingMachine.states) expect(LISTING_STATUS_UZ[s]).toBeTruthy()
  })
})

describe('orderMachine / subOrderMachine', () => {
  it('order', () => {
    walk(orderMachine, ['created', 'paid', 'completed'])
    walk(orderMachine, ['created', 'cancelled'])
    walk(orderMachine, ['paid', 'cancelled'])
    expect(orderMachine.can('completed', 'paid')).toBe(false)
    expect(() => orderMachine.assert('created', 'completed')).toThrow(TransitionError)
    for (const s of orderMachine.states) expect(ORDER_STATUS_UZ[s]).toBeTruthy()
  })
  it('sub-order happy path and returns', () => {
    walk(subOrderMachine, SUB_ORDER_HAPPY_PATH)
    walk(subOrderMachine, ['delivered', 'return_requested', 'return_approved', 'refunded'])
    walk(subOrderMachine, ['delivered', 'return_requested', 'return_denied', 'payout_scheduled', 'payout_paid'])
    walk(subOrderMachine, ['packing', 'cancelled'])
    walk(subOrderMachine, ['packed', 'cancelled'])
    expect(subOrderMachine.can('handed_to_bts', 'cancelled')).toBe(false)
    expect(subOrderMachine.can('in_transit', 'delivered')).toBe(false)
    expect(subOrderMachine.can('payout_paid', 'return_requested')).toBe(false)
    expect(() => subOrderMachine.assert('packing', 'delivered')).toThrow(/sub_order/)
    for (const s of subOrderMachine.states) expect(SUB_ORDER_STATUS_UZ[s]).toBeTruthy()
  })
})

describe('manifestMachine', () => {
  it('open → closed → picked_up only', () => {
    walk(manifestMachine, ['open', 'closed', 'picked_up'])
    expect(manifestMachine.can('open', 'picked_up')).toBe(false)
    expect(manifestMachine.can('closed', 'open')).toBe(false)
    expect(manifestMachine.isTerminal('picked_up')).toBe(true)
    for (const s of manifestMachine.states) expect(MANIFEST_STATUS_UZ[s]).toBeTruthy()
  })
})

describe('payoutMachine', () => {
  it('paths', () => {
    walk(payoutMachine, ['pending', 'scheduled', 'paid'])
    walk(payoutMachine, ['pending', 'awaiting_second_approval', 'scheduled', 'paid'])
    expect(payoutMachine.can('awaiting_second_approval', 'paid')).toBe(false)
    expect(payoutMachine.can('paid', 'pending')).toBe(false)
    for (const s of payoutMachine.states) expect(PAYOUT_STATUS_UZ[s]).toBeTruthy()
  })
  it('needsSecondApproval > 50 mln so\'m', () => {
    expect(needsSecondApproval(5_000_000_000)).toBe(false)
    expect(needsSecondApproval(5_000_000_001)).toBe(true)
    expect(firstPayoutStep(100)).toBe('scheduled')
    expect(firstPayoutStep(6_000_000_000)).toBe('awaiting_second_approval')
  })
})

describe('returnMachine', () => {
  it('paths', () => {
    walk(returnMachine, ['requested', 'approved_full', 'refunded'])
    walk(returnMachine, ['requested', 'approved_partial', 'refunded'])
    walk(returnMachine, ['requested', 'denied'])
    expect(returnMachine.can('denied', 'refunded')).toBe(false)
    expect(returnMachine.can('requested', 'refunded')).toBe(false)
    expect(() => returnMachine.assert('refunded', 'requested')).toThrow(TransitionError)
    for (const s of returnMachine.states) expect(RETURN_STATUS_UZ[s]).toBeTruthy()
  })
})
