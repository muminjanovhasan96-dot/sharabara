import type { CSSProperties, ReactNode } from 'react'
import { A, AdminA, DirectorA, HomeA } from './DirectionA'
import { AdminB, B, DirectorB, HomeB } from './DirectionB'
import { AdminC, C, DirectorC, HomeC } from './DirectionC'

/* ─── Sahifa uslubi (neytral, yo’nalishlardan mustaqil) ─────────────────── */
const P = {
  bg: '#FFFFFF', bg2: '#F7F7F8', text: '#111318', text2: '#5C6370', text3: '#8B929E', line: '#E7E9ED',
  font: '-apple-system, "SF Pro Text", Inter, "Segoe UI", Roboto, system-ui, sans-serif',
}

interface Direction {
  id: 'A' | 'B' | 'C'
  name: string
  pitch: string
  accent: string
  accentFg: string
  swatches: { hex: string; label: string }[]
  type: { display: string; body: string; sample: string; names: string }
  why: string
  familiar: string
  mockups: [ReactNode, ReactNode, ReactNode]
}

const directions: Direction[] = [
  {
    id: 'A', name: 'Toza bozor', pitch: 'Oq kartochkalar, katta rasm, narx birinchi — foydalanuvchi o’rganib qolgan marketpleys tartibi.',
    accent: A.gold, accentFg: A.navy,
    swatches: [{ hex: '#F4F5F7', label: 'Fon' }, { hex: '#FFFFFF', label: 'Karta' }, { hex: A.navy, label: 'Matn' }, { hex: A.gold, label: 'Oltin · CTA' }, { hex: A.green, label: 'Ishonch' }, { hex: A.red, label: 'Chegirma' }],
    type: { display: A.font, body: A.font, sample: '6 200 000 so’m', names: 'SF Pro / Inter — sarlavha ham, matn ham' },
    why: 'Sharabara — ommaviy bozor; auditoriyaning katta qismi Uzum va Ozon’ni har kuni ishlatadi. Bu tartib «o’rganish» talab qilmaydi, oltin muhr esa brendni ajratib turadi.',
    familiar: 'Uzum Market, Ozon, Wildberries, OLX (yangi dizayn).',
    mockups: [<HomeA key="h" />, <AdminA key="a" />, <DirectorA key="d" />],
  },
  {
    id: 'B', name: 'Siyoh va oltin', pitch: 'Hozirgi brendning zamonaviy davomi: to’q siyoh sarlavha, iliq fon, oltin urg’u va serif raqamlar — premium ishonch tuyg’usi.',
    accent: B.gold, accentFg: B.ink,
    swatches: [{ hex: B.ink, label: 'Siyoh' }, { hex: B.body, label: 'Fon' }, { hex: '#FFFFFF', label: 'Karta' }, { hex: B.gold, label: 'Oltin' }, { hex: B.goldDeep, label: 'Oltin · to’q' }, { hex: B.green, label: 'Ishonch' }],
    type: { display: B.display, body: B.font, sample: '6 200 000 so’m', names: 'Sarlavha va narx: Bitter (serif) · Matn: IBM Plex Sans' },
    why: '«Narx tekshirilgan» — moliyaviy va’da. Fintech-ga o’xshash to’q va oltin uslub bu va’dani jiddiy ko’rsatadi, Sharabara’ning Instagram’dagi qora-oltin obrazini saqlab qoladi.',
    familiar: 'Apple Card / Wallet, Revolut, Uzum Bank, TBC.',
    mockups: [<HomeB key="h" />, <AdminB key="a" />, <DirectorB key="d" />],
  },
  {
    id: 'C', name: 'Yumshoq va do’stona', pitch: 'Iliq oq fon, 24px burchaklar, kategoriya bo’yicha pastel ranglar va yashil tugmalar — «oddiy odamlar bozori» hissi.',
    accent: C.green, accentFg: '#FFFFFF',
    swatches: [{ hex: C.bg, label: 'Fon' }, { hex: C.green, label: 'Yashil · CTA' }, { hex: C.peach, label: 'Shaftoli' }, { hex: C.mint, label: 'Yalpiz' }, { hex: C.lilac, label: 'Binafsha' }, { hex: C.sky, label: 'Osmon' }, { hex: C.lemon, label: 'Limon' }],
    type: { display: C.font, body: C.font, sample: '6 200 000 so’m', names: 'SF Pro Rounded / Nunito — yumaloq shakl, 17px matn' },
    why: 'Sharabara’da sotuvchilar — oddiy odamlar. Yumshoq shakl va katta 17px matn qo’rquvni olib tashlaydi, e’lon berish oson tuyuladi; oltin muhr kichik, lekin har kartada bor.',
    familiar: 'Telegram, Notion, Yandex Go, Avito (yangi), Payme.',
    mockups: [<HomeC key="h" />, <AdminC key="a" />, <DirectorC key="d" />],
  },
]

const captions = ['Mijoz ilovasi · Bosh sahifa', 'Admin · Boshqaruv paneli', 'Direktor paneli · mobil']

const scores: { label: string; a: number; b: number; c: number }[] = [
  { label: 'O’qilishi', a: 5, b: 4, c: 5 },
  { label: 'Ishonch tuyg’usi', a: 4, b: 5, c: 3 },
  { label: 'Tanishlik', a: 5, b: 3, c: 4 },
  { label: 'Brend o’ziga xosligi', a: 3, b: 5, c: 4 },
  { label: 'Mobil qulaylik', a: 5, b: 4, c: 5 },
]

function Dots({ n, color }: { n: number; color: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 5 }} aria-label={`${n} / 5`}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i <= n ? color : P.line }} />)}
    </span>
  )
}

const h2: CSSProperties = { fontFamily: P.font, fontWeight: 800, letterSpacing: -0.6, color: P.text }

function Section({ d }: { d: Direction }) {
  return (
    <section id={`yonalish-${d.id}`} data-direction={d.id} style={{ padding: '56px 0 64px', borderTop: `1px solid ${P.line}` }}>
      <div style={{ maxWidth: 1392, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 40, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: d.accent, color: d.accentFg, display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 900, fontFamily: P.font }}>{d.id}</span>
              <h2 style={{ ...h2, fontSize: 32, margin: 0 }}>{d.name}</h2>
            </div>
            <p style={{ fontSize: 17, lineHeight: 1.5, color: P.text2, margin: '14px 0 0', maxWidth: 620 }}>{d.pitch}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: P.text3, fontWeight: 700, marginBottom: 10 }}>Ranglar</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {d.swatches.map(s => (
                  <div key={s.hex + s.label} style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 62 }}>
                    <span style={{ height: 40, borderRadius: 10, background: s.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)' }} />
                    <span style={{ fontSize: 10.5, color: P.text2, lineHeight: 1.2 }}>{s.label}<br /><span style={{ color: P.text3, fontVariantNumeric: 'tabular-nums' }}>{s.hex.toUpperCase()}</span></span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: P.text3, fontWeight: 700, marginBottom: 10 }}>Shrift</div>
              <div style={{ border: `1px solid ${P.line}`, borderRadius: 14, padding: '14px 16px', background: P.bg2 }}>
                <div style={{ fontFamily: d.type.display, fontSize: 30, fontWeight: 800, letterSpacing: -0.6, color: P.text, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{d.type.sample}</div>
                <div style={{ fontFamily: d.type.body, fontSize: 15, color: P.text2, marginTop: 8, lineHeight: 1.45 }}>iPhone 13 Pro, 256 GB · Toshkent, Chilonzor<br /><span style={{ color: P.text3, fontSize: 13 }}>{d.type.names}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', padding: '36px 24px 8px' }}>
        <div style={{ display: 'flex', gap: 36, alignItems: 'center', justifyContent: 'center', width: 'max-content', margin: '0 auto', zoom: 0.76 }}>
          {d.mockups.map((m, i) => (
            <figure key={i} style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              {m}
              <figcaption style={{ fontSize: 16, fontWeight: 600, color: P.text2, fontFamily: P.font }}>{captions[i]}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1392, margin: '28px auto 0', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: P.bg2, borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: d.accent === A.gold || d.accent === B.gold ? '#8A6A0C' : d.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Nima uchun bu</div>
          <div style={{ fontSize: 15.5, lineHeight: 1.55, color: P.text }}>{d.why}</div>
        </div>
        <div style={{ background: P.bg2, borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: P.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Kimga tanish</div>
          <div style={{ fontSize: 15.5, lineHeight: 1.55, color: P.text }}>{d.familiar}</div>
        </div>
      </div>
    </section>
  )
}

export default function DesignLab() {
  return (
    <div style={{ minHeight: '100dvh', background: P.bg, color: P.text, fontFamily: P.font, fontSize: 15, WebkitFontSmoothing: 'antialiased' }} data-design-lab>
      <header style={{ maxWidth: 1392, margin: '0 auto', padding: '56px 24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: P.text3, fontWeight: 700 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: A.gold }} />Dizayn laboratoriyasi · 28-sentabr, 2026
        </div>
        <h1 style={{ ...h2, fontSize: 44, margin: '14px 0 0', lineHeight: 1.05 }}>Sharabara — dizayn yo’nalishlari</h1>
        <p style={{ fontSize: 20, color: P.text2, margin: '10px 0 0' }}>3 ta namuna, birini tanlang</p>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: P.text2, margin: '18px 0 0', maxWidth: 760 }}>
          Har bir yo’nalishda uchta haqiqiy ekran ko’rsatilgan: mijoz ilovasining bosh sahifasi, adminning «Boshqaruv paneli» va direktor uchun mobil panel.
          Kontent, narxlar va raqamlar hammasida bir xil — faqat uslub farq qiladi, shuning uchun taqqoslash oson.
        </p>
        <nav style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {directions.map(d => (
            <a key={d.id} href={`#yonalish-${d.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 8px', borderRadius: 999, border: `1px solid ${P.line}`, color: P.text, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: d.accent, color: d.accentFg, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 13 }}>{d.id}</span>{d.name}
            </a>
          ))}
        </nav>
      </header>

      {directions.map(d => <Section key={d.id} d={d} />)}

      <section style={{ borderTop: `1px solid ${P.line}`, padding: '56px 0 72px' }}>
        <div style={{ maxWidth: 1392, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ ...h2, fontSize: 30, margin: 0 }}>Taqqoslash</h2>
          <p style={{ fontSize: 15.5, color: P.text2, margin: '8px 0 24px' }}>Dizayner bahosi, 1–5 nuqta. Yakuniy qaror — sizniki.</p>
          <div style={{ border: `1px solid ${P.line}`, borderRadius: 16, overflow: 'hidden', maxWidth: 960 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: P.font }}>
              <thead>
                <tr style={{ background: P.bg2 }}>
                  <th style={{ textAlign: 'left', padding: '14px 18px', fontSize: 13, color: P.text3, fontWeight: 700 }}>Mezon</th>
                  {directions.map(d => (
                    <th key={d.id} style={{ textAlign: 'left', padding: '14px 18px', fontSize: 14, fontWeight: 700, color: P.text }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 22, height: 22, borderRadius: 6, background: d.accent, color: d.accentFg, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900 }}>{d.id}</span>{d.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scores.map(s => (
                  <tr key={s.label} style={{ borderTop: `1px solid ${P.line}` }}>
                    <td style={{ padding: '14px 18px', fontSize: 15, fontWeight: 600 }}>{s.label}</td>
                    <td style={{ padding: '14px 18px' }}><Dots n={s.a} color={A.navy} /></td>
                    <td style={{ padding: '14px 18px' }}><Dots n={s.b} color={B.goldDeep} /></td>
                    <td style={{ padding: '14px 18px' }}><Dots n={s.c} color={C.green} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, margin: '40px 0 0', color: P.text }}>Tanlaganingizni ayting: A, B yoki C — butun ilova shu uslubga o’tkaziladi.</p>
        </div>
      </section>
    </div>
  )
}
