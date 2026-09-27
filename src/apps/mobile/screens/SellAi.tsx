import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, LoaderCircle, Pencil, Sparkles, TriangleAlert } from 'lucide-react'
import { useStore } from '@/store'
import { api } from '@/api'
import { advisor, type AiStep } from '@/api/advisor'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { cn, SPRING } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { Badge, Button, ErrorState, Input, Progress } from '@/design'
import { GoldCoin } from '../components/Ui'
import type { Condition } from '@/domain/types'
import { ms } from '../strings'
import { localApi } from '../localApi'
import { Screen } from '../components/Screen'

const STEP_MS = 700

export default function SellAi() {
  const { id = '' } = useParams<{ id: string }>()
  const nav = useAppNavigate()
  const reduce = useReducedMotion()
  const listing = useStore((s) => s.data.listings.find((l) => l.id === id))
  const [steps, setSteps] = useState<AiStep[] | null>(null)
  const [lit, setLit] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [edit, setEdit] = useState<string | null>(null)
  const [val, setVal] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (!listing || ran.current) return
    ran.current = true
    ;(async () => {
      try {
        let l = listing
        if (l.status === 'submitted') { const r = await api.listings.aiCheck(l.id); l = r.listing }
        const fresh = useStore.getState().data.listings.find((x) => x.id === id) ?? l
        const specs = fresh.specs ?? { condition: fresh.condition, conditionNote: '', imagesOriginal: true, confidence: 0.5 }
        setSteps(advisor.explainSteps(fresh, specs, fresh.suggestion?.comparables.length ?? 0))
      } catch (e) { setError(e instanceof Error ? e.message : uz.app.error) }
    })()
  }, [listing?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!steps) return
    if (lit >= steps.length) return
    const tm = setTimeout(() => setLit((n) => n + 1), reduce ? 120 : STEP_MS)
    return () => clearTimeout(tm)
  }, [steps, lit, reduce])
  const done = !!steps && lit >= steps.length

  const chips = useMemo(() => {
    if (!listing) return []
    const s = listing.specs; const a = listing.attributes
    return [
      { key: 'model', label: ms.sell.model, value: String(a.model ?? s?.model ?? '—') },
      { key: 'xotira', label: ms.sell.storage, value: String(a.xotira ?? s?.storage ?? '—') },
      { key: 'rang', label: ms.sell.color, value: String(a.rang ?? s?.color ?? '—') },
      { key: 'condition', label: ms.sell.condition, value: uz.condition[(s?.condition ?? listing.condition) as Condition] },
    ]
  }, [listing])

  const saveChip = async () => {
    if (!edit || !listing) return
    if (edit !== 'condition' && val.trim()) await localApi.setListingAttributes(listing.id, { [edit]: val.trim() })
    setEdit(null)
  }

  if (!listing) return <Screen back backTo="/sell/my" title={uz.sell.step2}><ErrorState title={ms.listing.notFound} onRetry={() => nav('/sell/my')} retryLabel={uz.sell.myListings} /></Screen>
  return (
    <Screen back={done} backTo="/sell/my" title={ms.sell.aiTitle} eyebrow={`2/3 · ${uz.sell.step2}`}
      bottom={done ? <Button variant="primary" size="lg" fullWidth onClick={() => nav('/sell/my')}>{ms.sell.toMyListings}</Button> : undefined}>
      <Progress value={2} max={3} size="sm" className="mt-3 [&>div]:bg-gold-fill" />
      <div className="mt-6 flex flex-col items-center text-center">
        <motion.div animate={done || reduce ? { scale: 1 } : { scale: [1, 1.04, 1] }} transition={done ? SPRING : { repeat: Infinity, duration: 1.6 }}>
          {done ? <GoldCoin size={80} /> : <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-soft text-blue shadow-[0_12px_28px_-12px_rgba(47,111,237,.6)]"><Sparkles size={34} strokeWidth={1.9} /></span>}
        </motion.div>
        <h1 className="m-0 mt-3 font-display text-[20px] leading-tight">{done ? uz.sell.ai.done : ms.sell.aiTitle}</h1>
        <p className="m-0 mt-1 max-w-[30ch] text-[13px] text-ink-2">{done ? uz.sell.ai.wait : ms.sell.aiSub}</p>
      </div>
      {error && <ErrorState compact className="mt-4" hint={error} onRetry={() => { ran.current = false; setError(null); setSteps(null); setLit(0) }} />}
      <ol className="m-0 mt-6 flex list-none flex-col gap-1 p-0" aria-live="polite">
        {(steps ?? Array.from({ length: 6 }, () => null)).map((s, i) => {
          const on = i < lit
          const active = i === lit && !done
          return (
            <li key={i} className={cn('flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors', on ? 'bg-card shadow-soft' : 'opacity-60')}>
              <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full', on ? (s?.ok ? 'bg-green text-white' : 'bg-brick-soft text-brick') : 'border-[1.5px] border-line-strong text-ink-3')}>
                {on ? (s?.ok ? <Check size={14} strokeWidth={2.5} /> : <TriangleAlert size={13} strokeWidth={2} />) : active ? <LoaderCircle size={14} className={reduce ? '' : 'animate-spin'} /> : null}
              </span>
              <span className={cn('text-[14px] leading-snug', on ? 'text-ink' : 'text-ink-3')}>{s ? (on || active ? s.text : '…') : uz.app.loading}</span>
            </li>
          )
        })}
      </ol>

      <AnimatePresence>
        {done && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="mt-6">
            <div className="eyebrow">{ms.sell.specs}</div>
            <p className="m-0 mb-2 text-[12px] text-ink-3">{ms.sell.specsHint}</p>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => edit === c.key ? (
                <form key={c.key} onSubmit={(e) => { e.preventDefault(); void saveChip() }} className="flex items-center gap-1">
                  <Input value={val} onChange={(e) => setVal(e.target.value)} size="sm" autoFocus onBlur={() => void saveChip()} className="w-[150px]" aria-label={c.label} />
                </form>
              ) : (
                <button key={c.key} type="button" onClick={() => { if (c.key !== 'condition') { setEdit(c.key); setVal(c.value === '—' ? '' : c.value) } }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-[13px] shadow-soft">
                  <span className="text-ink-3">{c.label}:</span><span className="font-medium">{c.value}</span>{c.key !== 'condition' && <Pencil size={12} className="text-ink-3" strokeWidth={1.75} />}
                </button>
              ))}
            </div>
            <div data-testid={TID.mSellAiDone} className="mt-6 rounded-card bg-green-soft px-4 py-3">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-green"><Check size={18} strokeWidth={2} />{uz.sell.ai.done}</div>
              <div className="mt-0.5 text-[13px] text-ink-2">{uz.sell.ai.wait} · <Badge tone="neutral" size="sm">{uz.listing.status[listing.status]}</Badge></div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </Screen>
  )
}
