import { audit, emitLater, currentActor, mutate, now, pushNotification, genId, ApiError } from './core'
import { findSub } from './logistics'
import { subTransition } from './orders'
import type { FeeRule, FeeRuleSet, Tiyin } from '@/domain/types'
import { payoutMachine, needsSecondApproval } from '@/domain/machines'
import { formatMoney } from '@/domain/money'
import { nextFriday, dateKey } from '@/domain/clock'

export const finance = {
  // ─── Fee approvals ────────────────────────────────────────────────────
  async approveFee(approvalId: string) {
    return mutate((d) => {
      const a = d.feeApprovals.find((x) => x.id === approvalId)!
      a.status = 'approved'
      audit(d, currentActor('staff'), 'fee', 'subOrder', a.subOrderId, 'fee', a.autoFeeTiyin, a.finalFeeTiyin, 'Avtomatik haq tasdiqlandi')
      return a
    })
  },
  async adjustFee(approvalId: string, amountTiyin: Tiyin, reason: string) {
    if (!reason.trim()) throw new ApiError('reason_required', 'Sabab kiritish shart')
    return mutate((d) => {
      const a = d.feeApprovals.find((x) => x.id === approvalId)!
      const staff = currentActor('staff')
      a.finalFeeTiyin = amountTiyin; a.status = 'adjusted'
      a.override = { amountTiyin, reason, by: staff.id, at: now(), originalTiyin: a.autoFeeTiyin }
      const { so } = findSub(d, a.subOrderId)
      so.feeOverride = a.override
      audit(d, staff, 'fee', 'subOrder', a.subOrderId, 'fee', a.autoFeeTiyin, amountTiyin, reason)
      return a
    })
  },
  async approveFees(ids: string[]) { for (const id of ids) await finance.approveFee(id) },

  // ─── Payouts ──────────────────────────────────────────────────────────
  /** "Juma to'lovi": pending → scheduled (or awaiting second approval) → paid */
  async schedulePayout(payoutId: string) {
    return mutate((d) => {
      const p = d.payouts.find((x) => x.id === payoutId)!
      const to = needsSecondApproval(p.amountTiyin) ? 'awaiting_second_approval' : 'scheduled'
      payoutMachine.assert(p.status, to)
      p.status = to; p.scheduledFor = dateKey(nextFriday(now()))
      p.approvals.push({ by: currentActor('staff').id, at: now() })
      audit(d, currentActor('staff'), 'money', 'payout', p.id, 'status', 'pending', to)
      return p
    })
  },
  async secondApprove(payoutId: string) {
    return mutate((d) => {
      const p = d.payouts.find((x) => x.id === payoutId)!
      const staff = currentActor('staff')
      if (p.approvals.some((a) => a.by === staff.id)) throw new ApiError('same_approver', 'Ikkinchi tasdiq boshqa xodim tomonidan bo’lishi kerak')
      payoutMachine.assert(p.status, 'scheduled'); p.status = 'scheduled'
      p.approvals.push({ by: staff.id, at: now() })
      audit(d, staff, 'money', 'payout', p.id, 'status', 'awaiting_second_approval', 'scheduled', 'Qo’sh imzo')
      return p
    })
  },
  async payOut(payoutId: string) {
    return mutate((d) => {
      const p = d.payouts.find((x) => x.id === payoutId)!
      payoutMachine.assert(p.status, 'paid')
      p.status = 'paid'; p.paidAt = now()
      d.transactions.unshift({ id: genId('TX'), kind: 'payout', amountTiyin: p.amountTiyin, at: now(), refId: p.id, status: 'ok', note: `To'lov: ${p.sellerName} · ****${p.cardLast4}` })
      for (const id of p.subOrderIds) { try { const { o, so } = findSub(d, id); if (so.status === 'payout_scheduled') subTransition(d, o, so, 'payout_paid', 'staff') } catch { /* historical */ } }
      audit(d, currentActor('staff'), 'money', 'payout', p.id, 'status', 'scheduled', 'paid')
      if (p.sellerKey.startsWith('u:')) pushNotification(d, p.sellerKey.slice(2), 'payout', 'Pul hisobingizga o’tdi', `${formatMoney(p.amountTiyin)} · karta ****${p.cardLast4}`, '/m/wallet')
      emitLater('payout.paid', { payoutId: p.id, sellerKey: p.sellerKey })
      return p
    }, { latency: [600, 1100] })
  },
  /** Bulk friday payday: schedule all pending, pay all scheduled (that don't need second approval) */
  async payday() {
    const d0 = (await import('@/store')).useStore.getState().data
    for (const p of d0.payouts.filter((x) => x.status === 'pending')) await finance.schedulePayout(p.id)
    const d1 = (await import('@/store')).useStore.getState().data
    for (const p of d1.payouts.filter((x) => x.status === 'scheduled')) await finance.payOut(p.id)
  },

  // ─── Fee rule sets ────────────────────────────────────────────────────
  async saveDraftRules(rules: FeeRule[], note: string): Promise<FeeRuleSet> {
    return mutate((d) => {
      let draft = d.feeRuleSets.find((r) => r.status === 'draft')
      if (!draft) {
        draft = { id: genId('FRS'), version: Math.max(...d.feeRuleSets.map((r) => r.version)) + 1, status: 'draft', rules: [], createdBy: currentActor('staff').id, note }
        d.feeRuleSets.push(draft)
      }
      draft.rules = rules; draft.note = note
      audit(d, currentActor('staff'), 'fee', 'feeRuleSet', draft.id, 'rules', null, `v${draft.version} qoralama`)
      return draft
    })
  },
  async publishRules(id: string) {
    return mutate((d) => {
      const r = d.feeRuleSets.find((x) => x.id === id)!
      for (const other of d.feeRuleSets) if (other.status === 'published') other.status = 'archived'
      r.status = 'published'; r.publishedAt = now()
      audit(d, currentActor('staff'), 'fee', 'feeRuleSet', r.id, 'status', 'draft', 'published', `v${r.version}`)
      return r
    })
  },
}
