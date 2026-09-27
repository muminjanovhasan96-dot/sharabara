import { Link } from 'react-router-dom'
import { Gauge, LayoutDashboard, Monitor, Smartphone, Store, Truck, ArrowRight, ShieldCheck } from 'lucide-react'
import { Seal } from '@/design'

const CARDS = [
  { to: '/stage', title: 'Demo sahnasi', desc: 'Telefon va admin panel yonma-yon, jonli bog’langan. «Oltin yo’l» avtomatik ssenariy shu yerda.', eyebrow: 'Taqdimot', Icon: Monitor, primary: true },
  { to: '/m', title: 'Mijoz ilovasi', desc: 'Xaridor va sotuvchi bitta ilovada. Telefonda to’liq ekran.', eyebrow: 'Mobil', Icon: Smartphone },
  { to: '/direktor', title: 'Direktor paneli', desc: 'Bir ekranda butun biznes: savdo, pul, ombor, muammolar. Telefonda ham.', eyebrow: 'Rahbariyat', Icon: Gauge },
  { to: '/admin', title: 'Admin panel', desc: '18 bo’lim, 9 rol. Narx tahlili, logistika, ombor, to’lovlar, audit.', eyebrow: 'Sharabara jamoasi', Icon: LayoutDashboard },
  { to: '/partner', title: 'Kompaniya kabineti', desc: 'Mall hamkorlari: tovar, zaxira, Excel, API, hisob-kitob.', eyebrow: 'Mall', Icon: Store },
  { to: '/bts', title: 'BTS paneli', desc: 'Kechki partiya, yuk statuslari. Planshet uchun katta tugmalar.', eyebrow: 'Hamkor', Icon: Truck },
]

export function Landing() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <header className="mb-8 flex flex-col gap-5 rounded-[22px] bg-ink p-6 text-white shadow-soft sm:flex-row sm:items-center sm:p-8">
          <Seal variant="gold" icon="check" size={80} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow !text-white/60">Investor demo · veb-prototip</p>
            <h1 className="font-display text-3xl sm:text-4xl">Sharabara</h1>
            <p className="mt-1 text-white/80">Narx bilan yutamiz. Har e’lon tekshiriladi, har so’m ko’rinadi.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[13px]"><ShieldCheck size={16} className="text-gold-fill" /> Narx tekshirilgan · 160 e’lon</div>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {CARDS.map(({ to, title, desc, eyebrow, Icon, primary }) => (
            <Link key={to} to={to} className={`group flex gap-4 rounded-[18px] border border-line bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5 active:scale-[.99] ${primary ? 'sm:col-span-2' : ''}`}>
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${primary ? 'bg-gold-soft text-[#8a6400]' : 'bg-blue-soft text-blue'}`}><Icon size={24} strokeWidth={1.75} /></span>
              <span className="min-w-0 flex-1">
                <span className="eyebrow">{eyebrow}</span>
                <span className="mt-0.5 flex items-center gap-2 font-display text-xl">{title}<ArrowRight size={18} className="text-blue opacity-0 transition-opacity group-hover:opacity-100" /></span>
                <span className="mt-1 block text-[14px] text-ink-2">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-xs text-ink-3">Barcha kompaniya nomlari, filiallar va raqamlar shartli (namuna). Backend yo’q — ma’lumot brauzerda saqlanadi. Dizayn namunalari: <Link to="/dizayn" className="text-blue">/dizayn</Link></p>
      </div>
    </main>
  )
}
