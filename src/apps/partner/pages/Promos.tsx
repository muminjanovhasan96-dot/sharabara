import { useMemo, useState } from 'react'
import { Tag } from 'lucide-react'
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Money, MoneyInput, ProductImage, Select, Skeleton } from '@/design'
import { toast } from '../toast'
import { api } from '@/api'
import { useNow } from '@/store'
import { daysBetween, formatDemoDate } from '@/domain/clock'
import { formatMoney, percent } from '@/domain/money'
import { t } from '@/i18n/uz'
import { useCompany, useCompanyProducts, useListLoading } from '../hooks'
import { P } from '../strings'
import { CheckBadge, PageHeader } from '../ui'

export function Promos() {
  const c = useCompany()
  const now = useNow()
  const products = useCompanyProducts(c.id)
  const loading = useListLoading(c.id)
  const active = useMemo(() => products.filter((p) => p.promo && p.promo.until >= now).sort((a, b) => a.promo!.until.localeCompare(b.promo!.until)), [products, now])
  const candidates = useMemo(() => products.filter((p) => !p.promo || p.promo.until < now).sort((a, b) => a.title.localeCompare(b.title, 'uz')), [products, now])

  const [pid, setPid] = useState('')
  const [label, setLabel] = useState('')
  const [days, setDays] = useState('7')
  const [price, setPrice] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const product = products.find((p) => p.id === pid)
  const pick = (id: string) => { setPid(id); const p = products.find((x) => x.id === id); setPrice(p ? Math.round(p.priceTiyin * 0.9 / 100000) * 100000 : null) }
  const invalid = !product || !label.trim() || price === null || price >= product.priceTiyin
  const submit = async () => {
    if (invalid || !product || price === null) return
    setBusy(true)
    try {
      await api.partner.createPromo(product.id, label.trim(), Math.max(1, Number(days) || 7), price)
      toast.gold(P.promos.created, { description: `${product.title} · ${label} · ${formatMoney(price)}` })
      setPid(''); setLabel(''); setPrice(null)
    } catch { toast.error(P.products.saveError) } finally { setBusy(false) }
  }

  return (
    <div>
      <PageHeader eyebrow={c.name} title={P.promos.title}>{active.length} {P.promos.active.toLowerCase()}</PageHeader>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div>
          {loading ? <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={120} />)}</div> : active.length === 0 ? (
            <Card padding="md"><EmptyState icon="tag" title={P.promos.empty} hint={P.promos.emptyHint} /></Card>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {active.map((p) => {
                const left = daysBetween(now, p.promo!.until)
                return (
                  <li key={p.id}>
                    <Card padding="sm" className="flex gap-3">
                      <ProductImage id={p.images[0]} className="w-[84px] shrink-0" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2"><Badge tone="gold" size="sm" Icon={Tag}>{p.promo!.label}</Badge><CheckBadge product={p} size="sm" /></div>
                        <div className="clamp-2 text-[14px] leading-snug text-ink">{p.title}</div>
                        <div className="flex flex-wrap items-baseline gap-x-2"><Money tiyin={p.priceTiyin} size="lg" />{p.previousPriceTiyin && <Money tiyin={p.previousPriceTiyin} size="xs" strike />}{p.previousPriceTiyin && <span className="text-[12px] font-semibold text-green">{percent((p.priceTiyin - p.previousPriceTiyin) / p.previousPriceTiyin)}</span>}</div>
                        <div className="mt-auto text-[12px] text-ink-3"><span>{P.promos.ends}: {formatDemoDate(p.promo!.until)} · {left <= 0 ? P.promos.endsToday : t(P.promos.daysLeft, { n: left })}</span></div>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <Card padding="md" className="self-start">
          <CardHeader title={P.promos.create} eyebrow={P.promos.title} />
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void submit() }}>
            <Field label={P.promos.product} required>
              <Select value={pid} onChange={(e) => pick(e.target.value)} placeholder={P.promos.pickProduct}>{candidates.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.title}</option>)}</Select>
            </Field>
            {product && <div className="flex items-center gap-3 rounded-card border border-line bg-paper-2 p-2"><ProductImage id={product.images[0]} className="h-12 w-12 shrink-0" /><div className="min-w-0 flex-1 text-[13px]"><div className="clamp-1 text-ink">{product.title}</div><div className="text-ink-3">{P.promos.oldPrice}: {formatMoney(product.priceTiyin)}</div></div></div>}
            <Field label={P.products.promoLabel} required><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={P.promos.labelPh} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={P.products.promoDays}><Input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/[^\d]/g, ''))} /></Field>
              <Field label={P.products.promoPrice} error={product && price !== null && price >= product.priceTiyin ? P.promos.priceMustBeLower : undefined} hint={product && price !== null && price < product.priceTiyin ? `${P.promos.discount}: ${percent((price - product.priceTiyin) / product.priceTiyin)}` : undefined}>
                <MoneyInput valueTiyin={price} onChangeTiyin={setPrice} disabled={!product} />
              </Field>
            </div>
            <Button type="submit" variant="gold" leading={<Tag />} loading={busy} disabled={invalid}>{P.products.createPromo}</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
