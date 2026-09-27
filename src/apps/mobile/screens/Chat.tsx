import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { useStore, useNow } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { formatDemoTime } from '@/domain/clock'
import { Avatar, Button, Chip, ErrorState, Input, ProductImage, toast } from '@/design'
import { EmptyState } from '../components/Ui'
import { ms } from '../strings'
import { timeAgo, useList, useMeId, useScreenLoad } from '../lib'
import { Screen } from '../components/Screen'
import { RowsSkeleton } from '../components/Cards'

export default function ChatScreen() {
  const { threadId = '' } = useParams<{ threadId: string }>()
  const nav = useAppNavigate()
  const meId = useMeId()
  const thread = useStore((s) => s.data.chats.find((c) => c.id === threadId))
  const listing = useStore((s) => s.data.listings.find((l) => l.id === thread?.listingId))
  const otherId = thread ? (thread.buyerId === meId ? thread.sellerId : thread.buyerId) : ''
  const other = useStore((s) => s.data.users.find((u) => u.id === otherId))
  const canWrite = !!thread && (thread.buyerId === meId || thread.sellerId === meId)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [thread?.messages.length])
  const send = async (t: string) => {
    const v = t.trim(); if (!v || !thread) return
    setBusy(true)
    try { await api.listings.sendMessage(thread.id, v); setText('') } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error) } finally { setBusy(false) }
  }
  if (!thread) return <Screen back title={uz.chat.title}><ErrorState title={ms.common.notFound} onRetry={() => nav('/chats')} retryLabel={ms.chat.list} /></Screen>
  return (
    <Screen
      back backTo="/chats"
      header={
        <header className="pt-safe shrink-0 border-b border-line bg-card px-2">
          <div className="flex h-[56px] items-center gap-2">
            <button type="button" onClick={() => nav('/chats')} aria-label={ms.common.back} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper-2"><span className="text-[24px] leading-none">‹</span></button>
            {other && <Avatar name={other.name} seed={other.id} size={40} fill="var(--blue-soft)" className="text-blue" />}
            <div className="min-w-0 flex-1">
              <div className="clamp-1 text-[15px] font-semibold">{other?.name ?? '—'}</div>
              {listing && <button type="button" onClick={() => nav(`/listing/${listing.id}`)} className="clamp-1 text-left text-[12px] text-blue">{listing.title}</button>}
            </div>
            {listing && <button type="button" onClick={() => nav(`/listing/${listing.id}`)} className="mr-1 w-11 shrink-0" aria-label={ms.chat.aboutListing}><ProductImage id={listing.images[0] ?? 'ill-phone-1'} className="rounded-[8px]" /></button>}
          </div>
        </header>
      }
      bottom={canWrite ? (
        <div className="flex flex-col gap-2">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {uz.chat.quick.map((q) => <Chip key={q} size="sm" onToggle={() => void send(q)}>{q}</Chip>)}
          </div>
          <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); void send(text) }}>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={uz.chat.placeholder} className="text-[16px]" enterKeyHint="send" />
            <Button type="submit" variant="primary" size="icon" aria-label={ms.chat.send} loading={busy} disabled={!text.trim()}><Send size={18} strokeWidth={1.75} /></Button>
          </form>
        </div>
      ) : <p className="m-0 py-1 text-center text-[12.5px] text-ink-3">{ms.chat.readOnly}</p>}
    >
      <div className="flex flex-col gap-2 pt-3">
        <p className="mx-auto max-w-[32ch] rounded-full bg-paper-2 px-3 py-1.5 text-center text-[11.5px] text-ink-3">{uz.chat.phoneHidden}</p>
        {thread.messages.map((m) => {
          const mine = m.from === meId
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[78%] rounded-[16px] px-3.5 py-2 text-[14.5px] leading-snug shadow-soft', mine ? 'rounded-br-[6px] bg-ink text-white' : 'rounded-bl-[6px] bg-card text-ink')}>
                <div>{m.text}</div>
                <div className={cn('tnum mt-0.5 text-right text-[10.5px]', mine ? 'text-white/60' : 'text-ink-3')}>{formatDemoTime(m.at).split(', ')[1]}</div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
    </Screen>
  )
}

export function ChatsList() {
  const nav = useAppNavigate()
  const meId = useMeId()
  const now = useNow()
  const { loading, error, reload } = useScreenLoad([meId])
  const threads = useList((s) => s.data.chats.filter((c) => c.buyerId === meId || c.sellerId === meId).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  const users = useStore((s) => s.data.users)
  const listings = useStore((s) => s.data.listings)
  return (
    <Screen back backTo="/profile" title={ms.chat.list} withTabBar>
      <div className="pt-3">
        {error ? <ErrorState onRetry={reload} /> : loading ? <RowsSkeleton n={4} /> : threads.length === 0 ? (
          <EmptyState icon="message-circle" title={ms.chat.empty} hint={ms.chat.emptyHint} />
        ) : (
          <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-card bg-card p-0 shadow-soft">
            {threads.map((th) => {
              const otherId = th.buyerId === meId ? th.sellerId : th.buyerId
              const other = users.find((u) => u.id === otherId)
              const l = listings.find((x) => x.id === th.listingId)
              const last = th.messages.at(-1)
              const unread = th.messages.filter((m) => !m.read && m.from !== meId).length
              return (
                <li key={th.id}>
                  <button type="button" onClick={() => nav(`/chat/${th.id}`)} className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-paper-2">
                    <Avatar name={other?.name ?? '?'} seed={otherId} size={40} fill="var(--blue-soft)" className="text-blue" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2"><span className="clamp-1 text-[15px] font-semibold">{other?.name}</span>{last && <span className="shrink-0 text-[11px] text-ink-3">{timeAgo(last.at, now)}</span>}</div>
                      <div className="clamp-1 text-[12px] text-ink-3">{l?.title}</div>
                      {last && <div className="clamp-1 text-[13px] text-ink-2">{last.from === meId ? `${ms.chat.you}: ` : ''}{last.text}</div>}
                    </div>
                    {unread > 0 && <span className="tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1.5 text-[11px] font-bold text-white">{unread}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Screen>
  )
}
