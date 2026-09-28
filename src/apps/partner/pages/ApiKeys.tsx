import { useMemo, useState } from 'react'
import { Check, Copy, KeyRound, Plus, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, Modal, Skeleton } from '@/design'
import { toast } from '../toast'
import { api } from '@/api'
import { useData } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import { useCompany, useListLoading } from '../hooks'
import { P } from '../strings'
import { CodeBlock, PageHeader } from '../ui'

const DOCS = [
  { title: 'PUT /v1/stock', body: `PUT https://api.sharabara.uz/v1/stock
Authorization: Bearer sb_live_…

{ "items": [
  { "sku": "NAM-1001", "stock": 24 },
  { "sku": "NAM-1002", "stock": 0 }
] }

→ 200 { "updated": 2, "unknownSku": [] }` },
  { title: 'PUT /v1/prices', body: `PUT https://api.sharabara.uz/v1/prices
Authorization: Bearer sb_live_…

{ "items": [
  { "sku": "NAM-1001", "price": 4290000 }
] }

→ 200 { "updated": 1,
        "checks": [ { "sku": "NAM-1001", "check": "passed", "delta": -0.06 } ] }` },
  { title: 'GET /v1/orders?status=packing', body: `GET https://api.sharabara.uz/v1/orders?status=packing&since=2026-09-01
Authorization: Bearer sb_live_…

→ 200 { "orders": [
  { "id": "O-4183", "subOrderId": "SO-4183-1", "status": "packing",
    "items": [ { "sku": "NAM-1007", "qty": 1, "price": 3150000 } ],
    "branchId": "br-namangan-markaz", "createdAt": "2026-09-24T09:05:00" }
] }` },
]
const WEBHOOK = `POST https://sizning-tizim.uz/sharabara/webhook
X-Sharabara-Signature: sha256=…

{ "event": "order.status",
  "orderId": "O-4183", "subOrderId": "SO-4183-1",
  "status": "at_branch", "waybill": "BTS-2409-52310",
  "at": "2026-09-25T10:12:00" }`

export function ApiKeys() {
  const c = useCompany()
  const all = useData((d) => d.apiKeys)
  const keys = useMemo(() => all.filter((k) => k.companyId === c.id), [all, c.id])
  const loading = useListLoading(c.id)
  const [create, setCreate] = useState(false)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokeId, setRevokeId] = useState<string | null>(null)

  const doCreate = async () => {
    if (!label.trim()) return
    setBusy(true)
    try { const r = await api.partner.createApiKey(label.trim()); setCreate(false); setLabel(''); setSecret(r.secret); setCopied(false); toast.success(P.api.createdToast, { description: r.key.prefix }) }
    catch { toast.error(P.common.error) } finally { setBusy(false) }
  }
  const copy = async () => { if (!secret) return; try { await navigator.clipboard.writeText(secret) } catch { /* clipboard blocked */ } setCopied(true); toast.info(P.api.copied) }
  const doRevoke = async () => { if (!revokeId) return; setBusy(true); try { await api.partner.revokeApiKey(revokeId); toast.success(P.api.revokedToast) } catch { toast.error(P.common.error) } finally { setBusy(false); setRevokeId(null) } }

  return (
    <div>
      <PageHeader eyebrow={c.name} help={P.help.api} title={P.api.title} actions={<Button variant="gold" leading={<Plus />} onClick={() => setCreate(true)}>{P.api.newKey}</Button>}>{P.api.lead}</PageHeader>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card padding="none" className="self-start overflow-hidden">
          {loading ? <div className="flex flex-col gap-3 p-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height={56} />)}</div> : keys.length === 0 ? <EmptyState icon="key-round" title={P.api.empty} hint={P.api.emptyHint} /> : (
            <ul className="m-0 list-none divide-y divide-line p-0">
              {keys.map((k) => (
                <li key={k.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-soft text-blue"><KeyRound size={18} strokeWidth={1.75} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className={k.revoked ? 'text-ink-3 line-through' : 'font-medium text-ink'}>{k.label}</span>{k.revoked ? <Badge tone="neutral" size="sm">{P.api.revoked}</Badge> : <Badge tone="green" size="sm" dot>{P.api.active}</Badge>}</div>
                    <div className="mt-0.5 font-mono text-[12px] text-ink-2">{k.prefix}…</div>
                    <div className="text-[12px] text-ink-3">{P.api.created}: {formatDemoTime(k.createdAt)} · {P.api.lastUsed}: {k.lastUsedAt ? formatDemoTime(k.lastUsedAt) : P.api.never}</div>
                  </div>
                  {!k.revoked && <Button variant="ghost" size="sm" className="text-brick" onClick={() => setRevokeId(k.id)}>{P.api.revoke}</Button>}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="flex flex-col gap-4">
          <Card padding="md"><CardHeader title={P.api.docs} eyebrow="REST · JSON" /><p className="m-0 mb-3 text-[13.5px] text-ink-2">{P.api.docsLead}</p><div className="flex flex-col gap-3">{DOCS.map((d) => <CodeBlock key={d.title} title={d.title} code={d.body} />)}</div></Card>
          <Card padding="md"><CardHeader title={P.api.webhook} eyebrow="order.status" /><p className="m-0 mb-3 text-[13.5px] text-ink-2">{P.api.webhookLead}</p><CodeBlock title="Webhook · POST" code={WEBHOOK} /></Card>
        </div>
      </div>

      <Modal open={create} onOpenChange={setCreate} title={P.api.newKey} footer={<><Button variant="secondary" onClick={() => setCreate(false)}>{P.common.cancel}</Button><Button variant="gold" onClick={() => void doCreate()} loading={busy} disabled={!label.trim()}>{P.api.newKey}</Button></>}>
        <form onSubmit={(e) => { e.preventDefault(); void doCreate() }}><Field label={P.api.label} required><Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder={P.api.labelPh} /></Field></form>
      </Modal>
      <Modal open={Boolean(secret)} onOpenChange={(v) => { if (!v) setSecret(null) }} title={P.api.secretTitle} size="md" hideClose footer={<Button variant="gold" onClick={() => setSecret(null)}>{P.api.done}</Button>}>
        <div className="flex items-start gap-2 rounded-card border border-brick/30 bg-brick-soft p-3 text-[13px] text-ink"><TriangleAlert size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-brick" aria-hidden="true" />{P.api.secretWarn}</div>
        <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-line bg-paper-2 p-2 pl-3"><code className="min-w-0 flex-1 break-all font-mono text-[13px] text-ink">{secret}</code><Button variant={copied ? 'secondary' : 'gold'} size="sm" leading={copied ? <Check /> : <Copy />} onClick={() => void copy()}>{copied ? P.api.copied : P.api.copy}</Button></div>
      </Modal>
      <ConfirmDialog open={Boolean(revokeId)} onOpenChange={(v) => { if (!v) setRevokeId(null) }} title={P.api.revokeTitle} description={P.api.revokeDesc} tone="destructive" confirmLabel={P.api.revoke} loading={busy} onConfirm={() => void doRevoke()} />
    </div>
  )
}
