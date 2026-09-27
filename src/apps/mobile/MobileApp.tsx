/**
 * Sharabara — mobil klient (xaridor + sotuvchi). `/m/*` da BrowserRouter ichida yoki /stage’da MemoryRouter ichida ishlaydi.
 */
import { useEffect, useMemo, useState } from 'react'
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStageNav, useAppNavigate, useBase } from '@/lib/router'
import { useIsMobile } from '@/lib/hooks'
import { SPRING } from '@/lib/utils'
import { bus } from '@/api'
import { useStore } from '@/store'
import { PhoneFrame, PushStack, Toaster, toast, usePhoneContainer } from '@/design'
import { TID } from '@/lib/testids'
import { ms } from './strings'
import { TabBar } from './components/TabBar'
import Home from './screens/Home'
import Search from './screens/Search'
import Catalog from './screens/Catalog'
import Mall, { Store } from './screens/Mall'
import ListingScreen, { SellerScreen } from './screens/Listing'
import ProductScreen from './screens/Product'
import ChatScreen, { ChatsList } from './screens/Chat'
import Cart from './screens/Cart'
import Checkout from './screens/Checkout'
import OrdersList, { OrderDetail } from './screens/Orders'
import Notifications from './screens/Notifications'
import Profile, { Help, Saved, SavedSearches, SettingsScreen } from './screens/Profile'
import SellLanding, { SellWizard } from './screens/Sell'
import SellAi from './screens/SellAi'
import SellOffer from './screens/SellOffer'
import MyListings from './screens/MyListings'
import Wallet from './screens/Wallet'
import { BottomBarCtx, Screen } from './components/Screen'
import { Button } from '@/design'
import { EmptyState } from './components/Ui'

const TAB_ROOTS = new Set(['/', '/catalog', '/sell', '/cart', '/profile'])
const DEEP = [/^\/listing\//, /^\/product\//, /^\/store\//, /^\/seller\//, /^\/chat\//, /^\/checkout/, /^\/sell\/(new|ai|offer)/, /^\/orders\/./, /^\/search/]

function NotFound() {
  const nav = useAppNavigate()
  return <Screen back title={ms.common.notFound}><EmptyState icon="compass" title={ms.common.notFound} action={<Button onClick={() => nav('/')}>{ms.common.toHome}</Button>} /></Screen>
}

/** Push (bus) → phone banner, only for the current user. */
function usePushBanners() {
  const nav = useAppNavigate()
  useEffect(() => bus.on('push', (p) => {
    const s = useStore.getState()
    if (p.userId !== s.session.userId) return
    const me = s.data.users.find((u) => u.id === p.userId)
    if (me && me.notificationsEnabled === false) return
    toast.push(p.title, { body: p.body, onClick: p.link ? () => nav(p.link!) : undefined, icon: p.kind === 'chat' ? 'message-circle' : p.kind === 'payout' ? 'wallet' : p.kind === 'order_status' ? 'package' : p.kind === 'price_offer' ? 'badge-percent' : 'stamp' })
  }), [nav])
}

function Shell() {
  useStageNav()
  usePushBanners()
  const { base } = useBase()
  const loc = useLocation()
  const navType = useNavigationType()
  const reduce = useReducedMotion()
  const container = usePhoneContainer()
  const rel = loc.pathname.startsWith(base) ? loc.pathname.slice(base.length) || '/' : loc.pathname
  const deep = DEEP.some((r) => r.test(rel))
  const isRoot = TAB_ROOTS.has(rel)
  const dir = navType === 'POP' ? -1 : navType === 'REPLACE' || isRoot ? 0 : 1

  const [hasBottom, setHasBottom] = useState(false)
  const bottomCtx = useMemo(() => ({ has: hasBottom, set: setHasBottom }), [hasBottom])

  const variants = reduce || dir === 0
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: 24 * dir }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 * dir } }

  return (
    <BottomBarCtx.Provider value={bottomCtx}>
    <div className="relative flex h-full flex-col overflow-hidden bg-paper text-ink">
      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={loc.pathname}
            className="absolute inset-0"
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={reduce ? { duration: 0.12 } : { ...SPRING, opacity: { duration: 0.18 } }}
          >
            <Routes location={loc}>
              <Route index element={<Home />} />
              <Route path="search" element={<Search />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="mall" element={<Mall />} />
              <Route path="store/:companyId" element={<Store />} />
              <Route path="listing/:id" element={<ListingScreen />} />
              <Route path="product/:id" element={<ProductScreen />} />
              <Route path="seller/:userId" element={<SellerScreen />} />
              <Route path="chats" element={<ChatsList />} />
              <Route path="chat/:threadId" element={<ChatScreen />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/saved" element={<Saved />} />
              <Route path="profile/searches" element={<SavedSearches />} />
              <Route path="profile/settings" element={<SettingsScreen />} />
              <Route path="profile/help" element={<Help />} />
              <Route path="profile/payouts" element={<Wallet />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="sell" element={<SellLanding />} />
              <Route path="sell/new" element={<SellWizard />} />
              <Route path="sell/ai/:id" element={<SellAi />} />
              <Route path="sell/offer/:id" element={<SellOffer />} />
              <Route path="sell/my" element={<MyListings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      {!deep && <TabBar />}
      <Toaster container={container} position="bottom" className="!bottom-[84px]" />
    </div>
    </BottomBarCtx.Provider>
  )
}

export default function MobileApp({ embedded = false }: { embedded?: boolean }) {
  const mobile = useIsMobile()
  const theme = useStore((s) => s.session.theme)
  if (embedded) return <Shell />
  if (mobile) {
    return (
      <div className="h-dvh w-full">
        <PhoneFrame variant="bare" theme={theme}>
          <div className="h-full"><Shell /></div>
          <div data-testid={TID.mPush}><PushStack className="!top-2 pt-safe" /></div>
        </PhoneFrame>
      </div>
    )
  }
  return <DesktopFrame theme={theme} />
}

/** Desktopda telefon ramkasi ekran balandligiga sig'adigan qilib masshtablanadi. */
function DesktopFrame({ theme }: { theme: 'light' | 'dark' }) {
  const [scale, setScale] = useState(() => fitScale())
  useEffect(() => {
    const fn = () => setScale(fitScale())
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 overflow-hidden bg-paper-2 px-4 py-4">
      <PhoneFrame theme={theme} time="14:32" scale={scale}>
        <Shell />
      </PhoneFrame>
      <p className="m-0 max-w-[40ch] text-center text-[12.5px] text-ink-3">{ms.hint.desktop}</p>
    </div>
  )
}
function fitScale() {
  if (typeof window === 'undefined') return 1
  return Math.min(1, (window.innerHeight - 72) / 880, (window.innerWidth - 32) / 420)
}
