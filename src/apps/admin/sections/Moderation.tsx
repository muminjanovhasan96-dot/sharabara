import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, PencilLine, X, ZoomIn } from 'lucide-react'
import { Badge, Button, EmptyState, Kbd, Money, ProductImage, Illustration, isIllustrationId, illustrationFor, Skeleton } from '@/design'
import { useNow, useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { useKey } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import type { Listing } from '@/domain/types'
import { AdminConfirm, AdminModal, ListingStatusBadge, KV, KVGrid, SectionTitle } from '../components/ui'
import { useAccess, isModerated } from '../lib/sections'
import { useAct, useQueryParam, useSectionLoading } from '../lib/hooks'
import { categoryName, regionName, userName, waitFor, fmtTime } from '../lib/format'
import { A, tt } from '../strings'
import { useAdmin } from '../lib/context'

export const BANNED_WORDS = ['kredit', 'garov', 'nasiya', 'kafolat 100%', 'original emas']

export function highlightBanned(text: string) {
  const re = new RegExp(`(${BANNED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts = text.split(re)
  return parts.map((p, i) => (BANNED_WORDS.some((w) => w.toLowerCase() === p.toLowerCase()) ? <mark key={i} className="rounded-[3px] bg-brick/15 px-0.5 text-brick">{p}</mark> : <span key={i}>{p}</span>))
}
export function bannedIn(l: Listing): string[] {
  const t = `${l.title} ${l.description}`.toLowerCase()
  return BANNED_WORDS.filter((w) => t.includes(w))
}
export function imgId(id: string, seed: string) { return isIllustrationId(id) ? id : illustrationFor('phone', seed) }

export function Moderation() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const access = useAccess('moderation')
  const loading = useSectionLoading()
  const { compact } = useAdmin()
  const [qid, setQid] = useQueryParam('id')
  const { run, pending } = useAct()
  const queue = useMemo(() => data.listings.filter((l) => (l.status === 'in_review' || l.status === 'submitted') && !l.historical && !isModerated(l)).sort((a, b) => (a.submittedAt ?? a.createdAt).localeCompare(b.submittedAt ?? b.createdAt)), [data.listings])
  const fromParam = qid ? data.listings.find((l) => l.id === qid) : undefined
  const selected = fromParam ?? queue.find((l) => l.id === qid) ?? queue[0]
  const idx = queue.findIndex((l) => l.id === selected?.id)
  const [dlg, setDlg] = useState<'edit' | 'reject' | null>(null)
  const [zoom, setZoom] = useState<string | null>(null)

  useEffect(() => { if (!qid && queue[0]) setQid(queue[0].id) }, [qid, queue, setQid])
  const move = useCallback((d: number) => { if (!queue.length) return; const n = Math.max(0, Math.min(queue.length - 1, (idx < 0 ? 0 : idx) + d)); setQid(queue[n].id) }, [queue, idx, setQid])
  const selectNext = useCallback((cur: string) => { const rest = queue.filter((l) => l.id !== cur); setQid(rest[Math.min(idx, rest.length - 1)]?.id ?? null) }, [queue, idx, setQid])

  const approve = useCallback(() => { if (!selected || !access.approve) return; const id = selected.id; void run('approve', () => api.listings.approveContent(id), A.moderation.approved).then(() => selectNext(id)) }, [selected, access.approve, run, selectNext])
  useKey('j', () => move(1)); useKey('k', () => move(-1))
  useKey('a', () => approve(), { enabled: !dlg })
  useKey('e', () => { if (selected && access.edit) setDlg('edit') }, { enabled: !dlg })
  useKey('r', () => { if (selected && access.approve) setDlg('reject') }, { enabled: !dlg })

  if (loading) return <div className="grid h-full grid-cols-[340px_1fr] gap-4 p-5"><Skeleton height="100%" className="rounded-card" /><Skeleton height="100%" className="rounded-card" /></div>

  return (
    <div className={cn('grid h-full min-h-0', compact ? 'grid-cols-[280px_minmax(0,1fr)]' : 'grid-cols-[340px_minmax(0,1fr)]')}>
      <aside className="flex min-h-0 flex-col border-r border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="eyebrow">{A.moderation.queue} · <span className="tnum text-ink">{queue.length}</span></span>
          <span className="flex items-center gap-1 text-[11px] text-ink-3"><Kbd>J</Kbd><Kbd>K</Kbd></span>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          {queue.length === 0 && <EmptyState compact icon="shield-check" title={A.moderation.empty} hint={A.moderation.emptyHint} />}
          {queue.map((l) => {
            const banned = bannedIn(l).length
            const risk = banned > 0 || l.specs?.imeiStatus === 'suspicious' || l.specs?.imagesOriginal === false
            return (
              <button key={l.id} type="button" onClick={() => setQid(l.id)} aria-current={selected?.id === l.id ? 'true' : undefined} className={cn('flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors hover:bg-blue-soft/40', selected?.id === l.id && 'bg-blue-soft shadow-[inset_3px_0_0_var(--blue)] hover:bg-blue-soft')}>
                <ProductImage id={imgId(l.images[0] ?? '', l.id)} className="h-12 w-12 shrink-0" fill={0.8} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{l.title}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-3"><span className="tnum">{l.id}</span><span>·</span><span className="tnum">{waitFor(l.submittedAt, now)}</span></span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <ListingStatusBadge status={l.status} />
                    {risk && <Badge tone="brick" size="sm">{A.moderation.risks}</Badge>}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="scroll-thin min-h-0 overflow-y-auto p-5">
        {!selected ? <EmptyState icon="shield-check" title={A.moderation.empty} hint={A.moderation.selectHint} /> : (
          <Detail l={selected} onZoom={setZoom} onApprove={approve} onEdit={() => setDlg('edit')} onReject={() => setDlg('reject')} canEdit={access.edit} canApprove={access.approve} pending={pending} />
        )}
      </section>

      <AdminModal open={!!zoom} onOpenChange={(o) => !o && setZoom(null)} size="lg" title={A.moderation.zoom}>
        {zoom && <div className="hatch rounded-[12px] p-8"><Illustration id={imgId(zoom, zoom)} className="mx-auto h-[380px] w-full" /></div>}
      </AdminModal>
      <AdminConfirm open={dlg === 'edit'} onOpenChange={(o) => !o && setDlg(null)} title={uz.admin.requestEdit} description={selected?.title} requireReason reasonPlaceholder={A.moderation.editReason} confirmLabel={uz.admin.requestEdit}
        onConfirm={async (reason) => { if (!selected) return; const id = selected.id; setDlg(null); await run('edit', () => api.listings.returnForEdit(id, reason ?? ''), A.moderation.returned); selectNext(id) }} />
      <AdminConfirm open={dlg === 'reject'} onOpenChange={(o) => !o && setDlg(null)} title={uz.admin.reject} description={selected?.title} requireReason tone="destructive" reasonPlaceholder={A.moderation.rejectReason} confirmLabel={uz.admin.reject}
        onConfirm={async (reason) => { if (!selected) return; const id = selected.id; setDlg(null); await run('reject', () => api.listings.reject(id, reason ?? ''), A.moderation.rejected); selectNext(id) }} />
    </div>
  )
}

function Detail({ l, onZoom, onApprove, onEdit, onReject, canEdit, canApprove, pending }: { l: Listing; onZoom: (id: string) => void; onApprove: () => void; onEdit: () => void; onReject: () => void; canEdit: boolean; canApprove: boolean; pending: string | null }) {
  const data = useStore((s) => s.data)
  const banned = bannedIn(l)
  const s = l.specs
  const risks: { label: string; tone: 'brick' | 'gold' }[] = []
  if (banned.length) risks.push({ label: tt(A.moderation.bannedFound, { n: banned.length }), tone: 'brick' })
  if (s?.imeiStatus === 'suspicious') risks.push({ label: uz.sell.ai.imeiBad, tone: 'brick' })
  if (s && !s.imagesOriginal) risks.push({ label: `${A.moderation.images}: ${A.moderation.notOriginal}`, tone: 'brick' })
  if (s && s.confidence < 0.6) risks.push({ label: A.moderation.lowConfidence, tone: 'gold' })
  if (l.suggestion?.flags.includes('overpriced')) risks.push({ label: tt(A.moderation.priceFlag, { f: A.pricing.chips.overpriced }), tone: 'gold' })
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-ink-3"><span className="tnum">{l.id}</span><span>·</span><span>{categoryName(data, l.categoryId)}</span><span>·</span><span>{regionName(data, l.regionId)}</span></div>
          <h2 className="m-0 mt-1 font-display text-[22px] leading-tight text-ink">{highlightBanned(l.title)}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ListingStatusBadge status={l.status} />
            <Badge tone="outline">{uz.condition[l.condition]}</Badge>
            <span className="text-[13px] text-ink-2">{uz.listing.seller}: <span className="text-ink">{userName(data, l.sellerId)}</span></span>
            <span className="text-[13px] text-ink-3">{fmtTime(l.submittedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leading={<PencilLine strokeWidth={1.75} />} trailing={<Kbd>E</Kbd>} onClick={onEdit} disabled={!canEdit}>{uz.admin.requestEdit}</Button>
          <Button variant="danger" size="sm" leading={<X strokeWidth={1.75} />} trailing={<Kbd className="[&_kbd]:bg-transparent [&_kbd]:text-paper [&_kbd]:border-paper/40">R</Kbd>} onClick={onReject} disabled={!canApprove}>{uz.admin.reject}</Button>
          <Button variant="gold" size="sm" leading={<Check strokeWidth={1.75} />} trailing={<Kbd>A</Kbd>} onClick={onApprove} disabled={!canApprove} loading={pending === 'approve'}>{uz.admin.approve}</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(l.images.length ? l.images : ['x']).slice(0, 4).map((img, i) => (
          <button key={i} type="button" onClick={() => onZoom(img)} aria-label={A.moderation.zoom} className="group relative overflow-hidden rounded-[10px] focus-visible:ring-2 focus-visible:ring-gold">
            <ProductImage id={imgId(img, `${l.id}-${i}`)} aspect="4/3" />
            <span className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-card/90 text-ink opacity-0 shadow-soft transition-opacity group-hover:opacity-100"><ZoomIn size={14} strokeWidth={1.75} /></span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <div>
            <SectionTitle>{A.moderation.description}</SectionTitle>
            <p className="m-0 whitespace-pre-line text-[14px] leading-relaxed text-ink">{highlightBanned(l.description)}</p>
          </div>
          <KVGrid cols={3}>
            <KV label={uz.sell.yourPrice}><Money tiyin={l.askingTiyin} /></KV>
            <KV label={uz.sell.imei}><span className="tnum">{l.imei ?? '—'}</span></KV>
            <KV label={uz.listing.views}>{l.stats.views}</KV>
            {Object.entries(l.attributes).slice(0, 6).map(([k, v]) => <KV key={k} label={k}>{String(v)}</KV>)}
          </KVGrid>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-line bg-card p-4">
            <SectionTitle>{A.moderation.aiFlags}</SectionTitle>
            {!s ? <p className="m-0 text-[13px] text-ink-3">{A.pricing.noSuggestion}</p> : (
              <div className="flex flex-col gap-2 text-[13px]">
                <div className="flex flex-wrap gap-1.5">
                  {s.brand && <Badge tone="neutral">{s.brand}</Badge>}{s.model && <Badge tone="blue">{s.model}</Badge>}{s.storage && <Badge tone="neutral">{s.storage}</Badge>}{s.color && <Badge tone="neutral">{s.color}</Badge>}
                </div>
                <div className="flex items-center justify-between"><span className="text-ink-2">{A.moderation.imei}</span><Badge tone={s.imeiStatus === 'clean' ? 'green' : s.imeiStatus === 'suspicious' ? 'brick' : 'outline'} dot>{A.pricing.imeiStatus[s.imeiStatus ?? 'not_provided']}</Badge></div>
                <div className="flex items-center justify-between"><span className="text-ink-2">{A.moderation.images}</span><Badge tone={s.imagesOriginal ? 'green' : 'brick'} dot>{s.imagesOriginal ? A.moderation.original : A.moderation.notOriginal}</Badge></div>
                <div className="flex items-center justify-between"><span className="text-ink-2">{uz.condition.label}</span><span>{uz.condition[s.condition]}</span></div>
                <div className="flex items-center justify-between"><span className="text-ink-2">{A.moderation.confidence}</span><span className="tnum">{Math.round(s.confidence * 100)}%</span></div>
                {s.conditionNote && <p className="m-0 text-[12.5px] text-ink-3">{s.conditionNote}</p>}
              </div>
            )}
          </div>
          <div className="rounded-card border border-line bg-card p-4">
            <SectionTitle>{A.moderation.risks}</SectionTitle>
            {risks.length === 0 ? <div className="flex items-center gap-2 text-[13px] text-green"><Check size={15} strokeWidth={2} /> {A.moderation.noRisks}</div> : (
              <div className="flex flex-wrap gap-1.5">{risks.map((r) => <Badge key={r.label} tone={r.tone} dot>{r.label}</Badge>)}</div>
            )}
            {banned.length > 0 && <div className="mt-2 text-[12px] text-ink-3">{A.moderation.banned}: {banned.join(', ')}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
