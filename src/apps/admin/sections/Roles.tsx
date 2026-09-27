import { Lock } from 'lucide-react'
import { Badge, Checkbox, Icon, Skeleton } from '@/design'
import { toast } from '../lib/toast'
import { useStore } from '@/store'
import { api } from '@/api'
import { uz } from '@/i18n/uz'
import type { AdminSection, Permission, StaffRole } from '@/domain/types'
import { useAccess, SECTIONS, SECTION_ICON, sectionTitle } from '../lib/sections'
import { useSectionLoading } from '../lib/hooks'
import { A } from '../strings'

const ROLES: StaffRole[] = ['super_admin', 'moderator', 'price_analyst', 'logistics', 'finance', 'operator']
const PERMS: Permission[] = ['view', 'edit', 'approve']

export function Roles() {
  const matrix = useStore((s) => s.data.roleMatrix)
  const access = useAccess('roles')
  const loading = useSectionLoading()
  if (loading) return <div className="p-5"><Skeleton height={520} className="rounded-card" /></div>
  const toggle = (role: StaffRole, section: AdminSection, perm: Permission, on: boolean) => {
    api.admin.setPermission(role, section, perm, on).catch((e: unknown) => toast.error(A.common.errorAction, { description: e instanceof Error ? e.message : String(e) }))
  }
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3 text-[12.5px] text-ink-2"><span>{A.roles.hint}</span><Badge tone="outline" Icon={Lock}>{A.roles.locked}</Badge></div>
      <div className="overflow-auto rounded-card border border-line bg-card">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-paper shadow-[inset_0_-1px_0_var(--line)]">
            <tr>
              <th className="eyebrow px-3 py-2.5 text-left font-semibold">{A.roles.section}</th>
              {ROLES.map((r) => <th key={r} className="px-2 py-2.5 text-center"><div className="eyebrow font-semibold">{uz.admin.roles[r]}</div><div className="mt-1 flex justify-center gap-1 text-[9px] uppercase tracking-[0.1em] text-ink-3">{PERMS.map((p) => <span key={p} className="w-9">{A.roles[p].slice(0, 3)}</span>)}</div></th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {SECTIONS.map((s) => (
              <tr key={s} className="hover:bg-blue-soft/40">
                <td className="h-11 px-3 py-1.5"><span className="flex items-center gap-2"><Icon name={SECTION_ICON[s]} size={16} className="text-ink-3" />{sectionTitle(s)}</span></td>
                {ROLES.map((r) => {
                  const perms = matrix[r][s] ?? []
                  const locked = r === 'super_admin' || !access.edit
                  return (
                    <td key={r} className="px-2 py-1.5 text-center">
                      <span className="inline-flex justify-center gap-1">
                        {PERMS.map((p) => <span key={p} className="inline-flex w-9 justify-center"><Checkbox aria-label={`${uz.admin.roles[r]} · ${sectionTitle(s)} · ${A.roles[p]}`} checked={perms.includes(p)} disabled={locked} onCheckedChange={(v) => toggle(r, s, p, v === true)} className="rounded-[5px] data-[state=checked]:border-blue data-[state=checked]:bg-blue data-[state=checked]:text-white" /></span>)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
