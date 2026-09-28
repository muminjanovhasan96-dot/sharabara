import { useMemo, useState } from 'react'
import { Ban, ShieldCheck } from 'lucide-react'
import { Avatar, Badge, Button, DataTable, EmptyState, Money, Skeleton, Switch, Tabs, TabsContent, TabsList, TabsTrigger, type Column } from '@/design'
import { useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import type { User } from '@/domain/types'
import { AdminConfirm, AdminDrawer, IdLink, KV, KVGrid, ListingStatusBadge, OrderStatusBadge, ReturnStatusBadge } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useQueryParam, useSectionLoading } from '../lib/hooks'
import { fmtTime, regionName, staffName } from '../lib/format'
import { A } from '../strings'

export function Users() {
  const data = useStore((s) => s.data)
  const access = useAccess('users')
  const loading = useSectionLoading()
  const [qid, setQid] = useQueryParam('id')
  const counts = useMemo(() => {
    const l = new Map<string, number>(); const o = new Map<string, number>()
    for (const x of data.listings) if (!x.historical) l.set(x.sellerId, (l.get(x.sellerId) ?? 0) + 1)
    for (const x of data.orders) o.set(x.buyerId, (o.get(x.buyerId) ?? 0) + 1)
    return { l, o }
  }, [data.listings, data.orders])
  const selected = qid ? data.users.find((u) => u.id === qid) : undefined
  const cols: Column<User>[] = [
    { key: 'name', header: A.users.name, sortable: true, render: (u) => <span className="flex items-center gap-2"><Avatar name={u.name} seed={u.id} size={28} /><span className="truncate font-medium">{u.name}</span></span> },
    { key: 'id', header: A.common.id, width: 100, defaultHidden: true, render: (u) => <span className="tnum text-ink-2">{u.id}</span> },
    { key: 'regionId', header: A.common.region, sortable: true, width: 150, render: (u) => regionName(data, u.regionId), csv: (u) => regionName(data, u.regionId), sortValue: (u) => regionName(data, u.regionId) },
    { key: 'rating', header: A.users.rating, sortable: true, align: 'right', width: 90, defaultHidden: true, render: (u) => <span className="tnum">{u.rating.toFixed(1)}</span> },
    { key: 'listings', header: A.users.listings, sortable: true, align: 'right', width: 90, sortValue: (u) => counts.l.get(u.id) ?? 0, render: (u) => <span className="tnum">{counts.l.get(u.id) ?? 0}</span>, csv: (u) => counts.l.get(u.id) ?? 0 },
    { key: 'orders', header: A.users.orders, sortable: true, align: 'right', width: 100, sortValue: (u) => counts.o.get(u.id) ?? 0, render: (u) => <span className="tnum">{counts.o.get(u.id) ?? 0}</span>, csv: (u) => counts.o.get(u.id) ?? 0 },
    { key: 'verifiedSeller', header: A.common.verified, sortable: true, width: 120, render: (u) => u.verifiedSeller ? <Badge tone="green" Icon={ShieldCheck}>{A.common.verified}</Badge> : <span className="text-ink-3">—</span>, csv: (u) => u.verifiedSeller ? 1 : 0 },
    { key: 'blocked', header: A.common.status, width: 140, sortable: true, sortValue: (u) => (u.blocked ? 1 : 0), render: (u) => u.blocked ? <Badge tone="brick" dot>{A.common.blocked}</Badge> : <Badge tone="green" dot>{A.common.active}</Badge>, csv: (u) => u.blocked ? 'blocked' : 'active' },
  ]
  if (loading) return <div className="p-5"><Skeleton height={480} className="rounded-card" /></div>
  return (
    <div className="flex flex-col gap-3 p-5">
      <DataTable columns={cols} rows={data.users} rowKey={(u) => u.id} onRowClick={(u) => setQid(u.id)} pageSize={15} exportFilename="foydalanuvchilar" defaultSort={{ key: 'name', dir: 'asc' }} emptyState={<EmptyState compact icon="users" title={A.common.empty} />} />
      <AdminDrawer open={!!selected} onOpenChange={(o) => !o && setQid(null)} width="lg" eyebrow={uz.admin.sections.users} title={selected?.name} actions={selected && (selected.blocked ? <Badge tone="brick" dot>{A.common.blocked}</Badge> : selected.verifiedSeller ? <Badge tone="green" Icon={ShieldCheck}>{A.common.verified}</Badge> : null)}>
        {selected && <UserDetail key={selected.id} u={selected} canEdit={access.edit} canApprove={access.approve} />}
      </AdminDrawer>
    </div>
  )
}

function UserDetail({ u, canEdit, canApprove }: { u: User; canEdit: boolean; canApprove: boolean }) {
  const data = useStore((s) => s.data)
  const { run, pending } = useAct()
  const [block, setBlock] = useState(false)
  const listings = data.listings.filter((l) => l.sellerId === u.id && !l.historical)
  const orders = data.orders.filter((o) => o.buyerId === u.id)
  const complaints = data.returns.filter((r) => r.buyerId === u.id)
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <Avatar name={u.name} seed={u.id} size={56} />
        <KVGrid cols={4} className="flex-1">
          <KV label={A.common.id}><span className="tnum">{u.id}</span></KV>
          <KV label={A.users.phone}><span className="tnum">{u.phoneMasked}</span></KV>
          <KV label={A.common.region}>{regionName(data, u.regionId)}</KV>
          <KV label={A.users.joined}>{fmtTime(u.joinedAt)}</KV>
          <KV label={A.users.rating}><span className="tnum">{u.rating.toFixed(1)}</span></KV>
          <KV label={A.users.sold}><span className="tnum">{u.soldCount}</span></KV>
          <KV label={A.users.language}>{u.language.toUpperCase()}</KV>
          <KV label={uz.profile.cash}>{u.cashOnDelivery ? uz.app.yes : uz.app.no}</KV>
        </KVGrid>
      </div>
      {u.blocked && <div className="rounded-card border border-brick/30 bg-brick-soft p-3 text-[13px]"><span className="font-medium text-brick">{A.common.blocked}</span> · {fmtTime(u.blocked.at)} · {staffName(data, u.blocked.by)}<div className="mt-0.5 text-ink-2">{u.blocked.reason}</div></div>}
      <div className="flex items-center justify-between gap-3 rounded-card border border-line p-3">
        <Switch label={A.users.verified} checked={u.verifiedSeller} disabled={!canEdit || pending === 'verify'} onCheckedChange={(v) => run('verify', () => api.admin.verifySeller(u.id, v), A.users.verifiedToast)} />
        {u.blocked ? <Button size="sm" variant="secondary" disabled={!canApprove} loading={pending === 'unblock'} onClick={() => run('unblock', () => api.admin.unblockUser(u.id), A.users.unblocked)}>{A.users.unblock}</Button>
          : <Button size="sm" variant="danger" leading={<Ban strokeWidth={1.75} />} disabled={!canApprove} onClick={() => setBlock(true)}>{A.users.block}</Button>}
      </div>
      <Tabs defaultValue="listings" size="sm">
        <TabsList><TabsTrigger value="listings" count={listings.length}>{A.users.listings}</TabsTrigger><TabsTrigger value="orders" count={orders.length}>{A.users.orders}</TabsTrigger><TabsTrigger value="complaints" count={complaints.length}>{A.users.complaints}</TabsTrigger></TabsList>
        <TabsContent value="listings" className="pt-3">
          {listings.length === 0 ? <EmptyState compact title={A.users.noListings} /> : <ul className="m-0 list-none divide-y divide-line p-0">{listings.slice(0, 20).map((l) => <li key={l.id} className="flex items-center gap-3 py-2 text-[13px]"><IdLink to={l.status === 'in_review' ? `/pricing?id=${l.id}` : `/moderation?id=${l.id}`}>{l.id}</IdLink><span className="min-w-0 flex-1 truncate">{l.title}</span><Money tiyin={l.priceTiyin} size="sm" /><ListingStatusBadge status={l.status} /></li>)}</ul>}
        </TabsContent>
        <TabsContent value="orders" className="pt-3">
          {orders.length === 0 ? <EmptyState compact title={A.users.noOrders} /> : <ul className="m-0 list-none divide-y divide-line p-0">{orders.slice(0, 20).map((o) => <li key={o.id} className="flex items-center gap-3 py-2 text-[13px]"><IdLink to={`/orders?id=${o.id}`}>{o.id}</IdLink><span className="text-ink-2">{fmtTime(o.createdAt)}</span><span className="min-w-0 flex-1 truncate">{o.subOrders.map((s) => s.items[0]?.title).join(', ')}</span><Money tiyin={o.totalTiyin} size="sm" /><OrderStatusBadge status={o.status} /></li>)}</ul>}
        </TabsContent>
        <TabsContent value="complaints" className="pt-3">
          {complaints.length === 0 ? <EmptyState compact title={A.users.noComplaints} /> : <ul className="m-0 list-none divide-y divide-line p-0">{complaints.map((r) => <li key={r.id} className="flex items-center gap-3 py-2 text-[13px]"><IdLink to={`/returns?id=${r.id}`}>{r.id}</IdLink><span className="min-w-0 flex-1 truncate">{r.reason}</span><ReturnStatusBadge status={r.status} /></li>)}</ul>}
        </TabsContent>
      </Tabs>
      <AdminConfirm open={block} onOpenChange={setBlock} title={A.users.block} description={u.name} tone="destructive" requireReason reasonPlaceholder={A.users.blockReason} confirmLabel={A.users.block}
        onConfirm={async (reason) => { setBlock(false); await run('block', () => api.admin.blockUser(u.id, reason ?? ''), A.users.blocked) }} />
    </div>
  )
}
