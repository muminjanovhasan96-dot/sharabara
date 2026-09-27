import { createContext, useContext, useEffect, useState } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn, SPRING } from '@/lib/utils'
import { Seal } from './Seal'
import { pushStore, usePushes } from './Toast'

export const PHONE_W = 390
export const PHONE_H = 844
const BEZEL = 12
const STATUS_H = 54
const HOME_H = 34

const PhoneContainerCtx = createContext<HTMLElement | null>(null)

/** The phone screen element (portal target for sheets/toasts) or null when outside a PhoneFrame. */
export function usePhoneContainer(): HTMLElement | null {
  return useContext(PhoneContainerCtx)
}

/* ─── status bar glyphs ──────────────────────────────────────────────── */
function SignalIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="0.8" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
      <rect x="10" y="3" width="3" height="9" rx="0.8" />
      <rect x="15" y="0" width="3" height="12" rx="0.8" />
    </svg>
  )
}
function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M1 4.2a10.5 10.5 0 0 1 14 0" />
      <path d="M3.6 6.9a6.6 6.6 0 0 1 8.8 0" />
      <path d="M6.2 9.5a2.8 2.8 0 0 1 3.6 0" />
    </svg>
  )
}
function BatteryIcon({ level = 0.82 }: { level?: number }) {
  const w = Math.max(1, Math.round(19 * level))
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
      <rect x="0.75" y="0.75" width="22" height="10.5" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />
      <rect x="24.3" y="3.8" width="1.5" height="4.4" rx="0.75" fill="currentColor" fillOpacity="0.45" />
      <rect x="2.25" y="2.25" width={w} height="7.5" rx="1.8" fill="currentColor" />
    </svg>
  )
}

export function StatusBar({ time, className, dark }: { time: string; className?: string; dark?: boolean }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-x-0 top-0 z-40 flex items-end justify-between px-7 pb-2 text-[15px] font-semibold', dark ? 'text-paper' : 'text-ink', className)}
      style={{ height: STATUS_H }}
      aria-hidden="true"
    >
      <span className="tnum w-14 leading-none tracking-[-0.01em]">{time}</span>
      <span className="flex items-center gap-1.5">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </span>
    </div>
  )
}

/* ─── DynamicIslandPush ──────────────────────────────────────────────── */
const ISLAND = { w: 124, h: 36, top: 11 }

/** Expands the newest push out of the Dynamic Island; consumes pushStore. Render inside PhoneFrame. */
export function DynamicIslandPush({ className }: { className?: string }) {
  const items = usePushes()
  const reduce = useReducedMotion()
  const item = items[items.length - 1]
  useEffect(() => {
    if (!item || item.duration <= 0) return
    const t = setTimeout(() => pushStore.remove(item.id), item.duration)
    return () => clearTimeout(t)
  }, [item])
  return (
    <div className="pointer-events-none absolute inset-x-0 z-[65] flex justify-center" style={{ top: ISLAND.top }}>
      <motion.div
        layout={!reduce}
        transition={reduce ? { duration: 0.15 } : SPRING}
        className={cn('pointer-events-auto overflow-hidden text-paper', className)}
        style={{ background: '#0b0f14', borderRadius: item ? 26 : ISLAND.h / 2 }}
        animate={{ width: item ? PHONE_W - 24 : ISLAND.w, minHeight: ISLAND.h }}
        initial={false}
        role={item ? 'status' : undefined}
        onClick={() => { if (item) { item.onClick?.(); pushStore.remove(item.id) } }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {item && (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, delay: reduce ? 0 : 0.08 }}
              className="flex cursor-pointer items-start gap-3 px-3 py-3"
            >
              <Seal size={40} variant="gold" icon={item.icon} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="eyebrow truncate !text-[10px] !text-paper/70">{item.app}</span>
                  <span className="shrink-0 text-[11px] text-paper/60">{item.time}</span>
                </div>
                <div className="mt-0.5 truncate text-[14px] font-semibold leading-tight">{item.title}</div>
                {item.body && <div className="clamp-2 text-[13px] leading-snug text-paper/80">{item.body}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ─── PhoneFrame ─────────────────────────────────────────────────────── */
export interface PhoneFrameProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** status bar clock text, e.g. "17:00" */
  time?: string
  /** CSS scale to fit the frame in its slot; layout box shrinks accordingly */
  scale?: number
  /** `bare` renders full-screen content without bezel (real mobile / PWA) */
  variant?: 'frame' | 'bare'
  /** "dark" | "light" — sets data-theme on the screen so the phone can be themed independently */
  theme?: 'light' | 'dark'
  /** content ignores the status bar / home indicator padding */
  bleed?: boolean
  /** render DynamicIslandPush + status bar (default true in frame) */
  chrome?: boolean
  children?: ReactNode
  screenClassName?: string
}

/**
 * iPhone-like frame, 390x844 logical. The screen element (`#phone-screen`, position:relative,
 * overflow:hidden) is provided via context so BottomSheet/Modal/Toaster portal into it.
 */
export function PhoneFrame({
  time = '9:41', scale = 1, variant = 'frame', theme, bleed = false, chrome = true, children, className, screenClassName, style, ...rest
}: PhoneFrameProps) {
  const [screen, setScreen] = useState<HTMLElement | null>(null)
  const content = (
    <div
      className={cn('scroll-thin absolute inset-0 overflow-y-auto overflow-x-hidden', screenClassName)}
      style={variant === 'frame' && !bleed ? { paddingTop: STATUS_H, paddingBottom: HOME_H } : undefined}
    >
      {children}
    </div>
  )

  if (variant === 'bare') {
    return (
      <PhoneContainerCtx.Provider value={screen}>
        <div
          id="phone-screen"
          ref={setScreen}
          data-theme={theme}
          className={cn('relative h-full w-full overflow-hidden bg-paper text-ink', className)}
          style={style}
          {...rest}
        >
          {content}
        </div>
      </PhoneContainerCtx.Provider>
    )
  }

  const outerW = PHONE_W + BEZEL * 2
  const outerH = PHONE_H + BEZEL * 2
  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: outerW * scale, height: outerH * scale, ...style }}
      {...rest}
    >
      <div
        className="absolute left-0 top-0 rounded-[54px] shadow-[0_30px_80px_-30px_rgba(0,0,0,.55),0_0_0_1px_rgba(255,255,255,.06)_inset]"
        style={{ width: outerW, height: outerH, transform: `scale(${scale})`, transformOrigin: 'top left', background: '#0f151d', padding: BEZEL }}
      >
        {/* side buttons */}
        <span aria-hidden="true" className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[#1f2934]" />
        <span aria-hidden="true" className="absolute -left-[3px] top-[170px] h-14 w-[3px] rounded-l bg-[#1f2934]" />
        <span aria-hidden="true" className="absolute -left-[3px] top-[236px] h-14 w-[3px] rounded-l bg-[#1f2934]" />
        <span aria-hidden="true" className="absolute -right-[3px] top-[190px] h-20 w-[3px] rounded-r bg-[#1f2934]" />
        <PhoneContainerCtx.Provider value={screen}>
          <div
            id="phone-screen"
            ref={setScreen}
            data-theme={theme}
            className="relative h-full w-full overflow-hidden rounded-[44px] bg-paper text-ink"
            style={{ width: PHONE_W, height: PHONE_H }}
          >
            {content}
            {chrome && (
              <>
                <StatusBar time={time} dark={theme === 'dark'} />
                {/* Dynamic Island (static pill under the push layer) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 z-[45] -translate-x-1/2 rounded-full"
                  style={{ top: ISLAND.top, width: ISLAND.w, height: ISLAND.h, background: '#0b0f14' }}
                />
                <DynamicIslandPush />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2 left-1/2 z-40 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink/80"
                />
              </>
            )}
          </div>
        </PhoneContainerCtx.Provider>
      </div>
    </div>
  )
}
