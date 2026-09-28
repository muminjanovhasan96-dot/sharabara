/**
 * /hikoya — taqdimot rejimi: har lahzada faqat BITTA ekran (telefon yoki kompyuter), tepasida uch qator:
 * kim · nima bo’lyapti · Sharabara uchun nima uchun muhim. Taqdimotchi «Keyingi» bilan boshqaradi (yoki avtopilot).
 * Ikki ekran yonma-yon turgan /stage — «ekspert rejimi».
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link, MemoryRouter } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, LayoutPanelLeft, Monitor, Pause, Play, Smartphone, Sparkles, X } from 'lucide-react'
import { api, bus, setFastMode } from '@/api'
import { useStore } from '@/store'
import { parseIso, formatDemoTime } from '@/domain/clock'
import { AppBase, type AppKey, stageNav } from '@/lib/router'
import { cn, SPRING } from '@/lib/utils'
import { uz, t } from '@/i18n/uz'
import { Avatar, PhoneFrame, PHONE_H, Seal, Segmented } from '@/design'
import { AppBoundary } from '../stage/AppBoundary'
import { RouterIsland } from '../stage/RouterIsland'
import { DesktopWindow, useSize } from '../stage/DesktopWindow'
import { GoldenOverlay } from '../stage/GoldenOverlay'
import { GOLDEN_STEPS, goldenIsFresh, goldenRunner, useGolden } from '../stage/golden'
import { desktopFor, roleLabel, type DesktopApp } from '../stage/roles'
import { stageToast, StageToasts } from '../stage/toasts'

type EmbeddedApp = ComponentType<{ embedded?: boolean }>
const MobileApp = lazy(() => import('@/apps/mobile/MobileApp') as Promise<{ default: EmbeddedApp }>)
const AdminApp = lazy(() => import('@/apps/admin/AdminApp') as Promise<{ default: EmbeddedApp }>)
const PartnerApp = lazy(() => import('@/apps/partner/PartnerApp') as Promise<{ default: EmbeddedApp }>)
const BtsApp = lazy(() => import('@/apps/bts/BtsApp') as Promise<{ default: EmbeddedApp }>)
const BEZEL = 12
const META: Record<DesktopApp, { host: string; title: string }> = {
  admin: { host: 'admin.sharabara.uz', title: 'Admin panel' },
  partner: { host: 'mall.sharabara.uz', title: 'Kompaniya kabineti' },
  bts: { host: 'bts.sharabara.uz', title: 'BTS hamkor paneli' },
}

function useNavTracker(app: AppKey) {
  const [nav, setNav] = useState({ path: '/', n: 0 })
  useEffect(() => stageNav.subscribe(app, (path) => setNav((s) => ({ path, n: s.n + 1 }))), [app])
  return nav
}
function Fallback() {
  return <div className="flex h-full w-full items-center justify-center bg-paper text-ink-3"><span className="skeleton h-10 w-10 rounded-full" /></div>
}
function Slot({ app, children }: { app: DesktopApp; children: React.ReactNode }) {
  const nav = useNavTracker(app)
  return (
    <div data-app={app} className="absolute inset-0 bg-paper">
      <RouterIsland><AppBoundary name={META[app].title} resetSignal={nav.n}><MemoryRouter initialEntries={[nav.path]}><AppBase base="" app={app} embedded><Suspense fallback={<Fallback />}>{children}</Suspense></AppBase></MemoryRouter></AppBoundary></RouterIsland>
    </div>
  )
}

const BTN = 'inline-flex h-10 items-center gap-1.5 rounded-[12px] border px-3.5 text-[14px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-fill disabled:opacity-40'
const BTN_SOLID = cn(BTN, 'border-line bg-card text-ink hover:bg-paper-2')
const BTN_GOLD = cn(BTN, 'border-transparent bg-gold-fill font-semibold text-ink shadow-[0_8px_18px_-8px_rgba(227,190,74,.8)] hover:brightness-[1.04]')

export default function StoryApp() {
  const g = useGolden()
  const reduce = useReducedMotion()
  const session = useStore((s) => s.session)
  const now = useStore((s) => s.clock.now)
  const phoneUser = useStore((s) => s.data.users.find((u) => u.id === s.session.userId))
  const staff = useStore((s) => s.data.staff.find((x) => x.id === s.session.staffId) ?? s.data.staff[0])
  const company = useStore((s) => s.data.companies.find((c) => c.id === s.session.companyId) ?? s.data.companies[0])
  const mobileNav = useNavTracker('mobile')
  const [desktop, setDesktop] = useState<DesktopApp>('admin')
  const [mounted, setMounted] = useState<Set<DesktopApp>>(() => new Set(['admin']))
  const [starting, setStarting] = useState(false)

  useEffect(() => { const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prev } }, [])
  useEffect(() => { setFastMode(false); return () => { setFastMode(false); goldenRunner.setManual(false) } }, [])
  useEffect(() => bus.on('clock', (p) => stageToast.show(p.label, formatDemoTime(p.now), { icon: 'clock-3', tone: 'gold' })), [])
  useEffect(() => useStore.subscribe((s) => s.session.role, (role) => { const d = desktopFor(role); if (d) { setDesktop(d); setMounted((m) => (m.has(d) ? m : new Set(m).add(d))) } }), [])

  const active = g.status === 'running' || g.status === 'paused' || g.status === 'error'
  const step = GOLDEN_STEPS[g.index]
  const pane = active ? g.pane : 'phone'

  const start = useCallback(async (manual: boolean) => {
    if (starting) return
    setStarting(true)
    try { if (!goldenIsFresh()) await api.demo.reset() } finally { setStarting(false) }
    goldenRunner.setManual(manual)
    void goldenRunner.start()
  }, [starting])

  // klaviatura: → Keyingi, ← Orqaga, Space pauza/davom
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable) return
      if (!active) return
      if (e.key === 'ArrowRight') { e.preventDefault(); goldenRunner.next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goldenRunner.prev() }
      else if (e.key === ' ') { e.preventDefault(); if (g.status === 'paused') goldenRunner.resume(); else goldenRunner.pause() }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [active, g.status])

  // qurilma o'lchami
  const { ref: slotRef, size: slot } = useSize<HTMLDivElement>()
  const phoneScale = useMemo(() => (slot.h ? Math.max(0.5, Math.min(1, (slot.h - 8) / (PHONE_H + BEZEL * 2))) : 0.9), [slot.h])
  const phoneTime = useMemo(() => { const d = parseIso(now); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` }, [now])
  const phoneRole = session.role === 'seller' ? roleLabel('seller') : session.role === 'buyer' ? roleLabel('buyer') : session.userId === 'u-seller' ? roleLabel('seller') : roleLabel('buyer')
  const desktopUser = desktop === 'admin' ? { name: staff.name, seed: staff.id, sub: roleLabel(staff.role) } : desktop === 'partner' ? { name: company.name, seed: company.id, sub: roleLabel('company') } : { name: 'BTS operatori', seed: 'bts', sub: roleLabel('bts') }

  useEffect(() => {
    goldenRunner.registerPane('phone', () => document.querySelector('[data-story-phone]')?.getBoundingClientRect() ?? null)
    goldenRunner.registerPane('desktop', () => document.querySelector('[data-story-desktop]')?.getBoundingClientRect() ?? null)
  }, [])

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-paper text-ink" data-story>
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-card px-4">
        <Link to="/" className="flex items-center gap-2 text-[13px] font-semibold text-ink-2 hover:text-ink"><X size={16} strokeWidth={2} />{uz.demo.storyExit}</Link>
        <div className="mx-auto flex items-center gap-2">
          {active && step && (
            <>
              <span className="eyebrow !text-gold">{t(uz.demo.step, { i: g.index + 1, n: g.total })}</span>
              <span className="flex items-center gap-1" aria-hidden="true">
                {GOLDEN_STEPS.map((s, i) => <motion.span key={s.id} className={cn('block h-1.5 rounded-full', i < g.index ? 'bg-gold-fill/60' : i === g.index ? 'bg-gold-fill' : 'bg-line-strong/60')} animate={{ width: i === g.index ? 18 : 6 }} transition={SPRING} />)}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <>
              <Segmented size="sm" aria-label={uz.demo.speed} value={String(g.speed)} onChange={(v) => goldenRunner.setSpeed(Number(v))} options={[{ value: '0.5', label: '0.5x' }, { value: '1', label: '1x' }, { value: '2', label: '2x' }]} className="hidden lg:inline-flex" />
              <button type="button" className={BTN_SOLID} title={g.manual ? uz.demo.storyAuto : uz.demo.storyManual} onClick={() => goldenRunner.setManual(!g.manual)}>
                {g.manual ? <Play size={15} strokeWidth={1.9} /> : <Pause size={15} strokeWidth={1.9} />}<span className="hidden xl:inline">{g.manual ? uz.demo.storyAuto : uz.demo.storyManual}</span>
              </button>
            </>
          )}
          <Link to="/stage" className={cn(BTN_SOLID, 'hidden md:inline-flex')} title={uz.demo.storyExpert}><LayoutPanelLeft size={15} strokeWidth={1.9} /><span className="hidden xl:inline">{uz.demo.storyExpert}</span></Link>
        </div>
      </header>

      {/* narration */}
      <div className="shrink-0 px-6 pt-4">
        <AnimatePresence mode="wait" initial={false}>
          {active && step ? (
            <motion.div key={step.id} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mx-auto grid max-w-[1240px] grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[12.5px] font-semibold text-paper">{pane === 'phone' ? <Smartphone size={13} /> : <Monitor size={13} />}{step.who}</span>
                  <span className="text-[12.5px] text-ink-3">{pane === 'phone' ? uz.demo.onPhone : uz.demo.onDesktop}</span>
                </div>
                <h1 className="m-0 mt-1.5 font-display text-[26px] leading-tight text-ink lg:text-[30px]">{step.title}</h1>
                <p className="m-0 mt-1.5 max-w-[720px] text-[15px] leading-snug text-ink-2">{g.status === 'error' ? `${uz.app.error}: ${g.error}` : step.caption}</p>
              </div>
              <div className="rounded-[14px] border border-gold/40 bg-gold-soft px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold"><Sparkles size={13} strokeWidth={2} />{uz.demo.storyWhy}</div>
                <p className="m-0 mt-1 text-[13.5px] leading-snug text-ink">{step.why}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-[1240px]">
              <div className="eyebrow !text-gold">{uz.demo.story}</div>
              <h1 className="m-0 mt-1 font-display text-[30px] leading-tight text-ink">{uz.demo.storyTitle}</h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* device area */}
      <div className="relative min-h-0 flex-1 px-6 pb-4 pt-3">
        <div className="mx-auto flex h-full max-w-[1240px] flex-col">
          <div className="flex h-8 shrink-0 items-center gap-2 text-[12px] text-ink-2">
            {pane === 'phone' ? (
              <><span className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] text-ink-3"><Smartphone size={13} strokeWidth={2} />{t(uz.demo.storyPhoneOf, { r: phoneRole })}</span>{phoneUser && <span className="ml-auto flex items-center gap-1.5"><Avatar name={phoneUser.name} seed={phoneUser.id} size={28} /><span className="font-medium text-ink">{phoneUser.name}</span></span>}</>
            ) : (
              <><span className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] text-ink-3"><Monitor size={13} strokeWidth={2} />{t(uz.demo.storyDesktopOf, { r: desktopUser.sub })}</span><span className="ml-auto flex items-center gap-1.5"><Avatar name={desktopUser.name} seed={desktopUser.seed} size={28} /><span className="font-medium text-ink">{desktopUser.name}</span></span></>
            )}
          </div>
          <div ref={slotRef} className="relative min-h-0 flex-1">
            <div className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-300', pane === 'phone' ? 'opacity-100' : 'pointer-events-none opacity-0')} aria-hidden={pane !== 'phone'}>
              <div data-story-phone className={cn('relative transition-shadow', active && pane === 'phone' && 'ring-[3px] ring-gold-fill/80 ring-offset-4 ring-offset-paper')} style={{ borderRadius: 54 * phoneScale }}>
                <PhoneFrame time={phoneTime} scale={phoneScale} theme={session.theme}>
                  <RouterIsland><AppBoundary name={uz.demo.phonePane} resetSignal={mobileNav.n}><MemoryRouter initialEntries={[mobileNav.path]}><AppBase base="" app="mobile" embedded><Suspense fallback={<Fallback />}><MobileApp embedded /></Suspense></AppBase></MemoryRouter></AppBoundary></RouterIsland>
                </PhoneFrame>
              </div>
            </div>
            <div className={cn('absolute inset-0 flex flex-col transition-opacity duration-300', pane === 'desktop' ? 'opacity-100' : 'pointer-events-none opacity-0')} aria-hidden={pane !== 'desktop'}>
              <DesktopWindow data-testid="story-desktop" host={META[desktop].host} title={META[desktop].title} ring={active && pane === 'desktop'}>
                <div data-story-desktop className="absolute inset-0">
                  {(['admin', 'partner', 'bts'] as DesktopApp[]).filter((a) => mounted.has(a)).map((app) => (
                    <div key={app} className={cn('absolute inset-0', desktop === app ? 'visible' : 'invisible')}>
                      <Slot app={app}>{app === 'admin' ? <AdminApp embedded /> : app === 'partner' ? <PartnerApp embedded /> : <BtsApp embedded />}</Slot>
                    </div>
                  ))}
                </div>
              </DesktopWindow>
            </div>
            {!active && g.status !== 'done' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/80 backdrop-blur-[2px]">
                <div className="w-[min(680px,92%)] rounded-[22px] border border-line bg-card p-6 shadow-soft">
                  <p className="m-0 text-[15px] leading-relaxed text-ink-2">{uz.demo.storyLead}</p>
                  <ul className="m-0 mt-4 grid list-none gap-2 p-0 sm:grid-cols-3">
                    {uz.demo.storyCharacters.map((c) => (
                      <li key={c.name} className="rounded-[14px] bg-paper px-3 py-2.5">
                        <div className="flex items-center gap-2"><Avatar name={c.name} seed={c.name} size={28} /><span className="min-w-0"><span className="block truncate text-[13px] font-semibold">{c.name}</span><span className="block text-[11px] text-ink-3">{c.role}</span></span></div>
                        <p className="m-0 mt-1.5 text-[12.5px] leading-snug text-ink-2">{c.text}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button type="button" className={cn(BTN_GOLD, 'h-11 px-5')} disabled={starting} onClick={() => start(true)} data-testid="story-start"><Sparkles size={16} strokeWidth={2} />{uz.demo.storyStart}</button>
                    <button type="button" className={cn(BTN_SOLID, 'h-11')} disabled={starting} onClick={() => start(false)}><Play size={15} strokeWidth={1.9} />{uz.demo.storyAuto}</button>
                    <span className="ml-auto text-[12px] text-ink-3">{uz.demo.storyNextHint}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {active && (
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-t border-line bg-card px-6">
          <div className="flex items-center gap-2 text-[12.5px] text-ink-3"><Seal size={28} variant="gold" icon={pane === 'phone' ? 'smartphone' : 'monitor'} />{g.manual && g.status === 'paused' ? uz.demo.storyReady : g.status === 'running' ? uz.demo.storyRunning : uz.demo.storyNextHint}</div>
          <div className="flex items-center gap-2">
            <button type="button" className={BTN_SOLID} disabled={g.index === 0 || g.status === 'error'} onClick={() => goldenRunner.prev()}><ChevronLeft size={16} strokeWidth={2} />{uz.demo.back}</button>
            <button type="button" className={cn(BTN_GOLD, 'h-11 px-5', g.manual && g.status === 'paused' && 'animate-pulse')} disabled={g.status === 'error'} onClick={() => goldenRunner.next()} data-testid="story-next">{uz.demo.next}<ChevronRight size={16} strokeWidth={2} /></button>
          </div>
        </div>
      )}

      <GoldenOverlay onRestart={() => start(g.manual)} />
      <StageToasts />
    </div>
  )
}
