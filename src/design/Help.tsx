/**
 * «?» yordam paneli — har ekran sarlavhasi yonida: bu ekran nima uchun · 3 qadamda qanday ishlatiladi · klaviatura.
 * Birinchi marta ko'rgan odam hech kimdan so'ramasdan tushunishi uchun.
 */
import * as Popover from '@radix-ui/react-popover'
import { CircleHelp, Keyboard, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HelpContent {
  /** bir gaplik izoh (sarlavha ostida ham ko'rinadi) */
  sub: string
  /** bu ekran nima uchun */
  what: string
  /** 3 qadam */
  steps: string[]
  /** klaviatura yorliqlari, masalan "J/K — keyingi/oldingi" */
  keys?: string[]
}

export function HelpPopover({ title, help, className, container, size = 'md' }: { title: string; help: HelpContent; className?: string; container?: HTMLElement | null; size?: 'sm' | 'md' }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${title}: yordam`}
          title="Bu ekran nima uchun?"
          className={cn('inline-flex shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-gold-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-gold-fill', size === 'sm' ? 'h-7 w-7' : 'h-8 w-8', className)}
        >
          <CircleHelp size={size === 'sm' ? 16 : 18} strokeWidth={1.9} />
        </button>
      </Popover.Trigger>
      <Popover.Portal container={container ?? undefined}>
        <Popover.Content align="start" sideOffset={8} collisionPadding={12} className="z-[90] w-[min(360px,calc(100vw-24px))] rounded-[16px] border border-line bg-card p-4 text-ink shadow-soft outline-none">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="eyebrow !text-gold">Bu ekran nima uchun</div>
              <div className="mt-1 font-display text-[16px] leading-tight">{title}</div>
            </div>
            <Popover.Close asChild>
              <button type="button" aria-label="Yopish" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink"><X size={16} /></button>
            </Popover.Close>
          </div>
          <p className="m-0 mt-2 text-[13.5px] leading-snug text-ink-2">{help.what}</p>
          <div className="eyebrow mt-3">3 qadamda</div>
          <ol className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
            {help.steps.map((st, i) => (
              <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug text-ink">
                <span className="tnum mt-[1px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-fill text-[11.5px] font-bold text-ink">{i + 1}</span>
                <span>{st}</span>
              </li>
            ))}
          </ol>
          {help.keys && help.keys.length > 0 && (
            <div className="mt-3 rounded-[10px] bg-paper px-3 py-2 text-[12.5px] text-ink-2">
              <div className="flex items-center gap-1.5 font-semibold text-ink"><Keyboard size={14} strokeWidth={1.9} />Klaviatura</div>
              <ul className="m-0 mt-1 list-none p-0">{help.keys.map((k) => <li key={k} className="tnum">{k}</li>)}</ul>
            </div>
          )}
          <Popover.Arrow className="fill-card" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
