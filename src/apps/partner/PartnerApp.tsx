import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronsUpDown, Clock3 } from 'lucide-react'
import { Icon, Seal, Toaster, Wordmark } from '@/design'
import { useData, useNow, useSession } from '@/store'
import { formatDemoTime } from '@/domain/clock'
import { useBase, useHref, useStageNav } from '@/lib/router'
import { cn } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { setCompany, useCompany, useContainerWidth } from './hooks'
import { PrintRootCtx } from './printRoot'
import './partner.css'
import { P } from './strings'
import { Overview } from './pages/Overview'
import { Products } from './pages/Products'
import { Import } from './pages/Import'
import { Orders } from './pages/Orders'
import { Promos } from './pages/Promos'
import { Billing } from './pages/Billing'
import { Reports } from './pages/Reports'
import { ApiKeys } from './pages/ApiKeys'
import { Contract } from './pages/Contract'

const NAV: { to: string; key: keyof typeof P.nav; icon: string }[] = [
  { to: '/', key: 'overview', icon: 'layout-dashboard' },
  { to: '/products', key: 'products', icon: 'package' },
  { to: '/import', key: 'import', icon: 'file-spreadsheet' },
  { to: '/orders', key: 'orders', icon: 'shopping-bag' },
  { to: '/promos', key: 'promos', icon: 'tag' },
  { to: '/billing', key: 'billing', icon: 'wallet' },
  { to: '/reports', key: 'reports', icon: 'chart-column' },
  { to: '/api', key: 'api', icon: 'key-round' },
  { to: '/contract', key: 'contract', icon: 'file-text' },
]

function CompanySwitcher({ compact }: { compact: boolean }) {
  const c = useCompany()
  const companies = useData((d) => d.companies)
  const { companyId } = useSession()
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" aria-label={P.switchCompany} className="inline-flex h-11 items-center gap-2.5 rounded-full bg-blue-soft py-0.5 pl-1 pr-3 text-left text-ink transition-colors hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-blue">
          <Seal icon={c.sealIcon} size={28} variant="gold" />
          {!compact && <span className="min-w-0"><span className="block max-w-[180px] truncate text-[13.5px] font-semibold leading-tight text-ink">{c.name}</span><span className="block text-[11px] font-medium leading-tight text-blue">{P.model[c.model]} · {Math.round(c.commissionRate * 100)}%</span></span>}
          <ChevronsUpDown size={16} strokeWidth={1.75} className="text-blue" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-[260px] rounded-[12px] border border-line bg-card p-1 text-ink shadow-soft">
          <DropdownMenu.Label className="eyebrow px-2 pb-1 pt-2">{P.switchCompany}</DropdownMenu.Label>
          {companies.map((x) => (
            <DropdownMenu.Item key={x.id} onSelect={() => setCompany(x.id)} className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-2 outline-none data-[highlighted]:bg-blue-soft/60">
              <Seal icon={x.sealIcon} size={28} variant={x.id === companyId ? 'gold' : 'paper'} />
              <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium">{x.name}</span><span className="block text-[11.5px] text-ink-3">{P.model[x.model]} · {Math.round(x.commissionRate * 100)}% · STIR {x.inn}</span></span>
              {x.id === companyId && <Check size={16} strokeWidth={2} className="text-blue" aria-hidden="true" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default function PartnerApp({ embedded = false }: { embedded?: boolean }) {
  useStageNav()
  const href = useHref()
  const { embedded: ctxEmbedded } = useBase()
  const isEmbedded = embedded || ctxEmbedded
  const now = useNow()
  const [rootRef, width] = useContainerWidth<HTMLDivElement>()
  const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null)
  const rail = width < 1100
  const compactHeader = width < 760
  // telefon: yon menyu o'rniga sarlavha ostida aylanadigan bo'limlar qatori
  const phone = width < 640

  return (
    <PrintRootCtx.Provider value={printRoot}>
      <div ref={rootRef} className={cn('relative flex bg-paper text-ink', isEmbedded ? 'h-full min-h-0' : 'h-dvh')} data-app="partner">
        {!phone && <aside className={cn('flex shrink-0 flex-col border-r border-line bg-card text-ink transition-[width]', rail ? 'w-[64px]' : 'w-[232px]')} aria-label={P.title}>
          <div className={cn('flex h-14 items-center', rail ? 'justify-center' : 'gap-2.5 px-4')}>
            <Wordmark tone="ink" size="sm" textOnly={rail} className={rail ? 'sr-only' : ''} />
            {rail && <Seal icon="stamp" size={28} variant="ink" />}
          </div>
          {!rail && <div className="eyebrow px-4 pb-1 pt-3 !text-[10.5px]">{P.eyebrow}</div>}
          <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Bo’limlar">
            {NAV.map((n) => (
              <NavLink key={n.to} to={href(n.to)} end={n.to === '/'} title={P.nav[n.key]} aria-label={P.nav[n.key]}
                className={({ isActive }) => cn('group relative flex items-center gap-2.5 rounded-[10px] text-[13.5px] text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-blue', rail ? 'h-10 justify-center' : 'h-9 px-2.5', isActive && 'bg-blue-soft font-semibold text-blue hover:bg-blue-soft hover:text-blue')}>
                {({ isActive }) => (
                  <>
                    {isActive && <span aria-hidden="true" className="absolute -left-2 top-1.5 h-6 w-[3px] rounded-r bg-blue" />}
                    <Icon name={n.icon} size={18} className={isActive ? 'text-blue' : 'text-ink-3 group-hover:text-ink'} />
                    {!rail && <span className="truncate">{P.nav[n.key]}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          {!rail && (
            <div className="border-t border-line p-2">
              <div className="flex items-center gap-2 rounded-[10px] bg-paper px-2.5 py-2">
                <Clock3 size={15} strokeWidth={1.75} className="shrink-0 text-gold" aria-hidden="true" />
                <span className="min-w-0 leading-tight"><span className="block text-[10px] uppercase tracking-[0.12em] text-ink-3">{uz.app.demo}</span><span className="tnum block text-[13px] font-medium text-ink">{formatDemoTime(now)}</span></span>
              </div>
            </div>
          )}
        </aside>}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className={cn('flex shrink-0 items-center justify-between gap-3 border-b border-line bg-card', phone ? 'pt-safe min-h-[56px] px-4 py-2' : 'h-[60px] px-5')}>
            <div className="min-w-0"><div className="eyebrow !text-[10px] leading-none">{P.eyebrow}</div><div className={cn('mt-0.5 truncate font-display leading-tight text-ink', phone ? 'text-[18px]' : 'text-[20px]')}>{P.title}</div></div>
            <div className="flex items-center gap-2">
              {!compactHeader && <span className="tnum hidden h-9 items-center rounded-full bg-paper px-3 text-[12.5px] text-ink-2 md:inline-flex">{formatDemoTime(now)}</span>}
              <CompanySwitcher compact={compactHeader} />
            </div>
          </header>
          {phone && (
            <nav className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto border-b border-line bg-card px-3 py-2" aria-label="Bo’limlar">
              {NAV.map((n) => (
                <NavLink key={n.to} to={href(n.to)} end={n.to === '/'} className={({ isActive }) => cn('inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors', isActive ? 'border-ink bg-ink text-card' : 'border-line bg-card text-ink-2')}>
                  {({ isActive }) => <><Icon name={n.icon} size={15} className={isActive ? 'text-gold-fill' : 'text-ink-3'} />{P.nav[n.key]}</>}
                </NavLink>
              ))}
            </nav>
          )}
          <main className={cn('scroll-thin min-w-0 flex-1 overflow-y-auto py-5', phone ? 'px-3 py-3' : width < 900 ? 'px-4' : 'px-6')}>
            <Routes>
              <Route index element={<Overview />} />
              <Route path="products" element={<Products />} />
              <Route path="import" element={<Import />} />
              <Route path="orders" element={<Orders />} />
              <Route path="promos" element={<Promos />} />
              <Route path="billing" element={<Billing />} />
              <Route path="reports" element={<Reports />} />
              <Route path="api" element={<ApiKeys />} />
              <Route path="contract" element={<Contract />} />
              <Route path="*" element={<Overview />} />
            </Routes>
          </main>
        </div>
        <div id="print-root" ref={setPrintRoot} className="hidden print:block" />
        <Toaster channel="partner" inline position="bottom" />
      </div>
    </PrintRootCtx.Provider>
  )
}
