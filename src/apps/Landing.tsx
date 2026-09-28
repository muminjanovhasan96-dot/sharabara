import { Link } from 'react-router-dom'
import { Gauge, LayoutDashboard, Monitor, Smartphone, Store, Truck, ArrowRight, Sparkles, Clock3 } from 'lucide-react'
import { Seal } from '@/design'

/** Tavsiya etilgan tartib: 1 Demo sahnasi → 2 Mijoz → 3 Admin → 4 Direktor → 5 Kompaniya → 6 BTS. Har karta: kim uchun · nimani ko'rsatadi · qancha vaqt. */
const CARDS = [
  { to: '/stage', title: 'Demo sahnasi', who: 'Investor va hamkorlar uchun', what: 'Telefon va xodim kompyuteri yonma-yon. «Oltin yo’l» tugmasi bitta savdoni 11 qadamda o’zi ko’rsatadi: e’lon → narx tahlili → xarid → yetkazish → to’lov.', time: '3 daqiqa', Icon: Monitor, primary: true },
  { to: '/m', title: 'Mijoz ilovasi', who: 'Xaridor va sotuvchi uchun', what: '«Narx tekshirilgan» e’lonlar, sotish ustasi, savat, buyurtma kuzatuvi, hamyon.', time: '2 daqiqa', Icon: Smartphone },
  { to: '/admin', title: 'Admin panel', who: 'Sharabara jamoasi uchun', what: 'Narx tahlili, moderatsiya, logistika, to’lovlar, audit. 8 rol, har rol o’z bo’limlarini ko’radi.', time: '5 daqiqa', Icon: LayoutDashboard },
  { to: '/direktor', title: 'Direktor paneli', who: 'Rahbariyat uchun', what: 'Bugungi savdo, pul, ombor va muammolar — bir ekranda, telefonda ham.', time: '1 daqiqa', Icon: Gauge },
  { to: '/partner', title: 'Kompaniya kabineti', who: 'Mall hamkorlari uchun', what: 'Tovar va zaxira, Excel yuklash, narx tekshiruvi, hisob-kitob, API kalitlari.', time: '2 daqiqa', Icon: Store },
  { to: '/bts', title: 'BTS paneli', who: 'Yetkazish hamkori uchun', what: 'Kechki partiyani qabul qilish, yuk holatlari, filiallar. Planshetga mo’ljallangan.', time: '1 daqiqa', Icon: Truck },
]

export function Landing() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="paper-texture mb-6 flex flex-col gap-5 rounded-[22px] bg-ink p-6 text-white shadow-soft sm:flex-row sm:items-center sm:p-8">
          <Seal variant="gold" icon="check" size={80} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow !text-white/60">Investor demo · veb-prototip</p>
            <h1 className="font-display text-3xl sm:text-4xl">Sharabara</h1>
            <p className="mt-1 text-white/80">Narx bilan yutamiz. Har e’lon tekshiriladi, har so’m ko’rinadi.</p>
          </div>
        </header>

        {/* Birinchi marta? */}
        <Link to="/stage" className="mb-6 flex items-center gap-4 rounded-[18px] border border-gold/40 bg-gold-soft p-4 text-ink transition-transform hover:-translate-y-0.5 sm:p-5">
          <Seal variant="gold" icon="sparkles" size={56} />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[19px] leading-tight">Birinchi marta? «Demo sahnasi»dan boshlang</span>
            <span className="mt-1 block text-[14px] text-ink-2">Ochilgach, yuqori o’ngdagi <b className="text-ink">«Oltin yo’l»</b> tugmasini bosing — 3 daqiqada butun jarayonni o’zi ko’rsatadi. Keyin qolgan ekranlarni pastdagi tartibda oching.</span>
          </span>
          <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[12px] bg-gold-fill px-4 text-[14px] font-semibold text-ink shadow-[0_8px_18px_-8px_rgba(227,190,74,.8)]"><Sparkles size={16} strokeWidth={2} />Boshlash</span>
        </Link>

        <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
          {CARDS.map(({ to, title, who, what, time, Icon, primary }, i) => (
            <li key={to} className={primary ? 'sm:col-span-2' : ''}>
              <Link to={to} className="group flex h-full gap-4 rounded-[18px] border border-line bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5 active:scale-[.99]">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink shadow-[inset_0_0_0_1px_var(--line)]">
                  <Icon size={22} strokeWidth={1.75} />
                  <span className="tnum absolute -left-1.5 -top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold-fill text-[12px] font-bold text-ink">{i + 1}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="eyebrow">{who}</span>
                  <span className="mt-0.5 flex items-center gap-2 font-display text-xl">{title}<ArrowRight size={18} className="text-gold opacity-0 transition-opacity group-hover:opacity-100" /></span>
                  <span className="mt-1 block text-[14px] leading-snug text-ink-2">{what}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-3"><Clock3 size={13} strokeWidth={2} />{time}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-xs text-ink-3">Barcha kompaniya nomlari, filiallar va raqamlar shartli (namuna). Backend yo’q — ma’lumot brauzerda saqlanadi. Dizayn namunalari: <Link to="/dizayn" className="text-gold underline-offset-2 hover:underline">/dizayn</Link></p>
      </div>
    </main>
  )
}
