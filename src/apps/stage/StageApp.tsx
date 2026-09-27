/**
 * /stage — Demo sahnasi: chapda mijoz telefoni (MobileApp), o'ngda xodim kompyuteri (Admin / Kompaniya / BTS)
 * brauzer oynasi ko'rinishida, pastda izoh paneli. Ikkalasi bitta store'da yashaydi; bus hodisalari ekranlar
 * orasida «ping» bo'lib ko'rinadi.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { Monitor, Smartphone } from 'lucide-react'
import { api, bus, setFastMode } from '@/api'
import { useStore } from '@/store'
import { parseIso, formatDemoTime } from '@/domain/clock'
import { AppBase, stageNav, type AppKey } from '@/lib/router'
import { TID } from '@/lib/testids'
import { cn } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { Avatar, ConfirmDialog, PhoneFrame, PHONE_H, PHONE_W } from '@/design'
import { DemoPanel } from './DemoPanel'
import { GoldenOverlay } from './GoldenOverlay'
import { NarrationBar } from './NarrationBar'
import { DesktopWindow, useSize } from './DesktopWindow'
import { AppBoundary } from './AppBoundary'
import { centerOf, PingLayer, usePings } from './PingLayer'
import { RouterIsland } from './RouterIsland'
import { goldenIsFresh, goldenRunner, useGolden } from './golden'
import { desktopFor, roleLabel, type DesktopApp, type StagePane } from './roles'
import { stageToast, StageToasts } from './toasts'

type EmbeddedApp = ComponentType<{ embedded?: boolean }>
const MobileApp = lazy(() => import('@/apps/mobile/MobileApp') as Promise<{ default: EmbeddedApp }>)
const AdminApp = lazy(() => import('@/apps/admin/AdminApp') as Promise<{ default: EmbeddedApp }>)
const PartnerApp = lazy(() => import('@/apps/partner/PartnerApp') as Promise<{ default: EmbeddedApp }>)
const BtsApp = lazy(() => import('@/apps/bts/BtsApp') as Promise<{ default: EmbeddedApp }>)

const BEZEL = 12
const DESKTOP_APPS: DesktopApp[] = ['admin', 'partner', 'bts']
const DESKTOP_META: Record<DesktopApp, { host: string; title: string }> = {
  admin: { host: 'admin.sharabara.uz', title: 'Admin panel' },
  partner: { host: 'mall.sharabara.uz', title: 'Kompaniya kabineti' },
  bts: { host: 'bts.sharabara.uz', title: 'BTS hamkor paneli' },
}

function AppFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-paper text-ink-3" aria-busy="true">
      <div className="flex flex-col items-center gap-2">
        <span className="skeleton h-10 w-10 rounded-full" />
        <span className="text-[13px]">{uz.app.loading}</span>
      </div>
    </div>
  )
}

/** Tracks the last path the stage pushed to an app, so a remount (after a crash) lands on it. */
function useStageNavTracker(app: AppKey) {
  const [nav, setNav] = useState({ path: '/', n: 0 })
  useEffect(() => stageNav.subscribe(app, (path) => setNav((s) => ({ path, n: s.n + 1 }))), [app])
  return nav
}

function DesktopSlot({ app, active, children }: { app: DesktopApp; active: boolean; children: React.ReactNode }) {
  const nav = useStageNavTracker(app)
  return (
    <div
      data-app={app}
      aria-hidden={!active}
      className={cn(
        'absolute inset-0 overflow-hidden bg-paper transition-[opacity,visibility] duration-300 ease-out',
        active ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0',
      )}
    >
      <RouterIsland>
        <AppBoundary name={DESKTOP_META[app].title} resetSignal={nav.n}>
          <MemoryRouter initialEntries={[nav.path]}>
            <AppBase base="" app={app} embedded>
              <Suspense fallback={<AppFallback />}>{children}</Suspense>
            </AppBase>
          </MemoryRouter>
        </AppBoundary>
      </RouterIsland>
    </div>
  )
}

/** Ekran ustidagi kichik yorliq: qaysi ilova, kim kirgan. */
function PaneLabel({ icon, title, name, seed, sub, compact = false }: { icon: React.ReactNode; title: string; name?: string; seed?: string; sub?: string; compact?: boolean }) {
  return (
    <div className="flex h-8 w-full shrink-0 items-center gap-2 overflow-hidden px-1 text-[12px] text-ink-2">
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-semibold uppercase tracking-[0.08em] text-ink-3" title={title}>{icon}{!compact && title}</span>
      {name && (
        <span className="ml-auto flex min-w-0 items-center gap-1.5">
          <Avatar name={name} seed={seed ?? name} size={28} />
          <span className="truncate font-medium text-ink">{name}</span>
          {sub && <span className="shrink-0 whitespace-nowrap text-ink-3">· {sub}</span>}
        </span>
      )}
    </div>
  )
}

export default function StageApp() {
  const location = useLocation()
  const fastParam = useMemo(() => new URLSearchParams(location.search).get('fast') === '1', [location.search])
  const [fast, setFast] = useState(fastParam)
  const session = useStore((s) => s.session)
  const now = useStore((s) => s.clock.now)
  const phoneUser = useStore((s) => s.data.users.find((u) => u.id === s.session.userId))
  const staff = useStore((s) => s.data.staff.find((x) => x.id === s.session.staffId) ?? s.data.staff[0])
  const company = useStore((s) => s.data.companies.find((c) => c.id === s.session.companyId) ?? s.data.companies[0])
  const golden = useGolden()
  const mobileNav = useStageNavTracker('mobile')

  // body: no scroll while the stage is mounted
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // fast mode (?fast=1 or switch)
  useEffect(() => { setFastMode(fast); goldenRunner.setFast(fast) }, [fast])
  useEffect(() => () => setFastMode(false), [])

  // clock toasts (sahnaning o'zi ko'rsatadi; ichki ilovalar takrorlamaydi)
  useEffect(() => bus.on('clock', (p) => stageToast.show(p.label, formatDemoTime(p.now), { icon: 'clock-3', tone: 'gold' })), [])

  // which desktop app is visible (client roles keep the last one) + gold ring on role switch
  const [desktop, setDesktop] = useState<DesktopApp>(() => desktopFor(useStore.getState().session.role) ?? 'admin')
  const [mounted, setMounted] = useState<Set<DesktopApp>>(() => new Set<DesktopApp>(['admin', desktopFor(useStore.getState().session.role) ?? 'admin']))
  const [roleFlash, setRoleFlash] = useState<StagePane | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const off = useStore.subscribe((s) => s.session.role, (role) => {
      const d = desktopFor(role)
      if (d) { setDesktop(d); setMounted((m) => (m.has(d) ? m : new Set(m).add(d))) }
      setRoleFlash(d ? 'desktop' : 'phone')
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setRoleFlash(null), 600)
    })
    return () => { off(); if (timer) clearTimeout(timer) }
  }, [])

  // layout refs
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const phoneWrapRef = useRef<HTMLDivElement | null>(null)
  const desktopRef = useRef<HTMLDivElement | null>(null)
  const measure = useCallback((pane: StagePane) => centerOf(pane === 'phone' ? phoneWrapRef.current : desktopRef.current, bodyRef.current), [])
  const { pings, flash } = usePings(measure)

  // phone scale from the slot height only → the column width follows the phone, the desktop takes the rest
  const { ref: phoneSlotRef, size: phoneSlot } = useSize<HTMLDivElement>()
  const scale = useMemo(() => {
    if (!phoneSlot.h) return 0.8
    return Math.max(0.42, Math.min(1, (phoneSlot.h - 8) / (PHONE_H + BEZEL * 2)))
  }, [phoneSlot.h])
  const phoneColW = Math.round((PHONE_W + BEZEL * 2) * scale) + 16

  useEffect(() => {
    goldenRunner.registerPane('phone', () => phoneWrapRef.current?.getBoundingClientRect() ?? null)
    goldenRunner.registerPane('desktop', () => desktopRef.current?.getBoundingClientRect() ?? null)
  }, [])

  // golden start (confirm reset when the golden listing was already used)
  const [confirmGolden, setConfirmGolden] = useState(false)
  const [resetting, setResetting] = useState(false)
  const startGolden = useCallback(() => {
    if (golden.status === 'running' || golden.status === 'paused') return
    if (goldenIsFresh()) void goldenRunner.start()
    else setConfirmGolden(true)
  }, [golden.status])
  const confirmAndStart = useCallback(async () => {
    setResetting(true)
    try { await api.demo.reset() } finally { setResetting(false) }
    setConfirmGolden(false)
    void goldenRunner.start()
  }, [])

  const phoneTime = useMemo(() => { const d = parseIso(now); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` }, [now])
  const goldenActive = golden.status === 'running' || golden.status === 'paused'
  const phoneRing = flash.phone !== undefined || roleFlash === 'phone' || (goldenActive && golden.pane === 'phone')
  const desktopRing = flash.desktop !== undefined || roleFlash === 'desktop' || (goldenActive && golden.pane === 'desktop')

  const phoneRole = session.role === 'seller' ? roleLabel('seller') : session.role === 'buyer' ? roleLabel('buyer') : session.userId === 'u-seller' ? roleLabel('seller') : roleLabel('buyer')
  const desktopUser = desktop === 'admin'
    ? { name: staff.name, seed: staff.id, sub: roleLabel(staff.role) }
    : desktop === 'partner'
      ? { name: company.name, seed: company.id, sub: roleLabel('company') }
      : { name: 'BTS operatori', seed: 'bts', sub: roleLabel('bts') }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-paper text-ink" data-stage>
      <DemoPanel fast={fast} onFast={setFast} onGolden={startGolden} goldenRunning={goldenActive} />

      <div ref={bodyRef} className="relative flex min-h-0 flex-1 gap-4 px-4 pt-3">
        {/* phone column */}
        <section className="flex min-h-0 shrink-0 flex-col items-center" style={{ width: phoneColW }} aria-label={uz.demo.phonePane}>
          <PaneLabel icon={<Smartphone size={13} strokeWidth={2} />} title={uz.demo.phonePane} name={phoneUser?.name} seed={phoneUser?.id} sub={phoneRole} compact={phoneColW < 360} />
          <div ref={phoneSlotRef} className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
            <div
              ref={phoneWrapRef}
              data-testid={TID.stagePhone}
              className={cn('relative transition-shadow duration-300', phoneRing && 'ring-[3px] ring-gold-fill/90 ring-offset-4 ring-offset-paper')}
              style={{ borderRadius: 54 * scale }}
            >
              <PhoneFrame time={phoneTime} scale={scale} theme={session.theme}>
                <RouterIsland>
                  <AppBoundary name={uz.demo.phonePane} resetSignal={mobileNav.n}>
                    <MemoryRouter initialEntries={[mobileNav.path]}>
                      <AppBase base="" app="mobile" embedded>
                        <Suspense fallback={<AppFallback />}><MobileApp embedded /></Suspense>
                      </AppBase>
                    </MemoryRouter>
                  </AppBoundary>
                </RouterIsland>
              </PhoneFrame>
            </div>
          </div>
        </section>

        {/* desktop column */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label={uz.demo.desktopPane}>
          <PaneLabel icon={<Monitor size={13} strokeWidth={2} />} title={uz.demo.desktopPane} name={desktopUser.name} seed={desktopUser.seed} sub={desktopUser.sub} />
          <DesktopWindow
            ref={desktopRef}
            data-testid={TID.stageDesktop}
            host={DESKTOP_META[desktop].host}
            title={DESKTOP_META[desktop].title}
            ring={desktopRing}
          >
            {DESKTOP_APPS.filter((a) => mounted.has(a)).map((app) => (
              <DesktopSlot key={app} app={app} active={desktop === app}>
                {app === 'admin' ? <AdminApp embedded /> : app === 'partner' ? <PartnerApp embedded /> : <BtsApp embedded />}
              </DesktopSlot>
            ))}
          </DesktopWindow>
        </section>

        <PingLayer pings={pings} />
      </div>

      <NarrationBar onGolden={startGolden} className="mx-4 my-3" />

      <GoldenOverlay />
      <StageToasts />

      <ConfirmDialog
        open={confirmGolden}
        onOpenChange={setConfirmGolden}
        title={uz.demo.golden}
        description="Boshlang’ich holatga qaytarib boshlaymizmi? Oltin e’lon allaqachon yuborilgan — yo’lni boshidan ko’rsatish uchun ma’lumot seed holatiga qaytariladi."
        confirmLabel="Qaytarib boshlash"
        loading={resetting}
        onConfirm={confirmAndStart}
      />
    </div>
  )
}
