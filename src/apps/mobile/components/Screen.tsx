import { createContext, forwardRef, useContext, useEffect, type ReactNode, type UIEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppNavigate } from '@/lib/router'
import { ms } from '../strings'
import { useKeyboardOffset } from '../lib'

/** Shell provides a setter; Screen reports whether it renders a sticky bottom bar (TabBar flattens its raised seal then). */
export const BottomBarCtx = createContext<{ has: boolean; set: (v: boolean) => void }>({ has: false, set: () => {} })

export interface ScreenProps {
  title?: ReactNode
  eyebrow?: ReactNode
  back?: boolean
  /** back target when history is empty */
  backTo?: string
  right?: ReactNode
  /** replaces the default header entirely */
  header?: ReactNode
  /** ink header (Mall/Store) */
  tone?: 'paper' | 'ink'
  /** sticky bottom bar (CTA) */
  bottom?: ReactNode
  /** no horizontal padding */
  bleed?: boolean
  className?: string
  bodyClassName?: string
  children?: ReactNode
  onScroll?: (e: UIEvent<HTMLDivElement>) => void
  /** extra bottom padding for the tab bar */
  withTabBar?: boolean
}

/**
 * One screen = header + scrollable body + optional sticky bottom CTA.
 * The screen itself is absolutely positioned by the router shell so push/pop can overlap.
 */
export const Screen = forwardRef<HTMLDivElement, ScreenProps>(function Screen(
  { title, eyebrow, back, backTo = '/', right, header, tone = 'paper', bottom, bleed, className, bodyClassName, children, onScroll, withTabBar },
  ref,
) {
  const nav = useNavigate()
  const appNav = useAppNavigate()
  const kb = useKeyboardOffset()
  const goBack = () => { if (window.history.length > 1) nav(-1); else appNav(backTo) }
  const bottomCtx = useContext(BottomBarCtx)
  const hasBottom = Boolean(bottom)
  useEffect(() => { bottomCtx.set(hasBottom); return () => bottomCtx.set(false) }, [hasBottom]) // eslint-disable-line react-hooks/exhaustive-deps
  const ink = tone === 'ink'
  return (
    <div className={cn('flex h-full flex-col', className)}>
      {header !== undefined ? header : (title || back || right) ? (
        <header className={cn('pt-safe z-10 flex shrink-0 items-center gap-1 border-b px-2', ink ? 'border-transparent bg-ink text-white' : 'border-line bg-card text-ink')}>
          <div className="flex h-[52px] w-full items-center gap-1">
            {back ? (
              <button type="button" onClick={goBack} aria-label={ms.common.back} className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full', ink ? 'hover:bg-white/10' : 'hover:bg-paper-2')}>
                <ChevronLeft size={24} strokeWidth={1.75} />
              </button>
            ) : <span className="w-2" />}
            <div className="min-w-0 flex-1">
              {eyebrow && <div className={cn('eyebrow !text-[10px]', ink && '!text-white/70')}>{eyebrow}</div>}
              {title && <h1 className="clamp-1 m-0 font-display text-[17px] font-bold leading-tight tracking-[-0.01em]">{title}</h1>}
            </div>
            {right && <div className="flex shrink-0 items-center gap-0.5 pr-1">{right}</div>}
          </div>
        </header>
      ) : null}
      <div
        ref={ref}
        onScroll={onScroll}
        className={cn('scroll-thin relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden', !bleed && 'px-4', withTabBar ? 'pb-6' : 'pb-4', bodyClassName)}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
        {bottom && <div className="h-[84px]" aria-hidden="true" />}
      </div>
      {bottom && (
        <div
          className="pb-safe z-10 shrink-0 border-t border-line bg-card px-4 pt-3 shadow-[0_-8px_24px_-16px_rgba(15,31,58,.25)]"
          style={{ paddingBottom: `calc(12px + env(safe-area-inset-bottom) + ${kb}px)` }}
        >
          {bottom}
        </div>
      )}
    </div>
  )
})

export function SectionTitle({ children, action, onAction, className, eyebrow, sub }: { children: ReactNode; action?: ReactNode; onAction?: () => void; className?: string; eyebrow?: ReactNode; sub?: ReactNode }) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>}
        <h2 className="m-0 font-display text-[20px] font-bold leading-tight tracking-[-0.02em] text-ink">{children}</h2>
        {sub && <div className="mt-0.5 text-[12.5px] text-ink-3">{sub}</div>}
      </div>
      {action && (
        <button type="button" onClick={onAction} className="-mr-1 inline-flex h-8 shrink-0 items-center gap-0.5 rounded-full pl-2 pr-1 text-[13.5px] font-semibold text-blue active:bg-blue-soft">
          {action}<ChevronRight size={16} strokeWidth={2.25} />
        </button>
      )}
    </div>
  )
}

export function Row({ icon, label, sub, right, onClick, danger, testId }: { icon?: ReactNode; label: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; danger?: boolean; testId?: string }) {
  const Cmp = onClick ? 'button' : 'div'
  return (
    <Cmp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      data-testid={testId}
      className={cn('flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left', onClick && 'active:bg-paper-2', danger && 'text-brick')}
    >
      {icon && <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] [&>svg]:h-[18px] [&>svg]:w-[18px]', danger ? 'bg-brick-soft text-brick' : 'bg-blue-soft text-blue')}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-snug">{label}</span>
        {sub && <span className="block text-[12.5px] leading-snug text-ink-3">{sub}</span>}
      </span>
      {right !== undefined ? <span className="shrink-0 text-ink-3">{right}</span> : onClick ? <ChevronLeft size={18} className="shrink-0 rotate-180 text-ink-3" strokeWidth={1.75} /> : null}
    </Cmp>
  )
}
