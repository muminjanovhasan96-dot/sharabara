import { audit, emitLater, currentActor, mutate, now, genId, ApiError } from './core'
import { subTransition } from './orders'
import type { Manifest, Order, SubOrder } from '@/domain/types'
import { manifestMachine } from '@/domain/machines'
import { dateKey } from '@/domain/clock'

function regionOf(d: { branches: { id: string; regionId: string }[] }, so: SubOrder): string {
  return d.branches.find((b) => b.id === so.branchId)?.regionId ?? 'toshkent_sh'
}

export function findSub(d: { orders: Order[] }, subOrderId: string): { o: Order; so: SubOrder } {
  for (const o of d.orders) { const so = o.subOrders.find((x) => x.id === subOrderId); if (so) return { o, so } }
  throw new ApiError('not_found', 'Yuk topilmadi')
}

export function openManifest(d: { manifests: Manifest[] }, date: string): Manifest {
  let m = d.manifests.find((x) => x.date === date && x.status === 'open')
  if (!m) { m = { id: `MF-${date.replace(/-/g, '').slice(4)}-${d.manifests.length + 1}`, date, status: 'open', subOrderIds: [], byRegion: {} }; d.manifests.unshift(m) }
  return m
}

export const logistics = {
  /** "Qadoqlandi": packing → packed, generates BTS waybill, joins today's open manifest */
  async pack(subOrderId: string) {
    return mutate((d) => {
      const { o, so } = findSub(d, subOrderId)
      const today = dateKey(now())
      so.waybill = so.waybill ?? `BTS-${today.slice(5).replace('-', '')}-${Math.floor(10000 + Math.random() * 89999)}`
      subTransition(d, o, so, 'packed', 'staff', `Yuk xati ${so.waybill}`)
      const m = openManifest(d, today)
      if (!m.subOrderIds.includes(so.id)) { m.subOrderIds.push(so.id); so.manifestId = m.id; const r = regionOf(d, so); m.byRegion[r] = (m.byRegion[r] ?? 0) + 1 }
      return so
    })
  },
  async packMany(ids: string[]) { for (const id of ids) await logistics.pack(id) },

  /** 17:00 — manifest closes; unpacked orders roll to tomorrow. */
  async closeManifest(manifestId?: string) {
    return mutate((d) => {
      const today = dateKey(now())
      const m = manifestId ? d.manifests.find((x) => x.id === manifestId)! : openManifest(d, today)
      manifestMachine.assert(m.status, 'closed')
      m.status = 'closed'; m.closedAt = now()
      audit(d, currentActor('staff'), 'status', 'manifest', m.id, 'status', 'open', 'closed', `${m.subOrderIds.length} ta yuk`)
      const unpacked = d.orders.flatMap((o) => o.subOrders).filter((so) => so.status === 'packing').length
      emitLater('manifest.closed', { manifestId: m.id })
      emitLater('admin.toast', { title: 'Kechki partiya yopildi', body: `${m.subOrderIds.length} ta yuk BTS’ga tayyor · ${unpacked} ta qadoqlanmagan ertaga o’tdi`, section: 'logistics', tone: unpacked ? 'brick' : 'success' })
      return m
    })
  },

  /** "Kechki partiyani BTS'ga topshirish" → every packed sub-order in manifest → handed_to_bts; manifest picked_up when BTS confirms */
  async handToBts(manifestId?: string) {
    return mutate((d) => {
      const m = manifestId ? d.manifests.find((x) => x.id === manifestId)! : d.manifests.find((x) => x.status === 'closed') ?? openManifest(d, dateKey(now()))
      if (m.status === 'open') { manifestMachine.assert('open', 'closed'); m.status = 'closed'; m.closedAt = now() }
      for (const id of m.subOrderIds) {
        const { o, so } = findSub(d, id)
        if (so.status === 'packed') subTransition(d, o, so, 'handed_to_bts', 'staff', `Manifest ${m.id}`)
      }
      return m
    })
  },

  // ─── BTS panel ────────────────────────────────────────────────────────
  /** BTS accepts the batch: manifest → picked_up, subs handed_to_bts → in_transit */
  async btsAcceptManifest(manifestId: string, waybills?: string[]) {
    return mutate((d) => {
      const m = d.manifests.find((x) => x.id === manifestId)!
      if (m.status === 'open') { m.status = 'closed'; m.closedAt = now() }
      const ids = m.subOrderIds.filter((id) => { if (!waybills) return true; const { so } = findSub(d, id); return so.waybill && waybills.includes(so.waybill) })
      for (const id of ids) {
        const { o, so } = findSub(d, id)
        if (so.status === 'packed') subTransition(d, o, so, 'handed_to_bts', 'bts', 'BTS qabul qildi')
        if (so.status === 'handed_to_bts') subTransition(d, o, so, 'in_transit', 'bts', 'Yo’lga chiqdi')
      }
      if (!waybills || ids.length === m.subOrderIds.length) {
        if (manifestMachine.can(m.status, 'picked_up')) { m.status = 'picked_up'; m.pickedUpAt = now(); audit(d, currentActor('bts'), 'status', 'manifest', m.id, 'status', 'closed', 'picked_up') }
        emitLater('manifest.picked_up', { manifestId: m.id })
      }
      return m
    })
  },
  async btsArrivedAtBranch(subOrderId: string) {
    return mutate((d) => { const { o, so } = findSub(d, subOrderId); subTransition(d, o, so, 'at_branch', 'bts'); return so })
  },
  async btsDelivered(subOrderId: string) {
    return mutate((d) => {
      const { o, so } = findSub(d, subOrderId)
      subTransition(d, o, so, 'delivered', 'bts')
      for (const i of so.items) { const l = d.listings.find((x) => x.id === i.refId); if (l && l.status === 'reserved') { l.status = 'sold'; l.soldAt = now(); audit(d, currentActor('bts'), 'status', 'listing', l.id, 'status', 'reserved', 'sold') } }
      // schedule payout
      subTransition(d, o, so, 'payout_scheduled', 'bts', 'Juma to’loviga rejalashtirildi')
      const sellerName = so.sellerName
      const amount = so.subtotalTiyin - (so.feeOverride?.amountTiyin ?? so.feeTiyin)
      const existing = d.payouts.find((p) => p.sellerKey === so.sellerKey && p.status === 'pending')
      if (existing) { existing.subOrderIds.push(so.id); existing.amountTiyin += amount }
      else d.payouts.unshift({ id: genId('PO'), sellerKey: so.sellerKey, sellerName, subOrderIds: [so.id], amountTiyin: amount, status: 'pending', approvals: [], cardLast4: String(1000 + Math.floor(Math.random() * 8999)) })
      return so
    })
  },
  async btsMarkProblem(subOrderId: string, note: string) {
    return mutate((d) => { const { so } = findSub(d, subOrderId); so.problem = note; audit(d, currentActor('bts'), 'data', 'subOrder', so.id, 'problem', null, note); return so })
  },
  async setBranch(subOrderId: string, branchId: string) {
    return mutate((d) => { const { so } = findSub(d, subOrderId); so.branchId = branchId; return so })
  },
}
