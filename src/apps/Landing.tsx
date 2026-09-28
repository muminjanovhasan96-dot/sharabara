import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gauge, LayoutDashboard, LayoutPanelLeft, Monitor, Palette, Smartphone, Sparkles, Store, Truck } from 'lucide-react'
import QRCode from 'qrcode'
import { Seal } from '@/design'

/** Bosh sahifa: 3 ta katta yo'l — Hikoya (asosiy), Telefon, Kompyuter. Qolgani kichik havolalar. */
const MORE = [
  { to: '/direktor', title: 'Direktor paneli', Icon: Gauge },
  { to: '/partner', title: 'Kompaniya kabineti', Icon: Store },
  { to: '/bts', title: 'BTS paneli', Icon: Truck },
  { to: '/stage', title: 'Ekspert sahna (ikki ekran)', Icon: LayoutPanelLeft },
  { to: '/dizayn', title: 'Dizayn namunalari', Icon: Palette },
]

function useQr(url: string) {
  const [svg, setSvg] = useState('')
  useEffect(() => { let on = true; QRCode.toString(url, { type: 'svg', margin: 1, width: 132, color: { dark: '#1a2430', light: '#0000' } }).then((s) => { if (on) setSvg(s) }).catch(() => {}); return () => { on = false } }, [url])
  return svg
}

export function Landing() {
  const phoneUrl = typeof window !== 'undefined' ? `${window.location.origin}${import.meta.env.BASE_URL}m` : ''
  const qr = useQr(phoneUrl)
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-8 flex items-center gap-4">
          <Seal variant="gold" icon="check" size={56} />
          <div className="min-w-0">
            <h1 className="m-0 font-display text-[30px] leading-tight sm:text-[36px]">Sharabara</h1>
            <p className="m-0 mt-0.5 text-[15px] text-ink-2">Narx bilan yutadigan marketpleys · investor demo</p>
          </div>
        </header>

        {/* 1. Hikoya — asosiy */}
        <Link to="/hikoya" className="paper-texture group relative mb-4 flex flex-col gap-5 overflow-hidden rounded-[24px] bg-ink p-6 text-white shadow-soft transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(227,190,74,.35) 0%, rgba(227,190,74,0) 70%)' }} aria-hidden="true" />
          <Seal variant="gold" icon="sparkles" size={80} />
          <div className="relative min-w-0 flex-1">
            <div className="eyebrow !text-gold-fill">1 · Shu yerdan boshlang</div>
            <div className="mt-1 font-display text-[28px] leading-tight sm:text-[32px]">Hikoyani ko’rish</div>
            <p className="m-0 mt-2 max-w-[560px] text-[15px] leading-snug text-white/80">Bitta savdo, 11 qadam, 3 daqiqa. Har qadamda faqat bitta ekran: yoki telefon, yoki kompyuter — va Sharabara bundan nima topishi.</p>
          </div>
          <span className="relative inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-[14px] bg-gold-fill px-5 text-[15px] font-semibold text-ink shadow-[0_10px_24px_-10px_rgba(227,190,74,.9)] sm:self-center"><Sparkles size={18} strokeWidth={2} />Boshlash<ArrowRight size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" /></span>
        </Link>

        {/* 2–3. Telefon va Kompyuter */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/m" className="group flex gap-4 rounded-[22px] border border-line bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink shadow-[inset_0_0_0_1px_var(--line)]"><Smartphone size={22} strokeWidth={1.75} /></span>
            <span className="min-w-0 flex-1">
              <span className="eyebrow">2 · Xaridor va sotuvchi uchun</span>
              <span className="mt-0.5 block font-display text-[22px] leading-tight">Telefon ilovasi</span>
              <span className="mt-1 block text-[14px] leading-snug text-ink-2">«Narx tekshirilgan» e’lonlar, sotish ustasi, savat, buyurtma, hamyon. Kompyuterda telefon ramkasida ochiladi.</span>
              {qr && (
                <span className="mt-3 flex items-center gap-3 rounded-[14px] bg-paper p-2.5">
                  <span className="h-[96px] w-[96px] shrink-0 rounded-[8px] bg-white p-1 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} aria-hidden="true" />
                  <span className="text-[12.5px] leading-snug text-ink-2">O’z telefoningizda oching: kamera bilan skanerlang — ilova to’liq ekranda ishlaydi.</span>
                </span>
              )}
            </span>
          </Link>
          <Link to="/admin" className="group flex gap-4 rounded-[22px] border border-line bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink shadow-[inset_0_0_0_1px_var(--line)]"><Monitor size={22} strokeWidth={1.75} /></span>
            <span className="min-w-0 flex-1">
              <span className="eyebrow">3 · Sharabara jamoasi uchun</span>
              <span className="mt-0.5 block font-display text-[22px] leading-tight">Kompyuter: admin panel</span>
              <span className="mt-1 block text-[14px] leading-snug text-ink-2">Narx tahlili, moderatsiya, logistika, to’lovlar, audit. Standart holatda faqat 6 asosiy bo’lim; qolganlari «Barcha bo’limlar» ostida.</span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold"><LayoutDashboard size={14} strokeWidth={2} />Ochish<ArrowRight size={14} strokeWidth={2} /></span>
            </span>
          </Link>
        </div>

        <div className="mt-8">
          <div className="eyebrow mb-2">Qo’shimcha ekranlar</div>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {MORE.map(({ to, title, Icon }) => (
              <li key={to}><Link to={to} className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-line bg-card px-3.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><Icon size={15} strokeWidth={1.9} />{title}</Link></li>
            ))}
          </ul>
        </div>
        <p className="mt-8 text-xs text-ink-3">Barcha kompaniya nomlari, filiallar va raqamlar shartli (namuna). Backend yo’q — ma’lumot brauzerda saqlanadi.</p>
      </div>
    </main>
  )
}
