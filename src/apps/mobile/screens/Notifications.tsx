import { useMemo } from 'react'
import { useNow } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { uz, t } from '@/i18n/uz'
import { dateKey, formatDemoDate, formatDemoTime, isSameDay, addDays } from '@/domain/clock'
import { Button, ErrorState } from '@/design'
import { EmptyState, PastelTile } from '../components/Ui'
import type { PastelKey } from '../components/Ui'
import type { NotificationKind } from '@/domain/types'
import { ms } from '../strings'
import { useList, useMeId, useScreenLoad } from '../lib'
import { Screen } from '../components/Screen'
import { RowsSkeleton } from '../components/Cards'

const ICON: Record<NotificationKind, string> = {
  price_drop: 'trending-down', saved_search: 'bookmark', order_status: 'package', price_offer: 'badge-percent', payment: 'credit-card',
  campaign: 'megaphone', chat: 'message-circle', listing_status: 'file-check', payout: 'wallet', rate_request: 'star',
}
const TONE: Record<NotificationKind, PastelKey> = {
  price_drop: 'brick', saved_search: 'lilac', order_status: 'blue', price_offer: 'gold', payment: 'green',
  campaign: 'peach', chat: 'sky', listing_status: 'mint', payout: 'green', rate_request: 'lemon',
}

export default function Notifications() {
  const nav = useAppNavigate()
  const meId = useMeId()
  const now = useNow()
  const { loading, error, reload } = useScreenLoad([meId])
  const items = useList((s) => s.data.notifications.filter((n) => n.userId === meId).slice().sort((a, b) => b.at.localeCompare(a.at)))
  const unread = items.filter((n) => !n.read).length
  const groups = useMemo(() => {
    const m = new Map<string, typeof items>()
    for (const n of items) { const k = dateKey(n.at); m.set(k, [...(m.get(k) ?? []), n]) }
    return Array.from(m.entries())
  }, [items])
  const dayLabel = (k: string) => { const iso = `${k}T12:00:00`; return isSameDay(iso, now) ? uz.app.today : isSameDay(iso, addDays(now, -1)) ? uz.app.yesterday : formatDemoDate(iso) }
  const open = async (n: (typeof items)[number]) => {
    void api.listings.markNotificationsRead([n.id])
    if (n.link) nav(n.link)
  }
  return (
    <Screen back backTo="/" title={uz.notif.title} eyebrow={unread ? t(ms.notif.unread, { n: unread }) : ms.notif.allRead} withTabBar
      right={unread > 0 && <Button variant="ghost" size="sm" onClick={() => void api.listings.markNotificationsRead()}>{uz.notif.markAll}</Button>}>
      <div className="pt-3">
        {error ? <ErrorState onRetry={reload} /> : loading ? <RowsSkeleton n={4} /> : items.length === 0 ? (
          <EmptyState icon="bell" title={uz.notif.empty} />
        ) : groups.map(([k, list]) => (
          <section key={k} className="mb-4">
            <div className="eyebrow mb-1.5">{dayLabel(k)}</div>
            <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-card bg-card p-0 shadow-soft">
              {list.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => void open(n)} className={cn('flex w-full items-start gap-3 px-3 py-3 text-left active:bg-paper-2', !n.read && 'bg-blue-soft/50')}>
                    <PastelTile icon={ICON[n.kind] ?? 'bell'} size={40} radius={12} tone={n.read ? 'gray' : TONE[n.kind] ?? 'blue'} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2"><span className={cn('clamp-1 text-[14px]', !n.read && 'font-semibold')}>{n.title}</span><span className="tnum shrink-0 text-[11px] text-ink-3">{formatDemoTime(n.at).split(', ')[1]}</span></div>
                      <div className="clamp-2 text-[13px] leading-snug text-ink-2">{n.body}</div>
                    </div>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Screen>
  )
}
