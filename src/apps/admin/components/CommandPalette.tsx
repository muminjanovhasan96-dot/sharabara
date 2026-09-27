import { Command } from 'cmdk'
import { ArrowRight, Clock, Moon, Search, UserRound } from 'lucide-react'
import { Icon, Kbd, useTheme } from '@/design'
import { toast } from '../lib/toast'
import { useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import { TID } from '@/lib/testids'
import { GOLDEN } from '@/seed'
import type { AdminSection, StaffRole } from '@/domain/types'
import { useAppNavigate } from '@/lib/router'
import { SECTION_ICON, sectionTitle, useVisibleSections } from '../lib/sections'
import { A, tt } from '../strings'
import { AdminModal } from './ui'

const ITEM = 'flex h-10 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 text-[13.5px] text-ink outline-none data-[selected=true]:bg-blue-soft data-[selected=true]:text-blue'

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useAppNavigate()
  const { toggle } = useTheme()
  const staff = useStore((s) => s.data.staff)
  const setSession = useStore((s) => s.setSession)
  const sections = useVisibleSections()
  const close = () => onOpenChange(false)
  const go = (path: string) => { nav(path); close() }
  const act = (label: string, fn: () => Promise<unknown>) => { close(); fn().then(() => toast.success(label)).catch((e: unknown) => toast.error(A.common.errorAction, { description: e instanceof Error ? e.message : String(e) })) }
  return (
    <AdminModal open={open} onOpenChange={onOpenChange} size="md" hideClose className="!p-2">
      <div data-testid={TID.aCmdk} className="-mt-4">
        <Command label={uz.admin.commandPlaceholder} loop>
          <div className="flex items-center gap-2 border-b border-line px-2.5">
            <Search size={16} strokeWidth={1.75} className="text-ink-3" aria-hidden="true" />
            <Command.Input autoFocus placeholder={uz.admin.commandPlaceholder} className="h-11 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3" />
            <Kbd>Esc</Kbd>
          </div>
          <Command.List className="scroll-thin max-h-[380px] overflow-y-auto p-1.5 [&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2">
            <Command.Empty className="px-3 py-6 text-center text-[13px] text-ink-3">{A.shell.noResults}</Command.Empty>
            <Command.Group heading={A.shell.actions}>
              <Command.Item className={ITEM} value={A.shell.openListing} onSelect={() => go(`/pricing?id=${GOLDEN.listingId}`)}><Icon name="badge-percent" size={16} /> {A.shell.openListing}</Command.Item>
              <Command.Item className={ITEM} value={A.shell.goPricing} onSelect={() => go('/pricing')}><ArrowRight size={16} strokeWidth={1.75} /> {A.shell.goPricing}</Command.Item>
              <Command.Item className={ITEM} value={A.shell.to17} onSelect={() => act(uz.demo.to17, () => api.demo.to17())}><Clock size={16} strokeWidth={1.75} /> {A.shell.to17}</Command.Item>
              <Command.Item className={ITEM} value={`${A.shell.plusDay} kun`} onSelect={() => act(uz.demo.plusDay, () => api.demo.plusDay())}><Clock size={16} strokeWidth={1.75} /> {A.shell.plusDay}</Command.Item>
              <Command.Item className={ITEM} value={A.shell.payday} onSelect={() => act(uz.demo.payday, () => api.demo.payday())}><Icon name="wallet" size={16} /> {A.shell.payday}</Command.Item>
              <Command.Item className={ITEM} value={A.shell.dark} onSelect={() => { toggle(); close() }}><Moon size={16} strokeWidth={1.75} /> {A.shell.dark}</Command.Item>
            </Command.Group>
            <Command.Group heading={A.shell.sections}>
              {sections.map((s: AdminSection) => (
                <Command.Item key={s} className={ITEM} value={`${sectionTitle(s)} ${s}`} onSelect={() => go(`/${s}`)}>
                  <Icon name={SECTION_ICON[s]} size={16} /> {tt(A.shell.goSection, { s: sectionTitle(s) })}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={A.shell.roles}>
              {staff.map((st) => (
                <Command.Item key={st.id} className={ITEM} value={`${A.shell.switchRole} ${uz.admin.roles[st.role]} ${st.name}`} onSelect={() => { setSession({ staffId: st.id, role: st.role as StaffRole }); close() }}>
                  <UserRound size={16} strokeWidth={1.75} /> {tt(A.shell.roleTo, { r: uz.admin.roles[st.role] })} <span className="ml-auto text-[12px] text-ink-3">{st.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </AdminModal>
  )
}

export function ShortcutsHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const rows: [string[], string][] = [
    [['⌘', 'K'], A.shell.kbd.palette], [['?'], A.shell.kbd.help], [['J'], A.shell.kbd.next], [['K'], A.shell.kbd.prev],
    [['A'], A.shell.kbd.approve], [['E'], A.shell.kbd.edit], [['R'], A.shell.kbd.reject], [['Esc'], A.shell.kbd.esc],
  ]
  return (
    <AdminModal open={open} onOpenChange={onOpenChange} title={A.shell.shortcuts} size="sm">
      <div className="divide-y divide-line">
        {rows.map(([keys, label]) => (
          <div key={label} className="flex items-center justify-between py-2 text-[13.5px]"><span className="text-ink-2">{label}</span><Kbd keys={keys} /></div>
        ))}
      </div>
    </AdminModal>
  )
}
