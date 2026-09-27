import { Trash2 } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStore } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { uz, t } from '@/i18n/uz'
import { Avatar, Badge, Button, ErrorState, LedgerRow, Ledger, Money, NumberInput, ProductImage, Seal, toast } from '@/design'
import { EmptyState } from '../components/Ui'
import { ms } from '../strings'
import { sellerOf, useScreenLoad } from '../lib'
import { Screen } from '../components/Screen'
import { RowsSkeleton } from '../components/Cards'

export default function Cart() {
  const nav = useAppNavigate()
  const { loading, error, reload } = useScreenLoad()
  const cart = useStore((s) => s.ui.cart)
  const users = useStore((s) => s.data.users)
  const companies = useStore((s) => s.data.companies)
  const reduce = useReducedMotion()
  const groups = Array.from(cart.reduce((m, c) => { m.set(c.sellerKey, [...(m.get(c.sellerKey) ?? []), c]); return m }, new Map<string, typeof cart>()))
  const total = cart.reduce((a, c) => a + c.priceTiyin * c.qty, 0)
  const count = cart.reduce((a, c) => a + c.qty, 0)
  const remove = async (key: string) => { await api.orders.removeFromCart(key); toast(ms.cart.removed) }

  return (
    <Screen
      title={uz.cart.title} eyebrow={cart.length ? t(uz.cart.items, { n: count }) : undefined} withTabBar
      bottom={cart.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="min-w-0"><div className="text-[11px] font-medium text-ink-3">{uz.cart.total}</div><Money tiyin={total} size="xl" softCurrency className="text-ink" /></div>
          <Button data-testid={TID.mCheckout} variant="gold" size="lg" className="flex-1" onClick={() => nav('/checkout')}>{uz.cart.checkout}</Button>
        </div>
      )}
    >
      {error ? <ErrorState onRetry={reload} className="mt-3" /> : loading ? <div className="pt-3"><RowsSkeleton n={2} /></div> : cart.length === 0 ? (
        <EmptyState icon="shopping-cart" title={uz.cart.empty} hint={uz.cart.emptyHint} action={<Button variant="secondary" onClick={() => nav('/catalog')}>{ms.cart.goCatalog}</Button>} />
      ) : (
        <div className="flex flex-col gap-4 pt-3">
          {groups.length > 1 && <div className="rounded-card bg-gold-soft px-4 py-2.5 text-[13px] font-medium text-ink">{t(uz.cart.splitNote, { n: groups.length })}</div>}
          {groups.map(([key, items], gi) => {
            const s = sellerOf(key, users, companies)
            return (
              <section key={key} className="rounded-card bg-card shadow-soft">
                <header className="flex items-center gap-2.5 border-b border-line px-3 py-2.5">
                  {s.kind === 'company' ? <Seal icon={s.company?.sealIcon ?? 'store'} size={28} variant="ink" /> : <Avatar name={s.name} seed={s.id} size={28} fill="var(--blue-soft)" className="text-blue" />}
                  <div className="min-w-0 flex-1"><div className="clamp-1 text-[14px] font-semibold">{s.name}</div><div className="text-[11px] text-ink-3">{s.kind === 'company' ? ms.cart.company : ms.cart.seller}</div></div>
                  {groups.length > 1 && <Badge tone="outline" size="sm">{t(ms.cart.shipment, { n: gi + 1 })}</Badge>}
                </header>
                <ul className="m-0 list-none divide-y divide-line p-0">
                  <AnimatePresence initial={false}>
                    {items.map((c) => (
                      <motion.li key={c.key} layout={!reduce} initial={false} exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40, height: 0 }} className="flex gap-3 p-3">
                        <button type="button" onClick={() => nav(c.source === 'listing' ? `/listing/${c.refId}` : `/product/${c.refId}`)} className="w-[72px] shrink-0"><ProductImage id={c.image} /></button>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="clamp-2 text-[13.5px] leading-snug">{c.title}</div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <Money tiyin={c.priceTiyin * c.qty} size="md" softCurrency className="font-bold text-ink" />
                            {c.source === 'product' ? (
                              <NumberInput value={c.qty} onChange={(v) => void api.orders.setQty(c.key, v)} min={1} max={99} size="sm" aria-label={ms.product.qty} />
                            ) : <span className="text-[11.5px] text-ink-3">1 {ms.common.pcs}</span>}
                          </div>
                        </div>
                        <button type="button" onClick={() => void remove(c.key)} aria-label={uz.cart.remove} className="-mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full text-ink-3 hover:bg-paper-2 hover:text-brick"><Trash2 size={18} strokeWidth={1.75} /></button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            )
          })}
          <Ledger inset className="!border-0 shadow-soft">
            <LedgerRow label={ms.cart.subtotal} value={<Money tiyin={total} size="sm" />} />
            <LedgerRow label={uz.checkout.deliveryFee} value={<span className="text-[12px] text-ink-3">{ms.cart.deliveryCalc}</span>} />
            <LedgerRow label={uz.cart.total} value={<Money tiyin={total} size="md" />} emphasis />
          </Ledger>
        </div>
      )}
    </Screen>
  )
}
