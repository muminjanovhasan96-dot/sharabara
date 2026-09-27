import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { ThemeProvider, Toaster, EmptyState, Button } from '@/design'
import { toast } from './lib/toast'
import { bus } from '@/api'
import { uz } from '@/i18n/uz'
import type { AdminSection } from '@/domain/types'
import { useAppNavigate, useStageNav } from '@/lib/router'
import { AdminContext } from './lib/context'
import './admin.css'
import { useContainerWidth } from './lib/hooks'
import { isSection, useAccess, useAdminRole } from './lib/sections'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { CommandPalette, ShortcutsHelp } from './components/CommandPalette'
import { SectionBoundary } from './components/ui'
import { A, tt } from './strings'
import { Dashboard } from './sections/Dashboard'
import { Moderation } from './sections/Moderation'
import { Pricing } from './sections/Pricing'
import { Fees } from './sections/Fees'
import { Orders } from './sections/Orders'
import { Logistics } from './sections/Logistics'
import { Payments } from './sections/Payments'
import { Returns } from './sections/Returns'
import { Companies } from './sections/Companies'
import { Products } from './sections/Products'
import { Users } from './sections/Users'
import { Categories } from './sections/Categories'
import { Campaigns } from './sections/Campaigns'
import { Reports } from './sections/Reports'
import { Roles } from './sections/Roles'
import { Audit } from './sections/Audit'
import { Warehouse } from './sections/Warehouse'
import { Director } from './sections/Director'

const VIEWS: Record<AdminSection, () => React.JSX.Element> = {
  dashboard: Dashboard, moderation: Moderation, pricing: Pricing, fees: Fees, orders: Orders, logistics: Logistics, payments: Payments,
  returns: Returns, companies: Companies, products: Products, users: Users, categories: Categories, campaigns: Campaigns, reports: Reports, roles: Roles, audit: Audit, warehouse: Warehouse, director: Director,
}

export default function AdminApp({ embedded = false }: { embedded?: boolean }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  return (
    <div ref={setEl} data-admin-root className="relative flex h-full min-h-0 w-full overflow-hidden bg-paper text-ink" style={embedded ? { contain: 'layout' } : undefined}>
      {el && (
        <ThemeProvider scope={el} storageKey="sb-admin-theme">
          <AdminInner root={el} embedded={embedded} />
        </ThemeProvider>
      )}
    </div>
  )
}

function AdminInner({ root, embedded }: { root: HTMLDivElement; embedded: boolean }) {
  useStageNav()
  const nav = useAppNavigate()
  const width = useContainerWidth(root)
  const [forcedCompact, setForcedCompact] = useState<boolean | null>(null)
  const compact = forcedCompact ?? width < 1100
  const [palette, setPalette] = useState(false)
  const [help, setHelp] = useState(false)
  const [pulses, setPulses] = useState<Partial<Record<AdminSection, number>>>({})
  const pulse = useCallback((s: AdminSection) => setPulses((p) => ({ ...p, [s]: (p[s] ?? 0) + 1 })), [])
  const openPalette = useCallback(() => setPalette(true), [])

  // live events → toast + badge pulse
  useEffect(() => bus.on('admin.toast', (p) => {
    const tone = p.tone === 'brick' ? 'error' : p.tone === 'success' ? 'success' : 'info'
    toast(p.title, { description: p.body, tone, action: p.section && isSection(p.section) ? { label: A.shell.open, onClick: () => nav(`/${p.section}`) } : undefined })
    if (p.section && isSection(p.section)) pulse(p.section)
  }), [nav, pulse])
  // sahnada soat xabarini sahnaning o'zi ko'rsatadi — takrorlamaymiz
  useEffect(() => (embedded ? undefined : bus.on('clock', (p) => toast.info(p.label))), [embedded])

  // keyboard: ⌘K / Ctrl+K, ?
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((o) => !o); return }
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement | null)?.isContentEditable) return
      if (e.key === '?') { e.preventDefault(); setHelp((o) => !o) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const ctx = useMemo(() => ({ root, embedded, compact, width, pulse, openPalette }), [root, embedded, compact, width, pulse, openPalette])
  return (
    <AdminContext.Provider value={ctx}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path=":section" element={<Shell compact={compact} onToggle={() => setForcedCompact(!compact)} pulses={pulses} onOpenPalette={openPalette} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
      <CommandPalette open={palette} onOpenChange={setPalette} />
      <ShortcutsHelp open={help} onOpenChange={setHelp} />
      <Toaster channel="admin" container={root} position="bottom" className="items-end pr-4" />
      <div id="print-root" aria-hidden="true" />
    </AdminContext.Provider>
  )
}

function Shell({ compact, onToggle, pulses, onOpenPalette }: { compact: boolean; onToggle: () => void; pulses: Partial<Record<AdminSection, number>>; onOpenPalette: () => void }) {
  const { section } = useParams()
  const nav = useAppNavigate()
  const sec: AdminSection | null = isSection(section) ? section : null
  if (!sec) return <Navigate to="../dashboard" replace />
  return (
    <div className="flex h-full min-h-0 w-full">
      <Sidebar active={sec} compact={compact} onToggle={onToggle} onNavigate={(s) => nav(`/${s}`)} pulses={pulses} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar section={sec} onOpenPalette={onOpenPalette} compactSearch={compact} />
        <main className="scroll-thin relative min-h-0 flex-1 overflow-auto">
          <SectionBoundary key={sec}><SectionView section={sec} /></SectionBoundary>
        </main>
      </div>
    </div>
  )
}

function SectionView({ section }: { section: AdminSection }) {
  const access = useAccess(section)
  const role = useAdminRole()
  const nav = useAppNavigate()
  if (!access.view) {
    return (
      <div className="grid h-full place-items-center p-8">
        <EmptyState icon="lock" title={uz.admin.noAccess} hint={tt(A.shell.noAccessHint, { r: uz.admin.roles[role] })} action={<Button variant="secondary" onClick={() => nav('/dashboard')}>{uz.admin.sections.dashboard}</Button>} />
      </div>
    )
  }
  const View = VIEWS[section]
  return <View />
}
