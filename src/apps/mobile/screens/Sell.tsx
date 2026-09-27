import { useEffect, useRef, useState } from 'react'
import { Reorder, useReducedMotion } from 'framer-motion'
import { Camera, GripVertical, Images, Sparkles, X } from 'lucide-react'
import { useStore } from '@/store'
import { api } from '@/api'
import { useAppNavigate } from '@/lib/router'
import { TID } from '@/lib/testids'
import { cn } from '@/lib/utils'
import { uz, t } from '@/i18n/uz'
import { GOLDEN } from '@/seed'
import { Badge, Button, ChipGroup, Field, Illustration, Input, MoneyInput, Money, ProductImage, Progress, Select, Textarea, toast } from '@/design'
import { GoldCoin, NavyCard, PastelTile, StepDot, categoryTone } from '../components/Ui'
import type { Condition, Listing, RegionId } from '@/domain/types'
import { ms } from '../strings'
import { useList, useMe, useQuery, useRegions } from '../lib'
import { Screen, SectionTitle } from '../components/Screen'

const DISTRICTS: Partial<Record<RegionId, string[]>> = {
  toshkent_sh: ['Chilonzor', 'Yunusobod', 'Mirzo Ulug’bek', 'Yakkasaroy', 'Sergeli', 'Shayxontohur'],
  namangan: ['Markaz', 'Davlatobod', 'Uychi', 'Chortoq'], andijon: ['Markaz', 'Asaka'], samarqand: ['Registon', 'Urgut'], fargona: ['Markaz', 'Qo’qon'],
}

/* ─── Landing ────────────────────────────────────────────────────────── */
export default function SellLanding() {
  const nav = useAppNavigate()
  const me = useMe()
  const q = useQuery()
  const mine = useList((s) => s.data.listings.filter((l) => l.sellerId === me.id && !l.historical && l.status !== 'removed').slice(0, 3))
  useEffect(() => { if (q.get('golden') === '1') nav('/sell/new?golden=1', { replace: true }) }, [q, nav])
  return (
    <Screen title={uz.sell.title} withTabBar>
      <NavyCard padding="lg" className="mt-3 flex flex-col items-start gap-3">
        <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,180,0,.4) 0%, rgba(245,180,0,0) 70%)' }} aria-hidden="true" />
        <div className="relative flex w-full items-start justify-between gap-3">
          <div className="min-w-0"><h2 className="m-0 font-display text-[22px] leading-tight text-white">{ms.sell.landingTitle}</h2><p className="m-0 mt-1.5 text-[13.5px] leading-snug text-white/75">{ms.sell.landingSub}</p></div>
          <GoldCoin size={56} Icon={Camera} className="mt-0.5" />
        </div>
        <Button data-testid={TID.mSellStart} variant="gold" size="lg" fullWidth className="relative" onClick={() => nav('/sell/new')} leading={<Camera strokeWidth={1.75} />}>{ms.sell.start}</Button>
      </NavyCard>
      <section className="mt-5">
        <SectionTitle>{ms.sell.how}</SectionTitle>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {ms.sell.steps.map((s, i) => <li key={i} className="flex items-center gap-3 rounded-card bg-card px-3 py-2.5 text-[14px] shadow-soft"><StepDot n={i + 1} tone={i === 0 ? 'blue' : i === 1 ? 'gold' : 'green'} />{s}</li>)}
        </ol>
      </section>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => nav('/sell/my')}>{uz.sell.myListings}</Button>
        <Button variant="secondary" onClick={() => nav('/wallet')}>{uz.wallet.title}</Button>
      </div>
      {mine.length > 0 && (
        <section className="mt-5">
          <SectionTitle action={ms.common.seeAll} onAction={() => nav('/sell/my')}>{ms.sell.recent}</SectionTitle>
          <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-card bg-card p-0 shadow-soft">
            {mine.map((l) => (
              <li key={l.id}><button type="button" onClick={() => nav(l.status === 'offer_sent' ? `/sell/offer/${l.id}` : l.status === 'published' || l.status === 'sold' ? `/listing/${l.id}` : '/sell/my')} className="flex w-full items-center gap-3 p-3 text-left"><div className="w-12"><ProductImage id={l.images[0] ?? 'ill-phone-1'} /></div><div className="min-w-0 flex-1"><div className="clamp-1 text-[14px]">{l.title}</div><div className="mt-0.5 flex items-center gap-2"><Money tiyin={l.priceTiyin} size="sm" /><Badge size="sm" tone={l.status === 'published' ? 'green' : l.status === 'offer_sent' ? 'gold' : 'neutral'}>{uz.listing.status[l.status]}</Badge></div></div></button></li>
            ))}
          </ul>
        </section>
      )}
    </Screen>
  )
}

/* ─── Wizard (step 1) ────────────────────────────────────────────────── */
interface Photo { id: string; src: string; file?: File }
const SAMPLE: Photo[] = ['ill-phone-1', 'ill-phone-2', 'ill-phone-3', 'ill-phone-4'].map((id) => ({ id, src: id }))

function useTypewriter(active: boolean, targets: Record<string, string>, setter: (k: string, v: string) => void, onDone: () => void, totalMs = 3200) {
  const done = useRef(false)
  useEffect(() => {
    if (!active || done.current) return
    done.current = true
    const keys = Object.keys(targets)
    const totalChars = keys.reduce((a, k) => a + targets[k].length, 0)
    const perChar = Math.max(8, Math.min(40, totalMs / Math.max(1, totalChars)))
    let ki = 0; let ci = 0
    const tick = () => {
      if (ki >= keys.length) { setTimeout(onDone, 350); return }
      const k = keys[ki]; ci += 1
      setter(k, targets[k].slice(0, ci))
      if (ci >= targets[k].length) { ki += 1; ci = 0; setTimeout(tick, 160) } else setTimeout(tick, perChar)
    }
    setTimeout(tick, 300)
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function SellWizard() {
  const q = useQuery()
  const golden = q.get('golden') === '1'
  const editId = q.get('id')
  const existing = useStore((s) => s.data.listings.find((l) => l.id === (golden ? GOLDEN.listingId : editId)))
  return <WizardInner key={`${golden}-${editId ?? ''}-${existing?.id ?? ''}`} golden={golden} editId={editId} existing={existing} />
}

function WizardInner({ golden, editId, existing }: { golden: boolean; editId: string | null; existing: Listing | undefined }) {
  const nav = useAppNavigate()
  const me = useMe()
  const regions = useRegions()
  const categories = useList((s) => s.data.categories.filter((c) => !c.parentId))
  const reduce = useReducedMotion()
  const prefill = existing && !golden ? existing : null
  const autoplay = golden && !!existing

  const [photos, setPhotos] = useState<Photo[]>(() => (autoplay ? SAMPLE : prefill ? prefill.images.map((id) => ({ id, src: id })) : []))
  const [cat, setCat] = useState<string | null>(() => (autoplay ? 'telefonlar' : prefill?.categoryId ?? null))
  const [title, setTitle] = useState(() => prefill?.title ?? '')
  const [desc, setDesc] = useState(() => prefill?.description ?? '')
  const [region, setRegion] = useState<RegionId>(() => existing?.regionId ?? me.regionId)
  const [district, setDistrict] = useState(() => existing?.district ?? '')
  const [cond, setCond] = useState<Condition>(() => existing?.condition ?? 'B')
  const [imei, setImei] = useState(() => prefill?.imei ?? '')
  const [price, setPrice] = useState<number | null>(() => prefill?.askingTiyin ?? null)
  const [attrs, setAttrs] = useState<Record<string, string | number>>(() => existing?.attributes ?? {})
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // golden autoplay: text via typewriter, then auto-submit
  const submitRef = useRef<() => void>(() => {})
  useTypewriter(
    autoplay,
    existing ? { title: existing.title, imei: existing.imei ?? '', price: String(Math.trunc(existing.askingTiyin / 100)), desc: existing.description } : {},
    (k, v) => { if (k === 'title') setTitle(v); else if (k === 'imei') setImei(v); else if (k === 'price') setPrice(v ? Number(v) * 100 : null); else setDesc(v) },
    () => submitRef.current(),
    reduce ? 600 : 3400,
  )

  const category = categories.find((c) => c.id === cat)
  const isPhone = cat === 'telefonlar'
  const imeiOk = !isPhone || imei.length === 0 || /^\d{15}$/.test(imei)
  const errors = {
    photos: photos.length === 0 ? ms.sell.photosRequired : undefined,
    cat: !cat ? ms.sell.categoryRequired : undefined,
    title: title.trim().length < 3 ? ms.sell.titleRequired : undefined,
    price: !price ? ms.sell.priceRequired : undefined,
    imei: !imeiOk ? ms.sell.imeiInvalid : undefined,
  }
  const valid = !Object.values(errors).some(Boolean)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files).slice(0, 8 - photos.length).map((f) => ({ id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 6)}`, src: URL.createObjectURL(f), file: f }))
    setPhotos((p) => [...p, ...next])
  }
  const submit = async () => {
    setTouched(true)
    if (!valid || !cat) return
    setBusy(true)
    try {
      const images = photos.map((p) => p.src)
      const l = await api.listings.submit({
        id: golden ? GOLDEN.listingId : editId ?? undefined,
        categoryId: cat, title: title.trim(), description: desc.trim(), images, regionId: region, district: district || undefined,
        condition: cond, askingTiyin: price!, imei: isPhone && imei ? imei : undefined, attributes: attrs,
      })
      nav(`/sell/ai/${l.id}`, { replace: true })
    } catch (e) { toast.error(e instanceof Error ? e.message : uz.app.error); setBusy(false) }
  }
  useEffect(() => { submitRef.current = () => { void submit() } })

  return (
    <Screen back backTo="/sell" title={uz.sell.title} eyebrow={`1/3 · ${uz.sell.step1}`}
      bottom={<Button data-testid={TID.mSellSubmit} variant="gold" size="lg" fullWidth onClick={submit} loading={busy} disabled={touched && !valid} leading={<Sparkles strokeWidth={1.75} />}>{busy ? ms.sell.submitting : uz.sell.submit}</Button>}>
      <Progress value={1} max={3} size="sm" className="mt-3 [&>div]:bg-gold-fill" />
      {autoplay && <div className="mt-3 flex items-center gap-2 rounded-card bg-gold-soft px-3 py-2 text-[12.5px] font-medium text-ink"><Sparkles size={14} className="text-gold" strokeWidth={1.75} />{ms.sell.autoplay}</div>}
      <div className="flex flex-col gap-5 pt-4">
        <Field label={uz.sell.photos} hint={uz.sell.photosHint} error={touched ? errors.photos : undefined}>
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
          <Reorder.Group axis="x" values={photos} onReorder={setPhotos} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1" as="ul" style={{ listStyle: 'none', margin: 0 }}>
            {photos.map((p, i) => (
              <Reorder.Item key={p.id} value={p} as="li" className="relative h-[88px] w-[88px] shrink-0 cursor-grab touch-none overflow-hidden rounded-[10px] border border-line bg-paper-2 active:cursor-grabbing" whileDrag={reduce ? undefined : { scale: 1.06 }}>
                {p.src.startsWith('ill-') ? <div className="h-full w-full bg-paper-2 p-3 text-ink"><Illustration id={p.src} /></div> : <img src={p.src} alt="" className="h-full w-full object-cover" />}
                {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-ink px-1.5 text-[9.5px] font-semibold text-white">1</span>}
                <span className="absolute bottom-1 right-1 text-ink-3"><GripVertical size={12} /></span>
                <button type="button" onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))} aria-label={ms.sell.remove} className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-ink-2"><X size={12} strokeWidth={2} /></button>
              </Reorder.Item>
            ))}
            <li className="flex shrink-0 flex-col gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-blue/40 bg-blue-soft text-[11px] font-medium text-blue"><Camera size={20} strokeWidth={1.75} />{uz.sell.addPhoto}</button>
            </li>
          </Reorder.Group>
          <div className="mt-1 flex items-center justify-between">
            <span className="tnum text-[12px] text-ink-3">{t(ms.sell.photosCount, { n: photos.length })} · {ms.sell.dragHint}</span>
            <Button variant="link" size="sm" onClick={() => setPhotos(SAMPLE)} leading={<Images strokeWidth={1.75} />}>{ms.sell.samples}</Button>
          </div>
        </Field>

        <Field label={uz.sell.category} required error={touched ? errors.cat : undefined}>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1">
            {categories.map((c, i) => (
              <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)} className="flex w-[68px] shrink-0 flex-col items-center gap-1">
                <PastelTile icon={c.icon} size={56} radius={16} tone={categoryTone(c.id, i)} className={cn('transition-shadow', cat === c.id && 'ring-2 ring-ink ring-offset-2 ring-offset-paper')} />
                <span className={cn('clamp-1 w-full text-center text-[10.5px]', cat === c.id ? 'font-semibold text-ink' : 'text-ink-2')}>{c.name}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label={uz.sell.name} required error={touched ? errors.title : undefined}><Input data-testid={TID.mSellTitle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="iPhone 13 Pro, 256 GB, Sierra Blue" /></Field>
        <Field label={uz.sell.description}><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Holati, komplekt, kamchiliklari…" /></Field>

        {category && category.attributes.filter((a) => a.type === 'select').length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {category.attributes.filter((a) => a.type === 'select').map((a) => (
              <Field key={a.key} label={a.label}><Select value={String(attrs[a.key] ?? '')} onChange={(e) => setAttrs({ ...attrs, [a.key]: e.target.value })} placeholder="—" options={(a.options ?? []).map((o) => ({ value: o, label: o }))} /></Field>
            ))}
          </div>
        )}

        <Field label={uz.condition.label}>
          <ChipGroup<Condition> size="sm" value={cond} onChange={(v) => v && setCond(v)} allowEmpty={false} options={(['A', 'B', 'C', 'D'] as Condition[]).map((c) => ({ value: c, label: uz.condition[c] }))} />
          {category && <p className="m-0 mt-1 text-[12px] text-ink-3">{category.conditionNotes[cond]}</p>}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={uz.sell.region}><Select value={region} onChange={(e) => { setRegion(e.target.value as RegionId); setDistrict('') }} options={regions.map((r) => ({ value: r.id, label: r.name }))} /></Field>
          <Field label={uz.sell.district}><Select value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="—" options={(DISTRICTS[region] ?? []).map((d) => ({ value: d, label: d }))} /></Field>
        </div>

        {isPhone && (
          <Field label={uz.sell.imei} hint={uz.sell.imeiHint} error={touched ? errors.imei : undefined}>
            <Input data-testid={TID.mSellImei} inputMode="numeric" maxLength={17} value={imei.replace(/(\d{5})(?=\d)/g, '$1 ')} onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))} placeholder="35678 91041 23457" className="tnum" invalid={touched && !imeiOk} />
          </Field>
        )}

        <Field label={uz.sell.yourPrice} required error={touched ? errors.price : undefined}>
          <MoneyInput data-testid={TID.mSellPrice} valueTiyin={price} onChangeTiyin={setPrice} size="lg" placeholder="0" />
        </Field>
      </div>
    </Screen>
  )
}

