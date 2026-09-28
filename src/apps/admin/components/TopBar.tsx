import { useEffect, useMemo, useRef, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, Check, Command, Moon, Search, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Badge, HelpPopover, IconButton, Kbd, useTheme } from '@/design'
import { useNow, useStore } from '@/store'
import { uz } from '@/i18n/uz'
import type { AdminSection, StaffRole } from '@/domain/types'
import { sectionTitle, useAdminRole } from '../lib/sections'
import { useAppNavigate } from '@/lib/router'
import { A, HELP } from '../strings'
import { ago } from '../lib/format'
import { AuditKindBadge } from './ui'
import { auditField, auditValue } from '../lib/audit'

interface Hit { kind: 'listing' | 'order' | 'user'; id: string; title: string; sub: string; to: string }

export function TopBar({ section, onOpenPalette, compactSearch }: { section: AdminSection | null; onOpenPalette: () => void; compactSearch: boolean }) {
  const { theme, toggle } = useTheme()
  const nav = useAppNavigate()
  const data = useStore((s) => s.data)
  const session = useStore((s) => s.session)
  const setSession = useStore((s) => s.setSession)
  const now = useNow()
  const staff = data.staff.find((s) => s.id === session.staffId) ?? data.staff[0]
  const adminRole = useAdminRole()

  // ── global search ──
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const hits = useMemo<Hit[]>(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    const out: Hit[] = []
    for (const l of data.listings) { if (out.length >= 12) break; if (!l.historical && (l.id.toLowerCase().includes(s) || l.title.toLowerCase().includes(s))) out.push({ kind: 'listing', id: l.id, title: l.title, sub: `${l.id} · ${uz.listing.status[l.status]}`, to: l.status === 'in_review' || l.status === 'submitted' ? `/pricing?id=${l.id}` : `/moderation?id=${l.id}` }) }
    for (const o of data.orders) { if (out.length >= 18) break; if (o.id.toLowerCase().includes(s) || o.subOrders.some((so) => so.id.toLowerCase().includes(s))) out.push({ kind: 'order', id: o.id, title: `${o.id} · ${o.subOrders.map((x) => x.items[0]?.title).join(', ')}`, sub: `${o.subOrders.length} ${A.orders.subOrders.toLowerCase()}`, to: `/orders?id=${o.id}` }) }
    for (const u of data.users) { if (out.length >= 24) break; if (u.id.toLowerCase().includes(s) || u.name.toLowerCase().includes(s)) out.push({ kind: 'user', id: u.id, title: u.name, sub: `${u.id} · ${u.phoneMasked}`, to: `/users?id=${u.id}` }) }
    return out
  }, [q, data.listings, data.orders, data.users])
  useEffect(() => {
    if (!open) return
    const fn = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])
  const go = (h: Hit) => { nav(h.to); setOpen(false); setQ('') }
  const KIND_LABEL = { listing: A.shell.listings, order: A.shell.orders, user: A.shell.users }

  // ── notifications (recent audit) ──
  const seenKey = 'sb-admin-seen-audit'
  const [seenAt, setSeenAt] = useState<string>(() => { try { return localStorage.getItem(seenKey) ?? '' } catch { return '' } })
  const recent = useMemo(() => data.audit.filter((a) => a.role !== 'buyer' && a.role !== 'seller').slice(0, 10), [data.audit])
  const unseen = recent.filter((a) => a.at > seenAt).length
  const markSeen = () => { const t = recent[0]?.at ?? now; setSeenAt(t); try { localStorage.setItem(seenKey, t) } catch { /* noop */ } }
  const auditTarget = (entity: string, id: string) => (entity === 'listing' ? `/pricing?id=${id}` : entity === 'order' || entity === 'subOrder' ? `/orders?id=${id}` : entity === 'payout' ? '/payments' : entity === 'user' ? `/users?id=${id}` : `/audit?q=${id}`)

  return (
    <header className="flex h-[64px] shrink-0 items-center gap-3 border-b border-line bg-card px-5">
      <div className="min-w-0 shrink-0 max-w-[46%]">
        <div className="flex items-center gap-1.5">
          <h1 className="m-0 truncate font-display text-[19px] leading-tight text-ink">{section ? sectionTitle(section) : uz.app.name}</h1>
          {section && <HelpPopover size="sm" title={sectionTitle(section)} help={HELP[section]} />}
        </div>
        {section && <div className="mt-0.5 truncate text-[12px] leading-tight text-ink-2" title={HELP[section].sub}>{HELP[section].sub}</div>}
      </div>
      <div ref={boxRef} className={cn('relative mx-auto min-w-0 flex-1', compactSearch ? 'max-w-[260px]' : 'max-w-[440px]')}>
        <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
        <input
          type="search"
          role="searchbox"
          aria-label={uz.app.search}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur() } if (e.key === 'Enter' && hits[0]) go(hits[0]) }}
          placeholder={compactSearch ? A.shell.searchShort : A.shell.search}
          className="h-10 w-full rounded-full border border-transparent bg-paper pl-10 pr-16 text-[13.5px] text-ink placeholder:text-ink-3 outline-none transition-colors hover:bg-paper-2 focus:border-blue/40 focus:bg-card focus:ring-2 focus:ring-blue/20 [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="button" onClick={onOpenPalette} aria-label={`${A.shell.kbd.palette} ⌘ K`} className="absolute right-3 top-1/2 flex min-h-6 -translate-y-1/2 items-center"><Kbd keys={['⌘', 'K']} /></button>
        {open && q.trim().length >= 2 && (
          <div role="listbox" className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] max-h-[360px] overflow-auto rounded-[12px] border border-line bg-card p-1 shadow-soft">
            {hits.length === 0 && <div className="px-3 py-3 text-[13px] text-ink-3">{A.shell.noResults}</div>}
            {hits.map((h) => (
              <button key={`${h.kind}-${h.id}`} type="button" role="option" aria-selected={false} onClick={() => go(h)} className="flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left hover:bg-blue-soft/50">
                <Badge tone="blue" size="sm" className="w-[74px] justify-center">{KIND_LABEL[h.kind]}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] text-ink">{h.title}</span>
                  <span className="block truncate text-[11.5px] text-ink-3">{h.sub}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton size="sm" aria-label={A.shell.kbd.palette} onClick={onOpenPalette} className="text-ink-2 hover:text-ink"><Command strokeWidth={1.75} /></IconButton>
        <IconButton size="sm" aria-label={uz.admin.darkMode} aria-pressed={theme === 'dark'} onClick={toggle} className="text-ink-2 hover:text-ink">{theme === 'dark' ? <Sun strokeWidth={1.75} /> : <Moon strokeWidth={1.75} />}</IconButton>
        <DropdownMenu.Root onOpenChange={(o) => { if (o) markSeen() }}>
          <DropdownMenu.Trigger asChild>
            <button type="button" aria-label={`${A.shell.notifications}${unseen ? ` (${unseen})` : ''}`} className="relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-2 hover:bg-paper-2 hover:text-ink">
              <Bell size={19} strokeWidth={1.75} />
              {unseen > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brick ring-2 ring-card" aria-hidden="true" />}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={6} className="z-[80] w-[360px] rounded-[12px] border border-line bg-card p-1 text-ink shadow-soft">
              <div className="eyebrow px-2.5 pb-1 pt-2">{A.shell.notifications}</div>
              {recent.length === 0 && <div className="px-2.5 py-3 text-[13px] text-ink-3">{A.shell.noNotifications}</div>}
              {recent.map((a) => (
                <DropdownMenu.Item key={a.id} onSelect={() => nav(auditTarget(a.entity, a.entityId))} className="flex cursor-pointer items-start gap-2 rounded-[8px] px-2.5 py-2 outline-none data-[highlighted]:bg-paper-2">
                  <AuditKindBadge kind={a.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{a.actorName} · <span className="tnum">{a.entityId}</span> · {auditField(a.field)}</span>
                    <span className="block truncate text-[11.5px] text-ink-3">{a.from !== null && a.from !== undefined ? `${auditValue(a, a.from)} → ` : ''}{auditValue(a, a.to)} · {ago(a.at, now)}</span>
                  </span>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" title={A.shell.switchRole} className="ml-1 inline-flex h-10 items-center gap-2 rounded-full bg-blue-soft py-0.5 pl-1 pr-3 text-blue transition-colors hover:brightness-[0.97]">
              <Avatar name={staff.name} seed={staff.id} size={28} />
              {!compactSearch && (
                <span className="text-left leading-tight">
                  <span className="block text-[12.5px] font-semibold text-ink">{staff.name}</span>
                  <span className="block text-[10.5px] font-medium text-blue">{uz.admin.roles[adminRole]}</span>
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={6} className="z-[80] min-w-[260px] rounded-[12px] border border-line bg-card p-1 text-ink shadow-soft">
              <div className="eyebrow px-2.5 pb-1 pt-2">{A.shell.switchRole}</div>
              {data.staff.map((s) => (
                <DropdownMenu.Item key={s.id} onSelect={() => setSession({ staffId: s.id, role: s.role as StaffRole })} className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-1.5 outline-none data-[highlighted]:bg-paper-2">
                  <Avatar name={s.name} seed={s.id} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{s.name}</span>
                    <span className="block text-[11px] text-ink-3">{uz.admin.roles[s.role]}</span>
                  </span>
                  {s.id === session.staffId && <Check size={14} strokeWidth={2} className="text-blue" aria-hidden="true" />}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
