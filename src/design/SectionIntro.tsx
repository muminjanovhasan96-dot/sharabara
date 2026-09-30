/**
 * «Bu bo'lim nima qiladi» — har bo'lim tepasida yig'iladigan izoh kartasi:
 * bir gaplik izoh doim ko'rinadi, «Qanday ishlaydi» bosilsa — nima uchun + 3 qadam + klaviatura.
 * Telefonda birinchi ochilishda yoyilgan, keyin holati localStorage'da saqlanadi.
 */
import { useState } from 'react'
import { ChevronDown, CircleHelp, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HelpContent } from './Help'

const KEY = 'sb-intro-open'
function readOpen(id: string, def: boolean): boolean {
  try { const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>; return raw[id] ?? def } catch { return def }
}
function writeOpen(id: string, v: boolean) {
  try { const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>; raw[id] = v; localStorage.setItem(KEY, JSON.stringify(raw)) } catch { /* noop */ }
}

export function SectionIntro({ id, title, help, defaultOpen = false, className, compact = false }: { id: string; title: string; help: HelpContent; defaultOpen?: boolean; className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(() => readOpen(id, defaultOpen))
  const toggle = () => setOpen((v) => { writeOpen(id, !v); return !v })
  return (
    <section aria-label={`${title}: ${help.sub}`} className={cn('rounded-[14px] border border-line bg-card shadow-soft', className)}>
      <button type="button" onClick={toggle} aria-expanded={open} className={cn('flex w-full items-center gap-3 text-left', compact ? 'px-3 py-2' : 'px-4 py-2.5')}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[#8a6400]"><CircleHelp size={17} strokeWidth={2} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold leading-tight text-ink">{open ? 'Bu bo’lim nima qiladi' : help.sub}</span>
          {!open && <span className="mt-0.5 block text-[12px] text-blue">Qanday ishlaydi?</span>}
        </span>
        <ChevronDown size={18} strokeWidth={2} className={cn('shrink-0 text-ink-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className={cn('border-t border-line', compact ? 'px-3 pb-3 pt-2.5' : 'px-4 pb-4 pt-3')}>
          <p className="m-0 text-[14px] leading-snug text-ink-2">{help.what}</p>
          <div className="eyebrow mt-3">Qanday ishlaydi · 3 qadam</div>
          <ol className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
            {help.steps.map((st, i) => (
              <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-ink">
                <span className="tnum mt-[1px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-fill text-[11.5px] font-bold text-ink">{i + 1}</span>
                <span>{st}</span>
              </li>
            ))}
          </ol>
          {/* klaviatura yorliqlari faqat kompyuterda (compact = telefon qobig'i) */}
          {!compact && help.keys && help.keys.length > 0 && (
            <div className="mt-3 rounded-[10px] bg-paper px-3 py-2 text-[12.5px] text-ink-2">
              <div className="flex items-center gap-1.5 font-semibold text-ink"><Keyboard size={14} strokeWidth={1.9} />Klaviatura</div>
              <ul className="m-0 mt-1 list-none p-0">{help.keys.map((k) => <li key={k} className="tnum">{k}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
