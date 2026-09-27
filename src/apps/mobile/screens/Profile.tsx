import { useState } from 'react'
import { ArrowLeftRight, Bookmark, ChevronDown, CircleHelp, History, MessageCircle, Package, Settings, Tag, Trash2, Wallet } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStore, useNow } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { uz, t } from '@/i18n/uz'
import { Avatar, Badge, Button, ConfirmDialog, Money, Segmented, Switch, Tabs, TabsList, TabsTrigger, toast, usePhoneContainer } from '@/design'
import { EmptyState } from '../components/Ui'
import { ms } from '../strings'
import { monthsSince, useList, useMe, useScreenLoad } from '../lib'
import { localApi } from '../localApi'
import { Row, Screen } from '../components/Screen'
import { CardGridSkeleton, ListingCard, ProductCard, Stars } from '../components/Cards'

export default function Profile() {
  const nav = useAppNavigate()
  const me = useMe()
  const now = useNow()
  const listingsN = useStore((s) => s.data.listings.filter((l) => l.sellerId === me.id && !l.historical && !['removed'].includes(l.status)).length)
  const ordersN = useStore((s) => s.data.orders.filter((o) => o.buyerId === me.id).length)
  const savedN = useStore((s) => s.ui.savedListingIds.length + s.ui.savedProductIds.length)
  const chatsN = useStore((s) => s.data.chats.filter((c) => c.buyerId === me.id || c.sellerId === me.id).length)
  const other = me.id === 'u-seller' ? 'u-buyer' : 'u-seller'
  const otherUser = useStore((s) => s.data.users.find((u) => u.id === other))
  const switchUser = () => { localApi.switchUser(other); toast.info(t(ms.profile.switched, { name: otherUser?.name ?? other })) }
  return (
    <Screen title={uz.profile.title} withTabBar bleed>
      <div className="mx-4 mt-3 flex items-center gap-4 rounded-card bg-card p-4 shadow-soft">
        <Avatar name={me.name} seed={me.id} size={80} fill="var(--blue-soft)" className="text-blue" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="m-0 font-display text-[20px] leading-tight">{me.name}</h2>{me.verifiedSeller && <Badge tone="green" size="sm">{ms.profile.verified}</Badge>}</div>
          <div className="tnum mt-0.5 text-[13.5px] text-ink-2">{me.phoneMasked}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px] text-ink-3"><Stars value={me.rating} /><span>{t(uz.listing.soldCount, { n: me.soldCount })}</span><span>{t(uz.listing.memberFor, { n: monthsSince(me.joinedAt, now) })}</span></div>
        </div>
      </div>
      <div className="mx-4 mt-4 divide-y divide-line overflow-hidden rounded-card bg-card shadow-soft">
        <Row icon={<Tag />} label={uz.profile.myListings} right={<span className="tnum text-[13px]">{listingsN}</span>} onClick={() => nav('/sell/my')} />
        <Row icon={<Package />} label={uz.profile.orders} right={<span className="tnum text-[13px]">{ordersN}</span>} onClick={() => nav('/orders')} />
        <Row icon={<MessageCircle />} label={uz.chat.title} right={<span className="tnum text-[13px]">{chatsN}</span>} onClick={() => nav('/chats')} />
        <Row icon={<Bookmark />} label={uz.profile.saved} right={<span className="tnum text-[13px]">{savedN}</span>} onClick={() => nav('/profile/saved')} />
        <Row icon={<History />} label={uz.profile.savedSearches} onClick={() => nav('/profile/searches')} />
        <Row icon={<Wallet />} label={uz.profile.wallet} onClick={() => nav('/wallet')} />
      </div>
      <div className="mx-4 mt-3 divide-y divide-line overflow-hidden rounded-card bg-card shadow-soft">
        <Row icon={<Settings />} label={uz.profile.settings} onClick={() => nav('/profile/settings')} />
        <Row icon={<CircleHelp />} label={uz.profile.help} onClick={() => nav('/profile/help')} />
      </div>
      <div className="mx-4 mt-3 overflow-hidden rounded-card border border-dashed border-line-strong bg-card/60">
        <Row icon={<ArrowLeftRight />} label={ms.profile.demoSwitch} sub={`${ms.profile.demoSwitchHint} · ${otherUser?.name ?? other}`} onClick={switchUser} testId="m-demo-switch-user" />
      </div>
      <div className="px-4 pt-4 text-center text-[11px] text-ink-3">Sharabara · {uz.app.demo}</div>
    </Screen>
  )
}

export function Saved() {
  const { loading, error, reload } = useScreenLoad()
  const [tab, setTab] = useState('listings')
  const savedL = useStore((s) => s.ui.savedListingIds)
  const savedP = useStore((s) => s.ui.savedProductIds)
  const listings = useList((s) => s.data.listings.filter((l) => savedL.includes(l.id)))
  const products = useList((s) => s.data.products.filter((p) => savedP.includes(p.id)))
  return (
    <Screen back backTo="/profile" title={uz.profile.saved} withTabBar>
      <Tabs value={tab} onValueChange={setTab} variant="segmented" size="sm">
        <TabsList fullWidth className="mt-3"><TabsTrigger value="listings" count={listings.length}>{ms.profile.savedListings}</TabsTrigger><TabsTrigger value="products" count={products.length}>{ms.profile.savedProducts}</TabsTrigger></TabsList>
      </Tabs>
      <div className="pt-3">
        {error ? <EmptyState title={ms.common.loadError} action={<Button onClick={reload}>{uz.app.retry}</Button>} /> : loading ? <CardGridSkeleton n={4} /> : (tab === 'listings' ? listings.length : products.length) === 0 ? (
          <EmptyState icon="heart" title={ms.profile.noSaved} hint={ms.profile.noSavedHint} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {tab === 'listings' ? listings.map((l) => <ListingCard key={l.id} listing={l} />) : products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </Screen>
  )
}

export function SavedSearches() {
  const nav = useAppNavigate()
  const me = useMe()
  const items = useList((s) => s.data.savedSearches.filter((x) => x.userId === me.id))
  const categories = useStore((s) => s.data.categories)
  const del = async (id: string) => { await api.listings.deleteSavedSearch(id); toast(ms.profile.searchDeleted) }
  return (
    <Screen back backTo="/profile" title={uz.profile.savedSearches} withTabBar>
      <div className="pt-3">
        {items.length === 0 ? <EmptyState icon="bookmark" title={ms.profile.noSearches} hint={ms.profile.noSearchesHint} action={<Button variant="secondary" onClick={() => nav('/search')}>{uz.app.search}</Button>} /> : (
          <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-card bg-card p-0 shadow-soft">
            {items.map((s) => (
              <li key={s.id} className="flex items-center gap-2 pl-4 pr-1">
                <button type="button" onClick={() => nav(`/search?q=${encodeURIComponent(s.query)}`)} className="min-w-0 flex-1 py-3 text-left">
                  <div className="text-[15px] font-medium">{s.query}</div>
                  <div className="text-[12px] text-ink-3">{[categories.find((c) => c.id === s.categoryId)?.name, s.maxPriceTiyin !== undefined ? <span key="p"><Money tiyin={s.maxPriceTiyin} size="xs" /> {ms.profile.maxPrice}</span> : null].filter(Boolean).map((x, i) => <span key={i}>{i ? ' · ' : ''}{x}</span>)}</div>
                </button>
                <button type="button" onClick={() => void del(s.id)} aria-label={ms.common.remove} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-3 hover:text-brick"><Trash2 size={18} strokeWidth={1.75} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  )
}

export function SettingsScreen() {
  const me = useMe()
  const nav = useAppNavigate()
  const container = usePhoneContainer()
  const [clear, setClear] = useState(false)
  const [del, setDel] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <Screen back backTo="/profile" title={uz.profile.settings} withTabBar>
      <div className="flex flex-col gap-4 pt-3">
        <section className="rounded-card bg-card px-4 py-3 shadow-soft">
          <div className="flex items-center justify-between gap-3"><span className="text-[14px]">{uz.profile.language}</span>
            <Segmented<'uz' | 'ru'> value={me.language} onChange={(v) => { void localApi.setUserPrefs({ language: v }); toast(ms.profile.langSaved) }} options={[{ value: 'uz', label: 'O’zbekcha' }, { value: 'ru', label: 'Русский' }]} /></div>
          {me.language === 'ru' && <p className="m-0 mt-2 text-[12px] text-ink-3">{ms.profile.langNote}</p>}
        </section>
        <section className="divide-y divide-line rounded-card bg-card px-4 shadow-soft">
          <Switch label={ms.profile.notifOn} checked={me.notificationsEnabled} onCheckedChange={(v) => void localApi.setUserPrefs({ notificationsEnabled: v })} />
          <Switch label={ms.profile.cashOn} checked={me.cashOnDelivery} onCheckedChange={(v) => void localApi.setUserPrefs({ cashOnDelivery: v })} />
        </section>
        <section className="divide-y divide-line overflow-hidden rounded-card bg-card shadow-soft">
          <Row icon={<History />} label={uz.profile.clearHistory} sub={uz.profile.clearHistoryHint} onClick={() => setClear(true)} />
          <Row icon={<Trash2 />} label={uz.profile.deleteAccount} danger onClick={() => setDel(true)} />
        </section>
      </div>
      <ConfirmDialog open={clear} onOpenChange={setClear} container={container} title={ms.profile.clearTitle} description={ms.profile.clearDesc} loading={busy}
        onConfirm={async () => { setBusy(true); try { await api.listings.clearHistory(); toast.success(uz.profile.cleared); setClear(false); nav('/') } finally { setBusy(false) } }} />
      <ConfirmDialog open={del} onOpenChange={setDel} container={container} tone="destructive" title={ms.profile.deleteTitle} description={ms.profile.deleteDesc} confirmLabel={uz.profile.deleteAccount}
        onConfirm={() => { setDel(false); toast.info(ms.profile.deleteDemo, { duration: 6000 }) }} />
    </Screen>
  )
}

export function Help() {
  const [open, setOpen] = useState<number | null>(0)
  const reduce = useReducedMotion()
  return (
    <Screen back backTo="/profile" title={ms.profile.helpTitle} withTabBar>
      <ul className="m-0 mt-3 list-none divide-y divide-line overflow-hidden rounded-card bg-card p-0 shadow-soft">
        {ms.profile.faq.map((f, i) => (
          <li key={i}>
            <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left">
              <span className="flex-1 text-[14.5px] font-medium">{f.q}</span>
              <ChevronDown size={18} strokeWidth={1.75} className={`shrink-0 text-ink-3 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <p className="m-0 px-4 pb-4 text-[13.5px] leading-relaxed text-ink-2">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </Screen>
  )
}
