import { useContext } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { House, LayoutGrid, Plus, ShoppingCart, UserRound } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { cn, SPRING, haptic } from '@/lib/utils'
import { useAppNavigate, useBase } from '@/lib/router'
import { TID } from '@/lib/testids'
import { uz } from '@/i18n/uz'
import { useStore } from '@/store'
import { BottomBarCtx } from './Screen'

const TABS = [
  { key: 'home', path: '/', label: uz.tabs.home, Icon: House, tid: TID.mTabHome },
  { key: 'catalog', path: '/catalog', label: uz.tabs.catalog, Icon: LayoutGrid, tid: TID.mTabCatalog },
  { key: 'sell', path: '/sell', label: uz.tabs.sell, Icon: Plus, tid: TID.mTabSell },
  { key: 'cart', path: '/cart', label: uz.tabs.cart, Icon: ShoppingCart, tid: TID.mTabCart },
  { key: 'profile', path: '/profile', label: uz.tabs.profile, Icon: UserRound, tid: TID.mTabProfile },
] as const

export function activeTab(rel: string): string {
  if (rel === '/' || rel === '' || rel.startsWith('/mall') || rel.startsWith('/notifications') || rel.startsWith('/search')) return 'home'
  if (rel.startsWith('/catalog') || rel.startsWith('/listing') || rel.startsWith('/product') || rel.startsWith('/store') || rel.startsWith('/seller')) return 'catalog'
  if (rel.startsWith('/sell') || rel.startsWith('/wallet')) return 'sell'
  if (rel.startsWith('/cart') || rel.startsWith('/checkout')) return 'cart'
  return 'profile'
}

const COIN = 'radial-gradient(circle at 35% 30%, #fff3c4 0%, #ffd75e 26%, #f5b400 62%, #d99e00 100%)'

/** Oq tab-bar, yuqori chiziq, faol tab navy + oltin nuqta; o’rtada ko’tarilgan 56px oltin «Sotish» tangasi. */
export function TabBar() {
  const { base } = useBase()
  const loc = useLocation()
  const rel = loc.pathname.startsWith(base) ? loc.pathname.slice(base.length) || '/' : loc.pathname
  const active = activeTab(rel)
  const nav = useAppNavigate()
  const cartCount = useStore((s) => s.ui.cart.reduce((a, c) => a + c.qty, 0))
  const reduce = useReducedMotion()
  const raised = !useContext(BottomBarCtx).has
  return (
    <nav aria-label="Asosiy" className="pb-safe relative z-20 shrink-0 border-t border-line bg-card">
      <ul className="m-0 flex list-none items-end justify-between px-2 pb-1 pt-1">
        {TABS.map((tb) => {
          const isActive = active === tb.key
          if (tb.key === 'sell') {
            return (
              <li key={tb.key} className="flex flex-1 justify-center">
                <motion.button
                  type="button"
                  data-testid={tb.tid}
                  aria-label={tb.label}
                  aria-current={isActive ? 'page' : undefined}
                  whileTap={reduce ? undefined : { scale: 0.94 }}
                  transition={SPRING}
                  onClick={() => { haptic(8); nav(tb.path) }}
                  className={cn('flex flex-col items-center gap-0.5 transition-[margin]', raised ? '-mt-7' : 'mt-0')}
                >
                  <span
                    className={cn('inline-flex items-center justify-center rounded-full text-ink transition-all', raised ? 'h-[56px] w-[56px] ring-4 ring-card' : 'h-[34px] w-[34px]')}
                    style={{ background: COIN, boxShadow: raised ? '0 10px 22px -8px rgba(245,180,0,.9), 0 2px 6px rgba(15,31,58,.12)' : '0 2px 6px rgba(245,180,0,.45)' }}
                  >
                    <tb.Icon size={raised ? 28 : 20} strokeWidth={2.6} />
                  </span>
                  <span className={cn('text-[10.5px] font-semibold', isActive ? 'text-ink' : 'text-ink-2')}>{tb.label}</span>
                </motion.button>
              </li>
            )
          }
          return (
            <li key={tb.key} className="flex flex-1 justify-center">
              <motion.button
                type="button"
                data-testid={tb.tid}
                aria-current={isActive ? 'page' : undefined}
                whileTap={reduce ? undefined : { scale: 0.94 }}
                transition={SPRING}
                onClick={() => { haptic(6); nav(tb.path) }}
                className={cn('relative flex h-[50px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-[12px] px-2', isActive ? 'text-ink' : 'text-ink-3')}
              >
                <span className="relative">
                  <tb.Icon size={23} strokeWidth={isActive ? 2.1 : 1.75} />
                  {tb.key === 'cart' && cartCount > 0 && (
                    <span className="tnum absolute -right-2.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brick px-1 text-[10.5px] font-bold text-white ring-2 ring-card">{cartCount}</span>
                  )}
                </span>
                <span className={cn('text-[10.5px]', isActive ? 'font-semibold' : 'font-medium')}>{tb.label}</span>
                {isActive && <motion.span layoutId="tab-dot" className="absolute bottom-0 h-[5px] w-[5px] rounded-full bg-gold-fill" transition={reduce ? { duration: 0 } : SPRING} />}
              </motion.button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
