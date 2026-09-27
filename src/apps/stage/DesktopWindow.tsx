/**
 * «Xodim kompyuteri» — brauzer oynasi ko'rinishi: sarlavha qatori (manzil, kim kirgan) va ekran.
 * Ekran ichidagi ilova kamida MIN_LOGICAL_W px kenglikda chiziladi va oynaga sig'ishi uchun CSS transform bilan
 * kichraytiriladi — shunda admin paneli tor ekranda ham «siqilib» ketmaydi, to'liq menyu va 5 ta KPI ko'rinadi.
 */
import { forwardRef, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Lock, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Ilova o'zini shu kenglikda deb biladi (admin/partner to'liq menyu chegarasi 1100). */
export const MIN_LOGICAL_W = 1160

export function useSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, size }
}

export interface DesktopWindowProps {
  /** brauzer manzili (faqat ko'rinish uchun) */
  host: string
  /** oynaning nomi, masalan «Admin panel» */
  title: string
  ring?: boolean
  children: ReactNode
  className?: string
  'data-testid'?: string
}

export const DesktopWindow = forwardRef<HTMLDivElement, DesktopWindowProps>(function DesktopWindow({ host, title, ring, children, className, ...rest }, ref) {
  const { ref: screenRef, size } = useSize<HTMLDivElement>()
  const geom = useMemo(() => {
    if (!size.w || !size.h) return { w: MIN_LOGICAL_W, h: 700, s: 1 }
    const w = Math.max(size.w, MIN_LOGICAL_W)
    const s = size.w / w
    return { w, h: Math.round(size.h / s), s }
  }, [size])

  return (
    <div
      ref={ref}
      data-testid={rest['data-testid']}
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-line bg-card shadow-[0_24px_60px_-28px_rgba(15,31,58,.45)] transition-shadow duration-300',
        ring && 'ring-[3px] ring-gold-fill/90 ring-offset-4 ring-offset-paper',
        className,
      )}
    >
      {/* title bar */}
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-line bg-paper-2/70 px-3" aria-hidden="true">
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto flex h-7 min-w-0 max-w-[380px] flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-card px-3 text-[12px] text-ink-2 shadow-[0_0_0_1px_var(--line)]">
          <Lock size={11} strokeWidth={2} className="shrink-0 text-ink-3" />
          <span className="truncate"><span className="text-ink-3">https://</span>{host}</span>
        </span>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-[7px] bg-card px-2 py-1 text-[11.5px] font-medium text-ink-2 shadow-[0_0_0_1px_var(--line)] sm:flex">
          <Monitor size={12} strokeWidth={2} className="text-ink-3" />{title}
        </span>
      </div>
      {/* screen */}
      <div ref={screenRef} className="relative min-h-0 flex-1 overflow-hidden bg-paper">
        <div
          className="absolute left-0 top-0"
          style={{ width: geom.w, height: geom.h, transform: `scale(${geom.s})`, transformOrigin: '0 0' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
})
