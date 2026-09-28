/**
 * D yo'nalishi — asos B («Siyoh va oltin»), A («Toza bozor») dan faqat uslub aksentlari.
 * B (asos): siyoh sarlavha-blok bosh sahifa tepasida, qorong'i tab-bar va admin menyusi, Bitter serif narx/sarlavhalar, oltin urg'u.
 * A (aksent): oq kartochkalarda katta rasm va narx birinchi, 4×2 kategoriya plitkalari, yorug' admin kontenti va oq KPI kartalar.
 */
import type { CSSProperties } from 'react'
import { BarChart3, Bell, Boxes, Camera, ChevronDown, ChevronRight, Heart, Home, LayoutGrid, MapPin, MessageCircle, PackageX, Plus, Search, Settings, ShieldCheck, TriangleAlert, User, Wallet } from 'lucide-react'
import { TabBar } from './DirectionA'
import {
  Bars, Donut, Ellipsis, Monitor, Phone, Photo, Row, Seal, Sparkline, adminNav, badgeLabel, categories, channels, dayLabels14, kpis, orders, products,
  revenue14, stateLabel, stockAlerts, tnum, topProducts, type Product,
} from './shared'

export const D = {
  page: '#F6F3EC', card: '#FFFDF8', ink: '#1A2430', ink2: '#24303F', text: '#1A2430', text2: '#4E5763', text3: '#7A828D',
  line: '#E7E0D2', lineDark: 'rgba(255,255,255,.09)', gold: '#E3BE4A', goldDeep: '#B8901E', goldSoft: '#F8F0D6',
  green: '#2E6B4A', greenSoft: '#E3EFE7', red: '#A63A2A', redSoft: '#F5E3DF', info: '#2F5F8F', infoSoft: '#E6EEF6', amber: '#B8901E', amberSoft: '#F8F0D6',
  display: '"Bitter", Georgia, "Times New Roman", serif', font: 'Inter, -apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
}
export const channelColorsD = [D.ink, D.goldDeep, D.gold, D.info]

const card: CSSProperties = { background: D.card, borderRadius: 22, boxShadow: '0 1px 2px rgba(26,36,48,.04), 0 12px 30px -18px rgba(26,36,48,.18)' }
const display: CSSProperties = { fontFamily: D.display, fontWeight: 700, letterSpacing: -0.3 }

function BadgeD({ kind }: { kind: Product['badge'] }) {
  if (kind === 'checked') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, padding: '4px 8px', borderRadius: 999, background: D.green, color: '#fff', whiteSpace: 'nowrap' }}><ShieldCheck size={11} strokeWidth={2.6} />{badgeLabel.checked}</span>
  const bg = kind === 'official' ? D.ink : D.red
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: '4px 8px', borderRadius: 999, background: bg, color: kind === 'official' ? D.gold : '#fff', whiteSpace: 'nowrap' }}>{badgeLabel[kind]}</span>
}

/** A'ning kartasi (rasm katta, narx birinchi) + B'ning serif narxi */
function ProductCardD({ p, w = 164, peek = false }: { p: Product; w?: number; peek?: boolean }) {
  return (
    <div style={{ ...card, width: w, flex: 'none', padding: 8 }}>
      <div style={{ position: 'relative' }}>
        <Photo tone={p.tone} icon={p.icon} size={w - 16} height={w - 24} radius={16} />
        {!peek && <div style={{ position: 'absolute', top: 8, left: 8 }}><BadgeD kind={p.badge} /></div>}
        <div style={{ position: 'absolute', top: 6, right: 6, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,253,248,.92)', display: 'grid', placeItems: 'center' }}><Heart size={15} color={D.text2} /></div>
      </div>
      <div style={{ padding: '10px 6px 4px' }}>
        <div style={{ ...display, fontSize: 19, color: D.ink, ...tnum }}>{p.price.replace(' so’m', '')} <span style={{ fontSize: 11, fontFamily: D.font, fontWeight: 500, color: D.text3, letterSpacing: 0 }}>so’m</span></div>
        {p.old ? <div style={{ fontSize: 11.5, color: D.text3, textDecoration: 'line-through', ...tnum }}>{p.old} so’m</div> : <div style={{ fontSize: 11.5 }}>&nbsp;</div>}
        <div style={{ fontSize: 13.5, color: D.text, lineHeight: '17px', marginTop: 4, height: 34, overflow: 'hidden' }}>{p.name}</div>
        <Ellipsis style={{ fontSize: 11.5, color: D.text3, marginTop: 4 }}>{p.region} · {p.time}</Ellipsis>
      </div>
    </div>
  )
}

function SectionHeadD({ title, sub }: { title: string; sub?: string }) {
  return (
    <Row between style={{ padding: '0 16px', marginBottom: 10 }}>
      <div>
        <div style={{ ...display, fontSize: 19, color: D.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: D.text3 }}>{sub}</div>}
      </div>
      <Row gap={2} style={{ color: D.goldDeep, fontSize: 13, fontWeight: 600 }}>Barchasi <ChevronRight size={14} /></Row>
    </Row>
  )
}

/* ─── 1. Mijoz ilovasi — Bosh sahifa ─────────────────────────────────────── */
export function HomeD() {
  return (
    <Phone screenBg={D.page} statusDark font={D.font}>
      {/* B: siyoh sarlavha-blok — logotip, qidiruv, hero bitta blokda */}
      <div style={{ background: `linear-gradient(180deg, ${D.ink} 0%, #22303F 100%)`, padding: '58px 16px 18px', color: '#fff', borderRadius: '0 0 28px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -60, top: 10, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(227,190,74,.24), rgba(227,190,74,0) 70%)' }} />
        <Row between style={{ height: 40, position: 'relative' }}>
          <Row gap={8}><Seal size={26} gold={D.gold} ink={D.ink} ring={false} /><span style={{ ...display, fontSize: 22, color: D.gold, letterSpacing: -0.4 }}>Sharabara</span></Row>
          <Row gap={10}><Row gap={3} style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}><MapPin size={14} color={D.gold} />Toshkent</Row><div style={{ position: 'relative' }}><Bell size={22} color="#fff" /><span style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: D.gold, border: `2px solid ${D.ink}` }} /></div></Row>
        </Row>
        <div style={{ marginTop: 8, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', color: 'rgba(255,255,255,.6)', fontSize: 15, position: 'relative' }}>
          <Search size={18} color={D.gold} /><span style={{ flex: 1 }}>iPhone, divan, velosiped…</span><Camera size={18} color="rgba(255,255,255,.6)" />
        </div>
        <Row between style={{ marginTop: 16, position: 'relative' }}>
          <div>
            <div style={{ ...display, fontSize: 27, lineHeight: 1.05, letterSpacing: -0.7 }}>Narx bilan<br />yutamiz</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)', marginTop: 6 }}>12 480 ta e’londa narx tekshirilgan</div>
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: D.gold, color: D.ink, fontSize: 12.5, fontWeight: 700, padding: '7px 12px', borderRadius: 10 }}><ShieldCheck size={14} strokeWidth={2.4} />Tekshirilganlarni ko’rish</div>
          </div>
          <Seal size={84} gold={D.gold} ink={D.ink} />
        </Row>
      </div>
      <div style={{ color: D.text }}>
        {/* A aksenti: 4×2 kategoriya plitkalari (B'ning to'q ikon rangi) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 10, padding: '16px 12px 14px' }}>
          {categories.map(c => (
            <div key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: D.card, boxShadow: `inset 0 0 0 1px ${D.line}`, display: 'grid', placeItems: 'center' }}><c.icon size={24} color={D.ink} strokeWidth={1.7} /></div>
              <span style={{ fontSize: 11.5, fontWeight: 500, color: D.text }}>{c.label}</span>
            </div>
          ))}
        </div>
        <SectionHeadD title="Tekshirilgan narxlar" sub="Bugun 312 ta yangi e’lon" />
        {/* A aksenti: oq kartochka, katta rasm, narx birinchi */}
        <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflow: 'hidden', maskImage: 'linear-gradient(to right, #000 86%, transparent)', WebkitMaskImage: 'linear-gradient(to right, #000 86%, transparent)' }}>
          {[products[0], products[6], products[4]].map((p, i) => <ProductCardD key={p.name} p={p} peek={i === 2} />)}
        </div>
        <div style={{ height: 16 }} />
        <SectionHeadD title="Sharabara Mall" sub="Kompaniyalardan yangi tovarlar" />
        <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflow: 'hidden', maskImage: 'linear-gradient(to right, #000 86%, transparent)', WebkitMaskImage: 'linear-gradient(to right, #000 86%, transparent)' }}>
          {[products[1], products[3], products[2]].map((p, i) => <ProductCardD key={p.name} p={p} peek={i === 2} />)}
        </div>
      </div>
      {/* B: qorong'i tab-bar, oltin faol */}
      <TabBar
        active={0} bg={D.ink} border={D.lineDark} color="rgba(255,255,255,.55)" activeColor={D.gold}
        items={[{ label: 'Bosh', icon: <Home size={22} /> }, { label: 'Katalog', icon: <LayoutGrid size={22} /> }, { label: 'Xabarlar', icon: <MessageCircle size={22} /> }, { label: 'Profil', icon: <User size={22} /> }]}
        raised={{ label: 'Sotish', icon: <Plus size={26} strokeWidth={2.6} />, color: D.gold, fg: D.ink }}
      />
    </Phone>
  )
}

/* ─── 2. Admin — Boshqaruv paneli ───────────────────────────────────────── */
const stateStyleD: Record<string, { bg: string; fg: string }> = {
  ship: { bg: D.infoSoft, fg: D.info }, paid: { bg: D.greenSoft, fg: D.green }, wait: { bg: D.goldSoft, fg: '#7A5F10' }, done: { bg: '#EEE9DD', fg: D.text2 }, cancel: { bg: D.redSoft, fg: D.red },
}

export function AdminD() {
  return (
    <Monitor screenBg={D.page} font={D.font}>
      <div style={{ display: 'flex', height: '100%', color: D.text }}>
        {/* B: qorong'i menyu, oltin faol */}
        <aside style={{ width: 200, background: D.ink, padding: '16px 12px', display: 'flex', flexDirection: 'column', color: '#fff' }}>
          <Row gap={8} style={{ padding: '0 6px', marginBottom: 18 }}>
            <Seal size={28} gold={D.gold} ink={D.ink} ring={false} />
            <div><div style={{ ...display, fontSize: 16, color: '#fff' }}>Sharabara</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: 1.2, textTransform: 'uppercase' }}>Boshqaruv</div></div>
          </Row>
          {adminNav.map((n, i) => (
            <div key={n} style={{ height: 33, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', borderRadius: 10, fontSize: 12.5, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? D.gold : 'rgba(255,255,255,.72)', background: i === 0 ? 'rgba(227,190,74,.12)' : 'transparent', position: 'relative' }}>
              {i === 0 && <span style={{ position: 'absolute', left: -12, top: 8, bottom: 8, width: 3, borderRadius: 2, background: D.gold }} />}
              {n}{i === 3 && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: D.gold, color: D.ink, padding: '1px 6px', borderRadius: 999 }}>37</span>}
            </div>
          ))}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px 0', borderTop: `1px solid ${D.lineDark}` }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${D.gold}, #7A5A0C)` }} />
            <div><div style={{ fontSize: 12, fontWeight: 600 }}>Nilufar S.</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}>Operator</div></div>
          </div>
        </aside>
        {/* A: yorug' kontent, oq kartalar */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Row between style={{ height: 54, padding: '0 18px', background: D.card, borderBottom: `1px solid ${D.line}` }}>
            <div><div style={{ ...display, fontSize: 18 }}>Boshqaruv paneli</div><div style={{ fontSize: 11, color: D.text3 }}>Bugun nima qilish kerakligi va asosiy raqamlar</div></div>
            <Row gap={10}>
              <Row gap={6} style={{ width: 200, height: 30, borderRadius: 999, background: D.page, padding: '0 12px', color: D.text3, fontSize: 12 }}><Search size={14} />Qidirish…</Row>
              <div style={{ height: 30, padding: '0 10px', borderRadius: 8, border: `1px solid ${D.line}`, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>28-sen, 2026 <ChevronDown size={14} color={D.text3} /></div>
              <Bell size={18} color={D.text2} />
            </Row>
          </Row>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
              {/* B: siyoh hero KPI — ikki ustun */}
              <div style={{ minWidth: 0, background: `linear-gradient(135deg, ${D.ink} 0%, ${D.ink2} 100%)`, borderRadius: 18, padding: '12px 16px', color: '#fff', position: 'relative', overflow: 'hidden', height: 90, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ position: 'absolute', right: -40, bottom: -60, width: 170, height: 170, borderRadius: '50%', background: 'radial-gradient(circle, rgba(227,190,74,.28), rgba(227,190,74,0) 70%)' }} />
                <Row between><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.65)', whiteSpace: 'nowrap' }}>Tushum · sentabr</span><span style={{ fontSize: 10.5, fontWeight: 700, color: D.gold, whiteSpace: 'nowrap', ...tnum }}>+12,1 %</span></Row>
                <Row between style={{ alignItems: 'flex-end' }}><span style={{ ...display, fontSize: 26, color: D.gold, letterSpacing: -0.8, whiteSpace: 'nowrap', ...tnum }}>1,92 <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', fontFamily: D.font, fontWeight: 500, letterSpacing: 0 }}>mlrd so’m</span></span><Sparkline data={revenue14} color={D.gold} w={110} h={34} fill glow /></Row>
              </div>
              {kpis.filter(k => k.label !== 'Tushum').map(k => (
                <div key={k.label} style={{ ...card, minWidth: 0, borderRadius: 18, padding: '12px 12px', height: 90, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: D.text3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.label}</span>
                  <Row between style={{ alignItems: 'flex-end' }}>
                    <div><span style={{ ...display, fontSize: 22, whiteSpace: 'nowrap', ...tnum }}>{k.value}</span><div style={{ fontSize: 10.5, fontWeight: 700, color: k.up ? D.green : D.red, whiteSpace: 'nowrap', marginTop: 2, ...tnum }}>{k.delta}</div></div>
                    <Sparkline data={k.spark} color={k.up ? D.goldDeep : D.red} w={40} h={20} />
                  </Row>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12 }}>
              <div style={{ ...card, borderRadius: 18, padding: '12px 14px 10px' }}>
                <Row between style={{ marginBottom: 6 }}>
                  <div><div style={{ fontSize: 13, fontWeight: 700 }}>Tushum · so’nggi 14 kun</div><div style={{ fontSize: 11, color: D.text3 }}>mln so’m, kunlik</div></div>
                  <Row gap={4}>{['14 kun', '30 kun', 'Yil'].map((t, i) => <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 999, background: i === 0 ? D.ink : 'transparent', color: i === 0 ? D.gold : D.text3 }}>{t}</span>)}</Row>
                </Row>
                <Bars data={revenue14} labels={dayLabels14} color={D.goldDeep} muted={D.ink} w={396} h={100} highlight={13} grid={D.line} valueLabel={v => `${String(v).replace('.', ',')} mln`} labelColor={D.text3} radius={4} />
              </div>
              <div style={{ ...card, borderRadius: 18, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Kanallar bo’yicha</div>
                {channels.map((c, i) => (
                  <div key={c.name} style={{ marginBottom: 7 }}>
                    <Row between style={{ fontSize: 11.5, marginBottom: 3 }}><Row gap={6}><span style={{ width: 8, height: 8, borderRadius: 2, background: channelColorsD[i] }} />{c.name}</Row><span style={{ fontWeight: 700, ...tnum }}>{c.pct.toFixed(0)} %</span></Row>
                    <div style={{ height: 6, borderRadius: 3, background: D.page }}><div style={{ width: `${c.pct}%`, height: '100%', borderRadius: 3, background: channelColorsD[i] }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...card, borderRadius: 18, padding: '10px 14px 0', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Row between style={{ marginBottom: 6 }}><div style={{ fontSize: 13, fontWeight: 700 }}>So’nggi buyurtmalar</div><span style={{ fontSize: 11.5, color: D.goldDeep, fontWeight: 600 }}>Barchasi →</span></Row>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ color: D.text3, fontSize: 10.5, textAlign: 'left' }}>{['Raqam', 'Mijoz', 'Tovar', 'Summa', 'Holat', 'Vaqt'].map(h => <th key={h} style={{ padding: '4px 0 6px', fontWeight: 600, borderBottom: `1px solid ${D.line}`, letterSpacing: 0.4, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {orders.slice(0, 4).map(o => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${D.line}`, height: 31 }}>
                      <td style={{ color: D.text3, ...tnum }}>{o.id}</td><td style={{ fontWeight: 600 }}>{o.client}</td><td style={{ color: D.text2 }}>{o.item}</td>
                      <td style={{ ...display, fontSize: 13, ...tnum }}>{o.sum} so’m</td>
                      <td><span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: stateStyleD[o.state].bg, color: stateStyleD[o.state].fg }}>{stateLabel[o.state]}</span></td>
                      <td style={{ color: D.text3, ...tnum }}>{o.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </Monitor>
  )
}

/* ─── 3. Direktor paneli ────────────────────────────────────────────────── */
export function DirectorD() {
  return (
    <Phone screenBg={D.page} font={D.font}>
      <div style={{ padding: '60px 16px 0', color: D.text, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Row between>
          <div><div style={{ ...display, fontSize: 24, letterSpacing: -0.5 }}>Xayrli tong, Hasan</div><div style={{ fontSize: 13, color: D.text3 }}>Yakshanba, 28-sentabr · 09:41</div></div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${D.gold}, ${D.ink})` }} />
        </Row>
        <div style={{ display: 'flex', background: D.ink, borderRadius: 999, padding: 3 }}>
          {['Bugun', 'Hafta', 'Oy'].map((t, i) => <div key={t} style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, padding: '7px 0', borderRadius: 999, background: i === 0 ? D.gold : 'transparent', color: i === 0 ? D.ink : 'rgba(255,255,255,.6)' }}>{t}</div>)}
        </div>
        {/* B: siyoh hero, oltin raqam */}
        <div style={{ borderRadius: 22, background: `linear-gradient(135deg, ${D.ink} 0%, ${D.ink2} 100%)`, padding: 18, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(227,190,74,.22), rgba(227,190,74,0) 70%)' }} />
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', letterSpacing: 0.6, textTransform: 'uppercase' }}>Bugungi sotuv</div>
          <div style={{ ...display, fontSize: 38, color: D.gold, lineHeight: 1.05, marginTop: 4, letterSpacing: -1, ...tnum }}>83,8 <span style={{ fontSize: 17, fontFamily: D.font, fontWeight: 500, color: 'rgba(255,255,255,.65)', letterSpacing: 0 }}>mln so’m</span></div>
          <Row gap={8} style={{ marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8FD9B0', background: 'rgba(143,217,176,.14)', padding: '3px 8px', borderRadius: 999 }}>+12 %</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>kechaga nisbatan · 214 buyurtma</span>
          </Row>
          <div style={{ marginTop: 10 }}><Sparkline data={revenue14} color={D.gold} w={322} h={56} fill glow width={2.5} /></div>
        </div>
        {/* A: oq kartalar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ ...card, padding: 14 }}><Row gap={10}><div style={{ width: 36, height: 36, borderRadius: 12, background: D.goldSoft, display: 'grid', placeItems: 'center' }}><Wallet size={18} color={D.goldDeep} /></div><div><div style={{ fontSize: 11, color: D.text3 }}>Kassa · naqd</div><div style={{ ...display, fontSize: 17, ...tnum }}>12,4 mln</div></div></Row></div>
          <div style={{ ...card, padding: 14 }}><Row gap={10}><div style={{ width: 36, height: 36, borderRadius: 12, background: D.infoSoft, display: 'grid', placeItems: 'center' }}><BarChart3 size={18} color={D.info} /></div><div><div style={{ fontSize: 11, color: D.text3 }}>Karta · Click · Payme</div><div style={{ ...display, fontSize: 17, ...tnum }}>71,4 mln</div></div></Row></div>
        </div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ ...display, fontSize: 16, marginBottom: 10 }}>Kanallar bo’yicha tushum</div>
          <Row gap={16}>
            <Donut segments={channels.map((c, i) => ({ value: c.value, color: channelColorsD[i] }))} size={104} stroke={14} track="#EEE9DD">
              <div><div style={{ ...display, fontSize: 15, ...tnum }}>83,8</div><div style={{ fontSize: 10, color: D.text3 }}>mln so’m</div></div>
            </Donut>
            <div style={{ flex: 1 }}>
              {channels.map((c, i) => (
                <Row key={c.name} between style={{ fontSize: 12.5, padding: '4px 0' }}>
                  <Row gap={8}><span style={{ width: 10, height: 10, borderRadius: 3, background: channelColorsD[i] }} />{c.name}</Row>
                  <span style={{ fontWeight: 700, ...tnum }}>{String(c.value).replace('.', ',')} mln <span style={{ color: D.text3, fontWeight: 500 }}>· {c.pct.toFixed(0)} %</span></span>
                </Row>
              ))}
            </div>
          </Row>
        </div>
        <div style={{ ...card, padding: '12px 16px' }}>
          <Row between style={{ marginBottom: 6 }}><div style={{ ...display, fontSize: 16 }}>Ombor ogohlantirishlari</div><span style={{ fontSize: 11, fontWeight: 700, color: D.red, background: D.redSoft, padding: '2px 8px', borderRadius: 999 }}>3</span></Row>
          {stockAlerts.map(s => (
            <Row key={s.name} gap={10} style={{ padding: '6px 0', borderTop: `1px solid ${D.line}` }}>
              {s.level === 'out' ? <PackageX size={18} color={D.red} /> : <TriangleAlert size={18} color={D.goldDeep} />}
              <div style={{ flex: 1, minWidth: 0 }}><Ellipsis style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</Ellipsis><div style={{ fontSize: 11.5, color: s.level === 'out' ? D.red : D.text3 }}>{s.note}</div></div>
            </Row>
          ))}
        </div>
        <div style={{ ...card, padding: '12px 16px' }}>
          <div style={{ ...display, fontSize: 16, marginBottom: 6 }}>Top mahsulotlar · bugun</div>
          {topProducts.map(t => (
            <Row key={t.product.name} gap={10} style={{ padding: '6px 0' }}>
              <Photo tone={t.product.tone} icon={t.product.icon} size={40} radius={12} />
              <div style={{ flex: 1, minWidth: 0 }}><Ellipsis style={{ fontSize: 13, fontWeight: 600 }}>{t.product.name}</Ellipsis><div style={{ fontSize: 11.5, color: D.text3 }}>{t.qty}</div></div>
              <span style={{ ...display, fontSize: 14, ...tnum }}>{t.sum}</span>
            </Row>
          ))}
        </div>
      </div>
      <TabBar active={0} bg={D.ink} border={D.lineDark} color="rgba(255,255,255,.55)" activeColor={D.gold} items={[{ label: 'Asosiy', icon: <Home size={22} /> }, { label: 'Hisobot', icon: <BarChart3 size={22} /> }, { label: 'Ombor', icon: <Boxes size={22} /> }, { label: 'Sozlamalar', icon: <Settings size={22} /> }]} />
    </Phone>
  )
}
