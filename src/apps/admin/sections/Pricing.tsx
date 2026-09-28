import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Check, Minus, Plus, Sparkles, Undo2, X } from 'lucide-react'
import {
  Badge, Button, Chip, DataTable, EmptyState, Field, Input, LedgerRow, Ledger, Money, MoneyInput, ProductImage, Skeleton, Textarea, chartTheme, type Column,
} from '@/design'
import { useNow, useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { TID } from '@/lib/testids'
import { cn } from '@/lib/utils'
import type { Comparable, Listing, Tiyin } from '@/domain/types'
import { classifyQueue, isPricingQueue, priceHistogram, PRICE_STEP, type QueueChip } from '@/domain/pricing'
import { calcFee, publishedRuleSet } from '@/domain/fees'
import { newRetailFor } from '@/domain/checks/models'
import { formatMoney, formatMoneyCompact } from '@/domain/money'
import { AC, AC_CURSOR, AC_GRID, AdminConfirm, LegendPills, ListingStatusBadge, Ring, SectionTitle } from '../components/ui'
import { useAccess } from '../lib/sections'
import { useAct, useQueryParam, useSectionLoading } from '../lib/hooks'
import { categoryName, regionName, signedPct, userName, waitFor } from '../lib/format'
import { localApi } from '../localApi'
import { useAdmin } from '../lib/context'
import { imgId } from './Moderation'
import { A, tt } from '../strings'

const CHIP_TONE: Record<QueueChip, 'brick' | 'green' | 'neutral' | 'gold'> = { overpriced: 'brick', fair: 'green', low_data: 'neutral', imei_issue: 'gold' }

export function Pricing() {
  const data = useStore((s) => s.data)
  const now = useNow()
  const access = useAccess('pricing')
  const loading = useSectionLoading()
  const { compact } = useAdmin()
  const [qid, setQid] = useQueryParam('id')
  const [chip, setChip] = useState<QueueChip | 'all'>('all')
  const queue = useMemo(() => data.listings
    .filter(isPricingQueue)
    .sort((a, b) => (a.status === 'in_review' ? 0 : 1) - (b.status === 'in_review' ? 0 : 1) || (a.submittedAt ?? a.createdAt).localeCompare(b.submittedAt ?? b.createdAt)), [data.listings])
  const filtered = chip === 'all' ? queue : queue.filter((l) => classifyQueue(l) === chip)
  const selected = data.listings.find((l) => l.id === qid) ?? filtered[0]
  useEffect(() => { if (!qid && filtered[0]) setQid(filtered[0].id) }, [qid, filtered, setQid])
  const selectNext = (cur: string) => { const rest = filtered.filter((l) => l.id !== cur); setQid(rest[0]?.id ?? null) }
  const counts = useMemo(() => { const c: Record<QueueChip, number> = { overpriced: 0, fair: 0, low_data: 0, imei_issue: 0 }; for (const l of queue) c[classifyQueue(l)] += 1; return c }, [queue])

  if (loading) return <div className="grid h-full grid-cols-[300px_1fr_340px] gap-4 p-4"><Skeleton height="100%" className="rounded-card" /><Skeleton height="100%" className="rounded-card" /><Skeleton height="100%" className="rounded-card" /></div>

  return (
    <div className={cn('grid h-full min-h-0', compact ? 'grid-cols-[236px_minmax(0,1fr)_300px]' : 'grid-cols-[292px_minmax(0,1fr)_340px]')}>
      <aside className="flex min-h-0 flex-col border-r border-line bg-card">
        <div className="border-b border-line px-3 py-2.5">
          <div className="eyebrow mb-2">{A.pricing.queue} · <span className="tnum text-ink">{queue.length}</span></div>
          <div className="flex flex-wrap gap-1">
            <Chip size="sm" selected={chip === 'all'} onToggle={() => setChip('all')}>{A.pricing.chips.all}</Chip>
            {(['overpriced', 'fair', 'low_data', 'imei_issue'] as QueueChip[]).map((c) => (
              <Chip key={c} size="sm" selected={chip === c} onToggle={() => setChip(chip === c ? 'all' : c)}>{A.pricing.chips[c]} <span className="tnum text-ink-3">{counts[c]}</span></Chip>
            ))}
          </div>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 && <EmptyState compact icon="badge-percent" title={A.pricing.empty} hint={A.pricing.emptyHint} />}
          {filtered.map((l) => {
            const q = classifyQueue(l)
            const active = selected?.id === l.id
            return (
              <button key={l.id} type="button" data-testid={TID.aQueueItem} data-id={l.id} aria-current={active ? 'true' : undefined} onClick={() => setQid(l.id)}
                className={cn('flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left transition-colors hover:bg-blue-soft/40', active && 'bg-blue-soft shadow-[inset_3px_0_0_var(--blue)] hover:bg-blue-soft')}>
                <ProductImage id={imgId(l.images[0] ?? '', l.id)} className="h-11 w-11 shrink-0" fill={0.8} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{l.title}</span>
                  <span className="mt-0.5 flex items-center justify-between gap-2 text-[12px]"><Money tiyin={l.askingTiyin} size="xs" className="text-ink-2" /><span className="tnum text-ink-3">{waitFor(l.submittedAt, now)}</span></span>
                  <span className="mt-1 flex items-center gap-1">
                    {l.suggestion ? <Badge size="sm" tone={CHIP_TONE[q]} dot>{A.pricing.chips[q]}</Badge> : <Badge size="sm" tone="outline">{uz.listing.status[l.status]}</Badge>}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </aside>
      {selected ? <Workbench key={selected.id} l={selected} canEdit={access.edit} canApprove={access.approve} onDone={() => selectNext(selected.id)} />
        : <div className="col-span-2 grid place-items-center"><EmptyState icon="badge-percent" title={A.pricing.empty} hint={A.pricing.emptyHint} /></div>}
    </div>
  )
}

function Workbench({ l, canEdit, canApprove, onDone }: { l: Listing; canEdit: boolean; canApprove: boolean; onDone: () => void }) {
  const data = useStore((s) => s.data)
  const now = useNow()
  const { run, pending } = useAct()
  const sug = l.suggestion
  const [price, setPrice] = useState<Tiyin | null>(sug?.suggestedTiyin ?? l.askingTiyin)
  const [note, setNote] = useState('')
  const [dlg, setDlg] = useState<'return' | 'reject' | null>(null)
  const [seenAt, setSeenAt] = useState(sug?.computedAt)
  if (sug && sug.computedAt !== seenAt) { setSeenAt(sug.computedAt); setPrice(sug.suggestedTiyin) }
  const rules = publishedRuleSet(data.feeRuleSets) ?? data.feeRuleSets[0]
  const fee = price !== null && price > 0 ? calcFee(price, l.categoryId, rules) : null
  const newRetail = sug?.newRetailTiyin ?? newRetailFor(l.specs?.model)
  const hist = useMemo(() => (sug ? priceHistogram(sug.comparables, 8).map((b) => ({ mid: Math.round((b.fromTiyin + b.toTiyin) / 2), from: b.fromTiyin, to: b.toTiyin, count: b.count, weight: Math.round(b.weight * 10) / 10 })) : []), [sug])
  const adjusts = sug?.breakdown.filter((r) => r.kind === 'adjust') ?? []
  const maxAdj = Math.max(1, ...adjusts.map((r) => Math.abs(r.amountTiyin)))
  const step = (d: number) => setPrice((p) => Math.max(0, (p ?? 0) + d * PRICE_STEP))

  const compCols: Column<Comparable>[] = [
    { key: 'title', header: A.common.title, sortable: true, render: (c) => <span className="truncate" title={c.title}>{c.title}</span> },
    { key: 'condition', header: A.pricing.condition, sortable: true, width: 70, render: (c) => <Badge tone="outline" size="sm">{c.condition}</Badge> },
    { key: 'regionId', header: A.common.region, sortable: true, width: 120, defaultHidden: true, render: (c) => regionName(data, c.regionId), csv: (c) => regionName(data, c.regionId) },
    { key: 'priceTiyin', header: A.common.price, sortable: true, align: 'right', width: 120, render: (c) => <Money tiyin={c.priceTiyin} size="sm" />, csv: (c) => c.priceTiyin / 100 },
    { key: 'outcome', header: A.common.status, sortable: true, width: 120, render: (c) => (
      <span className={cn('text-[12.5px]', c.outcome === 'sold' ? 'text-green' : c.outcome === 'stale' ? 'text-brick' : 'text-ink-2')}>
        {c.outcome === 'sold' ? tt(A.pricing.outcome.sold, { n: c.daysToSell ?? c.daysListed }) : c.outcome === 'stale' ? tt(A.pricing.outcome.stale, { n: c.daysListed }) : A.pricing.outcome.active}
      </span>
    ), csv: (c) => c.outcome },
    { key: 'weight', header: A.pricing.weight, sortable: true, align: 'right', width: 60, defaultHidden: true, render: (c) => <span className="tnum text-ink-3">{c.weight}</span> },
  ]

  const send = () => { if (price === null || price <= 0) return; void run('send', () => api.listings.sendOffer(l.id, price, note), () => A.pricing.sent).then((r) => { if (r) onDone() }) }

  return (
    <>
      <section className="scroll-thin flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-3"><span className="tnum">{l.id}</span><span>·</span><span>{categoryName(data, l.categoryId)}</span><span>·</span><span>{regionName(data, l.regionId)}</span><span>·</span><span>{userName(data, l.sellerId)}</span></div>
            <h2 className="m-0 mt-1 font-display text-[20px] leading-tight text-ink">{l.title}</h2>
          </div>
          <div className="flex items-center gap-2"><ListingStatusBadge status={l.status} /><Badge tone="outline">{uz.condition[l.condition]}</Badge><span className="tnum text-[12.5px] text-ink-3">{waitFor(l.submittedAt, now)} {A.pricing.waiting}</span></div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">{(l.images.length ? l.images : ['x']).slice(0, 4).map((img, i) => <ProductImage key={i} id={imgId(img, `${l.id}-${i}`)} className="h-[88px] w-[88px] shrink-0" />)}</div>
          <div className="min-w-0 rounded-card border border-line bg-card p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><SectionTitle>{A.pricing.sellerNote}</SectionTitle><span className="flex items-baseline gap-2 text-[13px]"><span className="text-ink-2">{A.pricing.asking}</span><Money tiyin={l.askingTiyin} size="md" /></span></div>
            <p className="m-0 text-[13px] leading-snug text-ink-2">{l.description}</p>
          </div>
        </div>

        <div>
          <SectionTitle>{A.pricing.specs}</SectionTitle>
          <SpecChips l={l} canEdit={canEdit} />
        </div>

        {!sug ? (
          <div className="rounded-card border border-dashed border-line-strong p-6 text-center">
            <Sparkles className="mx-auto mb-2 text-gold" size={22} strokeWidth={1.75} aria-hidden="true" />
            <div className="font-display text-[15px] text-ink">{A.pricing.noSuggestion}</div>
            <Button className="mt-3" variant="gold" size="sm" disabled={!canEdit} loading={pending === 'ai'} onClick={() => run('ai', () => api.listings.aiCheck(l.id))}>{A.pricing.runAi}</Button>
          </div>
        ) : (
          <>
            <div>
              <SectionTitle right={<span className="text-[12px] text-ink-3">{A.pricing.marketMedian}: <Money tiyin={sug.marketMedianTiyin} size="xs" className="text-ink" /></span>}>{A.pricing.comparables} · {sug.comparables.length}</SectionTitle>
              <DataTable columns={compCols} rows={sug.comparables} rowKey={(c) => c.listingId} pageSize={6} exportFilename={`oxshash-${l.id}`} defaultSort={{ key: 'weight', dir: 'desc' }} columnsMenu emptyState={<EmptyState compact title={A.pricing.noComparables} />} />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_200px] gap-4">
              <div className="rounded-card border border-line bg-card p-3">
                <SectionTitle right={<LegendPills items={[{ label: A.pricing.asking, color: AC.brick }, { label: A.pricing.suggested, color: AC.goldFill }]} />}>{A.pricing.histogram}</SectionTitle>
                <div className="h-[150px]">
                  {hist.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hist} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} {...AC_GRID} />
                        <XAxis type="number" dataKey="mid" domain={[Math.min(hist[0].from, l.askingTiyin, sug.suggestedTiyin) - PRICE_STEP, Math.max(hist[hist.length - 1].to, l.askingTiyin, sug.suggestedTiyin) + PRICE_STEP]} tick={chartTheme.axisTick} axisLine={chartTheme.axisLine} tickLine={false} tickFormatter={(v: number) => formatMoneyCompact(Math.round(v))} tickCount={6} />
                        <YAxis allowDecimals={false} tick={chartTheme.axisTick} axisLine={false} tickLine={false} width={24} />
                        <Tooltip cursor={AC_CURSOR} content={({ active, payload }) => active && payload?.[0] ? (
                          <div className={chartTheme.tooltipClass}><div className={chartTheme.tooltipLabelClass}>{formatMoney(payload[0].payload.from)} – {formatMoney(payload[0].payload.to)}</div><div>{payload[0].payload.count} {uz.app.pcs} · {A.pricing.weight} {payload[0].payload.weight}</div></div>
                        ) : null} />
                        <Bar dataKey="count" fill={AC.blue} radius={[6, 6, 0, 0]} barSize={22} />
                        <ReferenceLine x={l.askingTiyin} stroke={AC.brick} strokeWidth={1.75} strokeDasharray="4 3" />
                        <ReferenceLine x={sug.suggestedTiyin} stroke={AC.goldFill} strokeWidth={2.5} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState compact title={A.pricing.noComparables} />}
                </div>
              </div>
              <div className="rounded-card border border-line bg-card p-3">
                <SectionTitle>{A.pricing.newRetail}</SectionTitle>
                {newRetail ? <Money tiyin={newRetail} size="lg" /> : <span className="text-ink-3">—</span>}
                {newRetail && <div className="mt-1 text-[12px] text-ink-3">{A.pricing.suggested}: {signedPct((sug.suggestedTiyin - newRetail) / newRetail)}</div>}
                <div className="mt-3 flex flex-wrap gap-1">{sug.flags.map((f) => <Badge key={f} size="sm" tone={f === 'fair' ? 'green' : f === 'overpriced' || f === 'imei_issue' || f === 'images_suspicious' ? 'brick' : 'neutral'}>{f === 'images_suspicious' ? A.moderation.notOriginal : A.pricing.chips[f as QueueChip]}</Badge>)}</div>
              </div>
            </div>
          </>
        )}
      </section>

      <aside className="scroll-thin flex min-h-0 flex-col overflow-y-auto border-l border-line bg-card">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-blue/10 bg-blue-soft px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue"><Sparkles size={13} strokeWidth={2} aria-hidden="true" />{A.pricing.aiCard}</div>
            <div className="mt-1 truncate text-[12px] text-ink-2">{sug ? `${sug.comparables.length} ${uz.app.pcs} · ${l.specs?.model ?? '—'}` : A.pricing.noSuggestion}</div>
          </div>
          <Ring value={sug?.confidence ?? 0} size={60} label={A.pricing.confidence} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        {sug && (
          <>
            <div className="rounded-card border border-line bg-paper p-3">
              <div className="eyebrow">{A.pricing.suggested}</div>
              <Money tiyin={sug.suggestedTiyin} size="display" className="mt-0.5 block text-[30px] leading-none text-ink" softCurrency />
              <div className="mt-1.5 text-[12px] text-ink-3">{A.pricing.vsAsk}: <span className={cn('tnum inline-flex h-5 items-center rounded-full px-1.5 font-semibold', sug.suggestedTiyin < l.askingTiyin ? 'bg-brick-soft text-brick' : 'bg-green-soft text-green')}>{signedPct((sug.suggestedTiyin - l.askingTiyin) / l.askingTiyin)}</span></div>
            </div>
            <Ledger title={A.pricing.ledger}>
              {sug.breakdown.map((r, i) => <LedgerRow key={i} label={r.label} value={<Money tiyin={r.amountTiyin} size={r.kind === 'total' ? 'md' : 'sm'} sign={r.kind === 'adjust'} />} emphasis={r.kind === 'total'} tone={r.kind === 'adjust' ? (r.amountTiyin < 0 ? 'brick' : 'green') : 'default'} className="py-1.5" />)}
            </Ledger>
            {adjusts.length > 0 && (
              <div>
                <SectionTitle>{A.pricing.factors}</SectionTitle>
                <div className="flex flex-col gap-1.5">
                  {adjusts.map((r, i) => (
                    <div key={i} className="text-[12px]">
                      <div className="flex justify-between gap-2"><span className="truncate text-ink-2">{r.label}</span><span className={cn('tnum shrink-0', r.amountTiyin < 0 ? 'text-brick' : 'text-green')}>{formatMoney(r.amountTiyin, { sign: true, compact: true })}</span></div>
                      <div className="relative mt-1 h-1.5 w-full rounded-full bg-paper-2"><div className={cn('absolute top-0 h-full rounded-full', r.amountTiyin < 0 ? 'right-1/2 bg-brick' : 'left-1/2 bg-green')} style={{ width: `${(Math.abs(r.amountTiyin) / maxAdj) * 50}%` }} /><span className="absolute left-1/2 top-[-2px] h-[10px] w-px bg-line-strong" /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div className="border-t border-line pt-3">
          <Field label={A.pricing.moderatorPrice}>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon" aria-label={A.pricing.minus} onClick={() => step(-1)} disabled={!canEdit} className="!h-11 !w-11 shrink-0 !shadow-none"><Minus size={18} strokeWidth={2.25} /></Button>
              <MoneyInput data-testid={TID.aModeratorPrice} valueTiyin={price} onChangeTiyin={setPrice} size="md" disabled={!canEdit} aria-label={A.pricing.moderatorPrice} className="tnum font-display !text-[20px] font-bold tracking-[-0.01em]" />
              <Button variant="secondary" size="icon" aria-label={A.pricing.plus} onClick={() => step(1)} disabled={!canEdit} className="!h-11 !w-11 shrink-0 !shadow-none"><Plus size={18} strokeWidth={2.25} /></Button>
            </div>
          </Field>
          {sug && price !== null && price !== sug.suggestedTiyin && <div className="mt-1 text-[12px] text-ink-3">{A.pricing.vsAi}: <span className="tnum text-ink">{signedPct((price - sug.suggestedTiyin) / sug.suggestedTiyin)}</span> {sug.suggestedTiyin !== price && <button type="button" className="ml-1 inline-flex items-center gap-1 text-blue hover:underline" onClick={() => setPrice(sug.suggestedTiyin)}><Undo2 size={11} /> AI</button>}</div>}
          <Ledger className="mt-2">
            <LedgerRow label={A.pricing.fee} value={fee ? <Money tiyin={fee.feeTiyin} size="sm" /> : '—'} sub={fee?.rate !== undefined ? `${Math.round(fee.rate * 1000) / 10}%` : undefined} className="py-1.5" />
            <LedgerRow label={A.pricing.sellerGets} value={fee ? <Money tiyin={fee.sellerGetsTiyin} size="md" /> : '—'} emphasis className="py-1.5" />
          </Ledger>
        </div>
        <Field label={A.pricing.note} optionalText={uz.app.optional}>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={A.pricing.notePlaceholder} disabled={!canEdit} />
        </Field>
        <div className="mt-auto flex flex-col gap-2">
          <Button data-testid={TID.aSendOffer} variant="gold" fullWidth leading={<Check strokeWidth={2} />} onClick={send} disabled={!canApprove || !price || l.status !== 'in_review'} loading={pending === 'send'}>{uz.admin.sendOffer}</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" leading={<Undo2 strokeWidth={1.75} />} onClick={() => setDlg('return')} disabled={!canEdit || l.status !== 'in_review'}>{uz.admin.return}</Button>
            <Button variant="danger" size="sm" leading={<X strokeWidth={1.75} />} onClick={() => setDlg('reject')} disabled={!canApprove || l.status !== 'in_review'}>{uz.admin.reject}</Button>
          </div>
        </div>
        </div>
      </aside>
      <AdminConfirm open={dlg === 'return'} onOpenChange={(o) => !o && setDlg(null)} title={uz.admin.return} description={l.title} requireReason reasonPlaceholder={A.pricing.returnReason} confirmLabel={uz.admin.return}
        onConfirm={async (reason) => { setDlg(null); const r = await run('return', () => api.listings.returnForEdit(l.id, reason ?? ''), A.moderation.returned); if (r) onDone() }} />
      <AdminConfirm open={dlg === 'reject'} onOpenChange={(o) => !o && setDlg(null)} title={uz.admin.reject} description={l.title} requireReason tone="destructive" reasonPlaceholder={A.pricing.rejectReason} confirmLabel={uz.admin.reject}
        onConfirm={async (reason) => { setDlg(null); const r = await run('reject', () => api.listings.reject(l.id, reason ?? ''), A.moderation.rejected); if (r) onDone() }} />
    </>
  )
}

const SPEC_KEYS = ['brand', 'model', 'storage', 'color', 'condition'] as const
function SpecChips({ l, canEdit }: { l: Listing; canEdit: boolean }) {
  const [editing, setEditing] = useState<(typeof SPEC_KEYS)[number] | null>(null)
  const [val, setVal] = useState('')
  const s = l.specs
  const save = async () => { if (!editing) return; const v = val.trim(); await localApi.updateSpecs(l.id, { [editing]: editing === 'condition' ? (['A', 'B', 'C', 'D'].includes(v.toUpperCase()) ? v.toUpperCase() : s?.condition) : v || undefined }); setEditing(null) }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {SPEC_KEYS.map((k) => {
        const v = k === 'condition' ? (s?.condition ?? l.condition) : s?.[k]
        if (editing === k) return (
          <form key={k} className="inline-flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); void save() }}>
            <Input size="sm" autoFocus value={val} onChange={(e) => setVal(e.target.value)} className="w-36" aria-label={k} onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null) }} />
            <Button size="sm" variant="secondary" type="submit"><Check size={14} /></Button>
          </form>
        )
        return (
          <button key={k} type="button" disabled={!canEdit} onClick={() => { setEditing(k); setVal(String(v ?? '')) }} title={A.pricing.editSpec}
            className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors disabled:cursor-default', v ? 'border-line bg-card text-ink hover:border-blue hover:text-blue' : 'border-dashed border-line-strong text-ink-3 hover:border-blue hover:text-blue')}>
            <span className="text-[11px] uppercase tracking-[0.1em] text-ink-3">{k}</span><span className="font-medium">{v ?? '—'}</span>
          </button>
        )
      })}
      {s?.imeiStatus && <Badge tone={s.imeiStatus === 'clean' ? 'green' : s.imeiStatus === 'suspicious' ? 'brick' : 'outline'} dot>{A.pricing.imeiStatus[s.imeiStatus]}</Badge>}
      {s && <Badge tone={s.imagesOriginal ? 'green' : 'brick'} dot>{A.moderation.images}: {s.imagesOriginal ? A.moderation.original : A.moderation.notOriginal}</Badge>}
    </div>
  )
}
