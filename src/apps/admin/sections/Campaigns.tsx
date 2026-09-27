import { useMemo, useState } from 'react'
import { Plus, Send } from 'lucide-react'
import { Badge, Button, ChipGroup, EmptyState, Field, Input, PhoneFrame, Seal, Segmented, Skeleton, Textarea } from '@/design'
import { useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { cn } from '@/lib/utils'
import type { Campaign, RegionId } from '@/domain/types'
import { AdminConfirm, SectionTitle } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useQueryParam, useSectionLoading } from '../lib/hooks'
import { fmtTime } from '../lib/format'
import { A } from '../strings'

type Draft = { id?: string; kind: 'push' | 'banner'; title: string; body: string; regionIds: RegionId[]; categoryIds: string[] }
const fresh = (): Draft => ({ kind: 'push', title: '', body: '', regionIds: [], categoryIds: [] })
const fromC = (c: Campaign): Draft => ({ id: c.id, kind: c.kind, title: c.title, body: c.body, regionIds: [...c.segment.regionIds], categoryIds: [...c.segment.categoryIds] })

export function Campaigns() {
  const data = useStore((s) => s.data)
  const access = useAccess('campaigns')
  const loading = useSectionLoading()
  const [qid, setQid] = useQueryParam('id')
  const selected = data.campaigns.find((c) => c.id === qid)
  if (loading) return <div className="grid h-full grid-cols-[320px_1fr] gap-4 p-5"><Skeleton height="100%" className="rounded-card" /><Skeleton height="100%" className="rounded-card" /></div>
  return (
    <div className="grid h-full min-h-0 grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-r border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-3 py-2.5"><span className="eyebrow">{uz.admin.sections.campaigns} · {data.campaigns.length}</span><Button size="sm" variant="gold" leading={<Plus strokeWidth={1.75} />} disabled={!access.edit} onClick={() => setQid(null)}>{A.campaigns.new}</Button></div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          {data.campaigns.length === 0 && <EmptyState compact icon="megaphone" title={A.campaigns.empty} />}
          {data.campaigns.map((c) => (
            <button key={c.id} type="button" onClick={() => setQid(c.id)} aria-current={qid === c.id ? 'true' : undefined} className={cn('flex w-full flex-col gap-1 border-b border-line px-4 py-3 text-left transition-colors hover:bg-blue-soft/40', qid === c.id && 'bg-blue-soft shadow-[inset_3px_0_0_var(--blue)] hover:bg-blue-soft')}>
              <span className="flex w-full items-center gap-2"><Badge size="sm" tone={c.kind === 'push' ? 'blue' : 'neutral'}>{A.common.campaignKind[c.kind]}</Badge><Badge size="sm" tone={c.status === 'sent' ? 'green' : 'gold'} dot>{A.common.campaignStatus[c.status]}</Badge></span>
              <span className="truncate text-[13.5px] font-medium text-ink">{c.title}</span>
              <span className="text-[11.5px] text-ink-3">{c.status === 'sent' ? `${A.campaigns.reach}: ${c.reach?.toLocaleString('ru-RU')} · ${fmtTime(c.sentAt)}` : fmtTime(c.createdAt)}</span>
            </button>
          ))}
        </div>
      </aside>
      <Editor key={selected?.id ?? 'new'} selected={selected} setQid={setQid} canEdit={access.edit} canApprove={access.approve} />
    </div>
  )
}

function Editor({ selected, setQid, canEdit, canApprove }: { selected: Campaign | undefined; setQid: (v: string | null) => void; canEdit: boolean; canApprove: boolean }) {
  const data = useStore((s) => s.data)
  const [draft, setDraft] = useState<Draft>(() => (selected ? fromC(selected) : fresh()))
  const [confirm, setConfirm] = useState(false)
  const { run, pending } = useAct()
  const reach = useMemo(() => data.users.filter((u) => u.notificationsEnabled && (!draft.regionIds.length || draft.regionIds.includes(u.regionId))).length, [data.users, draft.regionIds])
  const roots = data.categories.filter((c) => !c.parentId)
  const save = async () => { const r = await run('save', () => api.admin.saveCampaign({ id: draft.id, kind: draft.kind, title: draft.title.trim(), body: draft.body.trim(), segment: { regionIds: draft.regionIds, categoryIds: draft.categoryIds } }), A.campaigns.saved); if (r) setQid(r.id); return r }
  const send = async () => { setConfirm(false); const c = draft.id ? { id: draft.id } : await save(); if (c) await run('send', () => api.admin.sendCampaign(c.id), A.campaigns.sent) }
  const valid = draft.title.trim().length >= 3 && draft.body.trim().length >= 3
  const sent = selected?.status === 'sent'
  const access = { edit: canEdit, approve: canApprove }
  return (
    <>
      <section className="scroll-thin min-h-0 overflow-y-auto p-5">
        <div className="mx-auto grid max-w-[980px] grid-cols-[minmax(0,1fr)_260px] gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between"><h2 className="m-0 font-display text-[20px]">{selected ? selected.title : A.campaigns.new}</h2>{sent && <Badge tone="green" dot>{A.common.campaignStatus.sent} · {fmtTime(selected?.sentAt)}</Badge>}</div>
            <Field label={A.campaigns.kind}><Segmented value={draft.kind} onChange={(v) => setDraft({ ...draft, kind: v })} size="md" options={[{ value: 'push', label: A.common.campaignKind.push }, { value: 'banner', label: A.common.campaignKind.banner }]} aria-label={A.campaigns.kind} /></Field>
            <Field label={A.campaigns.title} required><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={!access.edit || sent} maxLength={60} /></Field>
            <Field label={A.campaigns.body} required><Textarea rows={3} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} disabled={!access.edit || sent} maxLength={180} /></Field>
            <Field label={`${A.campaigns.segment} · ${A.campaigns.regions}`} hint={draft.regionIds.length ? undefined : A.campaigns.allRegions}><ChipGroup mode="multi" size="sm" value={draft.regionIds} onChange={(v) => setDraft({ ...draft, regionIds: v })} options={data.regions.map((r) => ({ value: r.id, label: r.name }))} aria-label={A.campaigns.regions} /></Field>
            <Field label={A.campaigns.categories} hint={draft.categoryIds.length ? undefined : A.campaigns.allCats}><ChipGroup mode="multi" size="sm" value={draft.categoryIds} onChange={(v) => setDraft({ ...draft, categoryIds: v })} options={roots.map((c) => ({ value: c.id, label: c.name }))} aria-label={A.campaigns.categories} /></Field>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="text-[13px] text-ink-2">{A.campaigns.estimatedReach}: <span className="tnum font-semibold text-ink">{reach.toLocaleString('ru-RU')}</span></span>
              <span className="flex gap-2">
                <Button variant="secondary" disabled={!access.edit || !valid || sent} loading={pending === 'save'} onClick={save}>{A.campaigns.save}</Button>
                <Button variant="gold" leading={<Send strokeWidth={1.75} />} disabled={!access.approve || !valid || sent} loading={pending === 'send'} onClick={() => setConfirm(true)}>{A.campaigns.sendNow}</Button>
              </span>
            </div>
          </div>
          <div>
            <SectionTitle>{A.campaigns.preview}</SectionTitle>
            <PhoneFrame scale={0.55} time="9:41" chrome>
              <div className="flex h-full flex-col gap-3 bg-paper p-3">
                {draft.kind === 'push' ? (
                  <div className="flex items-start gap-3 rounded-[22px] border border-line bg-card p-3 shadow-soft">
                    <Seal size={40} variant="ink" icon="megaphone" />
                    <div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-2"><span className="eyebrow truncate !text-[10px]">{uz.app.name}</span><span className="text-[11px] text-ink-3">{A.campaigns.now}</span></div><div className="mt-0.5 truncate text-[14px] font-semibold leading-tight">{draft.title || A.campaigns.title}</div><div className="clamp-2 text-[13px] leading-snug text-ink-2">{draft.body || A.campaigns.body}</div></div>
                  </div>
                ) : (
                  <div className="relative mt-16 overflow-hidden rounded-card p-4 text-white shadow-soft" style={{ background: 'linear-gradient(110deg, #0f1f3a 0%, #1d3557 100%)' }}><span aria-hidden="true" className="absolute -right-8 -top-10 h-36 w-36 rounded-full" style={{ background: 'rgba(245,180,0,.18)' }} /><div className="eyebrow !text-gold-fill">{A.campaigns.banner}</div><div className="mt-1 font-display text-[20px] leading-tight">{draft.title || A.campaigns.title}</div><p className="m-0 mt-1 text-[13px] text-white/75">{draft.body || A.campaigns.body}</p><span className="mt-2 inline-flex rounded-[8px] bg-gold-fill px-2.5 py-1 text-[12px] font-bold" style={{ color: '#0f1f3a' }}>{A.common.open}</span></div>
                )}
                <div className="mt-auto grid grid-cols-2 gap-2 opacity-40">{[0, 1, 2, 3].map((i) => <div key={i} className="hatch h-28 rounded-[10px]" />)}</div>
              </div>
            </PhoneFrame>
          </div>
        </div>
      </section>
      <AdminConfirm open={confirm} onOpenChange={setConfirm} title={A.campaigns.sendNow} description={A.campaigns.sendConfirm} confirmLabel={A.campaigns.sendNow} onConfirm={send} />
    </>
  )
}
