import type { CSSProperties } from 'react'
import { BarChart3, Bell, Boxes, ChevronDown, Heart, Home, LayoutGrid, MessageCircle, PackageX, Plus, Search, Settings, ShieldCheck, TriangleAlert, User } from 'lucide-react'
import { TabBar } from './DirectionA'
import {
  Bars, Donut, Ellipsis, Monitor, Phone, Photo, Row, Seal, Sparkline, adminNav, badgeLabel, categories, channels, dayLabels14, kpis, orders, products,
  revenue14, stateLabel, stockAlerts, tnum, topProducts, type Product,
} from './shared'

export const B = {
  ink: '#141C28', ink2: '#1C2636', ink3: '#26324A', body: '#FAF8F3', card: '#FFFFFF', text: '#141C28', text2: '#586376', text3: '#8A93A3',
  line: 'rgba(20,28,40,.10)', lineDark: 'rgba(255,255,255,.08)', gold: '#E3BE4A', goldDeep: '#B8901E', goldSoft: '#FBF3D9',
  green: '#2E8B62', greenSoft: '#E3F2EA', red: '#C94B3F', redSoft: '#FBE7E4', amber: '#C98A16', amberSoft: '#FBF0D6', blue: '#3C6FB6', blueSoft: '#E6EEF9',
  display: '"Bitter", Georgia, "Times New Roman", serif', font: '"IBM Plex Sans", -apple-system, "Segoe UI", system-ui, sans-serif',
}
export const channelColorsB = ['#B8901E', '#4F9BDD', '#D46B60', '#8C7CE8']

const card: CSSProperties = { background: B.card, borderRadius: 14, boxShadow: '0 1px 2px rgba(20,28,40,.05), 0 10px 30px -18px rgba(20,28,40,.25)' }
const darkCard: CSSProperties = { background: B.ink2, borderRadius: 20, border: `1px solid ${B.lineDark}` }
const display: CSSProperties = { fontFamily: B.display, fontWeight: 700, letterSpacing: -0.3 }

function BadgeB({ kind, dark = false }: { kind: Product['badge']; dark?: boolean }) {
  const map = { checked: { fg: B.goldDeep, bd: B.gold, label: badgeLabel.checked }, official: { fg: B.blue, bd: B.blue, label: badgeLabel.official }, drop: { fg: B.red, bd: B.red, label: badgeLabel.drop } }[kind]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, border: `1px solid ${map.bd}`, color: dark ? B.gold : map.fg, background: dark ? 'rgba(20,28,40,.7)' : 'rgba(255,255,255,.92)', whiteSpace: 'nowrap', letterSpacing: 0.2, textTransform: 'uppercase' }}>
      {kind === 'checked' && <ShieldCheck size={11} strokeWidth={2.5} />}{map.label}
    </span>
  )
}

function ProductCardB({ p, w = 171 }: { p: Product; w?: number }) {
  return (
    <div style={{ ...card, width: w, flex: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <Photo tone={p.tone} icon={p.icon} size={w} height={w - 16} radius={0} />
        <div style={{ position: 'absolute', top: 8, left: 8 }}><BadgeB kind={p.badge} /></div>
        <div style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%', background: 'rgba(20,28,40,.55)', display: 'grid', placeItems: 'center' }}><Heart size={14} color="#fff" /></div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ ...display, fontSize: 18, color: B.text, ...tnum }}>{p.price.replace(' so’m', '')} <span style={{ fontSize: 11, fontFamily: B.font, fontWeight: 500, color: B.text3, letterSpacing: 0 }}>so’m</span></div>
        {p.old ? <div style={{ fontSize: 11.5, color: B.text3, textDecoration: 'line-through', ...tnum }}>{p.old} so’m</div> : <div style={{ fontSize: 11.5, color: B.text3 }}>&nbsp;</div>}
        <div style={{ fontSize: 13, color: B.text, lineHeight: '17px', marginTop: 4, height: 34, overflow: 'hidden' }}>{p.name}</div>
        <Ellipsis style={{ fontSize: 11, color: B.text3, marginTop: 4 }}>{p.region} · {p.time}</Ellipsis>
      </div>
    </div>
  )
}

/* ─── 1. Mijoz ilovasi — Bosh sahifa ─────────────────────────────────────── */
export function HomeB() {
  return (
    <Phone screenBg={B.body} statusDark font={B.font}>
      <div style={{ background: `linear-gradient(180deg, ${B.ink} 0%, #182338 100%)`, padding: '58px 16px 20px', color: '#fff', borderRadius: '0 0 28px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -60, top: 20, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(227,190,74,.22), rgba(227,190,74,0) 70%)' }} />
        <Row between style={{ height: 40 }}>
          <div style={{ ...display, fontSize: 24, color: B.gold, letterSpacing: -0.5 }}>Sharabara</div>
          <div style={{ position: 'relative' }}><Bell size={22} color="#fff" /><span style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: B.gold, border: `2px solid ${B.ink}` }} /></div>
        </Row>
        <div style={{ marginTop: 8, height: 46, borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', color: 'rgba(255,255,255,.6)', fontSize: 15 }}>
          <Search size={18} color={B.gold} /><span style={{ flex: 1 }}>iPhone, divan, velosiped…</span>
        </div>
        <Row between style={{ marginTop: 18, position: 'relative' }}>
          <div>
            <div style={{ ...display, fontSize: 28, lineHeight: 1.05, letterSpacing: -0.8 }}>Narx bilan<br />yutamiz</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>Har bir muhrli e’lon bozor<br />narxi bilan tekshirilgan</div>
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: B.gold, color: B.ink, fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 10 }}><ShieldCheck size={15} strokeWidth={2.4} />Tekshirilganlar · 12 480</div>
          </div>
          <Seal size={92} gold={B.gold} ink={B.ink} />
        </Row>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0', overflow: 'hidden' }}>
        {categories.slice(0, 6).map((c, i) => (
          <div key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, border: `1px solid ${i === 0 ? B.ink : B.line}`, background: i === 0 ? B.ink : '#fff', color: i === 0 ? B.gold : B.text, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flex: 'none' }}>
            <c.icon size={15} strokeWidth={2} />{c.label}
          </div>
        ))}
      </div>
      <Row between style={{ padding: '18px 16px 10px' }}>
        <div><div style={{ ...display, fontSize: 20, color: B.text }}>Tekshirilgan narxlar</div><div style={{ fontSize: 12, color: B.text3 }}>Bugun 312 ta yangi e’lon</div></div>
        <span style={{ fontSize: 13, fontWeight: 600, color: B.goldDeep }}>Barchasi →</span>
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 16px' }}>
        {[products[0], products[6], products[2], products[5]].map(p => <ProductCardB key={p.name} p={p} />)}
      </div>
      <TabBar
        active={0} bg={B.ink} border={B.lineDark} color={B.text3} activeColor={B.gold}
        items={[{ label: 'Asosiy', icon: <Home size={22} /> }, { label: 'Katalog', icon: <LayoutGrid size={22} /> }, { label: 'Xabarlar', icon: <MessageCircle size={22} /> }, { label: 'Profil', icon: <User size={22} /> }]}
        raised={{ label: 'Sotish', icon: <Plus size={26} strokeWidth={2.6} />, color: B.gold, fg: B.ink }}
      />
    </Phone>
  )
}

/* ─── 2. Admin — Boshqaruv paneli ───────────────────────────────────────── */
const stateStyleB: Record<string, { bg: string; fg: string }> = {
  ship: { bg: B.blueSoft, fg: B.blue }, paid: { bg: B.greenSoft, fg: B.green }, wait: { bg: B.amberSoft, fg: B.amber }, done: { bg: '#EEEBE3', fg: B.text2 }, cancel: { bg: B.redSoft, fg: B.red },
}

export function AdminB() {
  return (
    <Monitor screenBg={B.body} font={B.font}>
      <div style={{ display: 'flex', height: '100%', color: B.text }}>
        <aside style={{ width: 200, background: B.ink, padding: '16px 12px', display: 'flex', flexDirection: 'column', color: '#fff' }}>
          <div style={{ padding: '0 8px', marginBottom: 18 }}><div style={{ ...display, fontSize: 20, color: B.gold }}>Sharabara</div><div style={{ fontSize: 10.5, color: B.text3, letterSpacing: 1.2, textTransform: 'uppercase' }}>Boshqaruv</div></div>
          {adminNav.map((n, i) => (
            <div key={n} style={{ height: 33, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', borderRadius: 8, fontSize: 12.5, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? B.gold : 'rgba(255,255,255,.72)', background: i === 0 ? 'rgba(227,190,74,.10)' : 'transparent', position: 'relative' }}>
              {i === 0 && <span style={{ position: 'absolute', left: -12, top: 8, bottom: 8, width: 3, borderRadius: 2, background: B.gold }} />}
              {n}
            </div>
          ))}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px 0', borderTop: `1px solid ${B.lineDark}` }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${B.gold}, #7A5A0C)` }} />
            <div><div style={{ fontSize: 12, fontWeight: 600 }}>Nilufar S.</div><div style={{ fontSize: 10, color: B.text3 }}>Operator</div></div>
          </div>
        </aside>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Row between style={{ height: 52, padding: '0 18px', borderBottom: `1px solid ${B.line}` }}>
            <div><div style={{ ...display, fontSize: 18 }}>Boshqaruv paneli</div></div>
            <Row gap={10}>
              <Row gap={6} style={{ width: 210, height: 30, borderRadius: 8, background: '#fff', border: `1px solid ${B.line}`, padding: '0 10px', color: B.text3, fontSize: 12 }}><Search size={14} />Qidirish…</Row>
              <div style={{ height: 30, padding: '0 10px', borderRadius: 8, border: `1px solid ${B.line}`, background: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>28-sen, 2026 <ChevronDown size={14} color={B.text3} /></div>
              <Bell size={18} color={B.text2} />
            </Row>
          </Row>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gridTemplateRows: '82px 82px', gap: 12, flex: 'none' }}>
            <div style={{ gridColumn: '1 / 3', gridRow: '1 / 3', background: `linear-gradient(135deg, ${B.ink} 0%, ${B.ink3} 100%)`, borderRadius: 16, padding: '16px 18px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -40, bottom: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(227,190,74,.25), rgba(227,190,74,0) 70%)' }} />
              <Row between>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>Tushum · sentabr</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: B.gold, background: 'rgba(227,190,74,.14)', padding: '3px 8px', borderRadius: 6 }}>+12,1 %</span>
              </Row>
              <div style={{ ...display, fontSize: 34, color: B.gold, marginTop: 6, letterSpacing: -1, ...tnum }}>1,92 <span style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', fontFamily: B.font, fontWeight: 500 }}>mlrd so’m</span></div>
              <Row between style={{ alignItems: 'flex-end', marginTop: 10 }}>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)' }}>Reja: 2,1 mlrd · bajarildi <b style={{ color: '#fff' }}>91 %</b></div>
                <Sparkline data={revenue14} color={B.gold} w={140} h={44} fill glow />
              </Row>
            </div>
            {kpis.filter(k => k.label !== 'Tushum').map(k => (
              <div key={k.label} style={{ ...card, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Row between><span style={{ fontSize: 11.5, color: B.text3, whiteSpace: 'nowrap' }}>{k.label}</span><span style={{ fontSize: 10.5, fontWeight: 700, color: k.up ? B.green : B.red, whiteSpace: 'nowrap', ...tnum }}>{k.delta}</span></Row>
                <Row between style={{ alignItems: 'flex-end' }}><span style={{ ...display, fontSize: 21, whiteSpace: 'nowrap', ...tnum }}>{k.value}</span><Sparkline data={k.spark} color={k.up ? B.goldDeep : B.red} w={40} h={20} /></Row>
              </div>
            ))}
            <div style={{ ...card, padding: '10px 14px' }}>
              <div style={{ fontSize: 11.5, color: B.text3, marginBottom: 6 }}>Kanallar</div>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                {channels.map((c, i) => <div key={c.name} style={{ width: `${c.pct}%`, background: channelColorsB[i] }} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', marginTop: 7, fontSize: 9.5, color: B.text2 }}>
                {channels.map((c, i) => <Row key={c.name} gap={4} style={{ whiteSpace: 'nowrap' }}><span style={{ width: 7, height: 7, borderRadius: 2, background: channelColorsB[i], flex: 'none' }} />{c.name} <b style={tnum}>{c.pct.toFixed(0)} %</b></Row>)}
              </div>
            </div>
          </div>
          <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '236px 1fr', gap: 12, flex: 1, minHeight: 0 }}>
            <div style={{ ...card, padding: '12px 14px 10px' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Kunlik tushum</div>
              <div style={{ fontSize: 11, color: B.text3, marginBottom: 8 }}>mln so’m · so’nggi 14 kun</div>
              <Bars data={revenue14} labels={dayLabels14} color={B.goldDeep} muted={B.ink} w={208} h={190} highlight={13} grid={B.line} valueLabel={v => `${String(v).replace('.', ',')} mln`} labelColor={B.text3} gap={5} radius={3} />
            </div>
            <div style={{ ...card, padding: '10px 14px 0', overflow: 'hidden' }}>
              <Row between style={{ marginBottom: 6 }}><div style={{ fontSize: 13, fontWeight: 600 }}>So’nggi buyurtmalar</div><span style={{ fontSize: 11.5, color: B.goldDeep, fontWeight: 600 }}>Barchasi →</span></Row>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ color: B.text3, fontSize: 10.5, textAlign: 'left' }}>{['Mijoz', 'Tovar', 'Summa', 'Holat'].map(h => <th key={h} style={{ padding: '4px 0 6px', fontWeight: 600, borderBottom: `1px solid ${B.line}` }}>{h}</th>)}</tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${B.line}`, height: 34, whiteSpace: 'nowrap' }}>
                      <td style={{ fontWeight: 600, paddingRight: 8 }}>{o.client}<div style={{ fontSize: 10, color: B.text3, fontWeight: 400, ...tnum }}>{o.id}</div></td>
                      <td style={{ color: B.text2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>{o.item}</td>
                      <td style={{ ...display, fontSize: 13, paddingRight: 8, ...tnum }}>{o.sum}</td>
                      <td><span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: stateStyleB[o.state].bg, color: stateStyleB[o.state].fg }}>{stateLabel[o.state]}</span></td>
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

/* ─── 3. Direktor paneli (tungi rejim) ─────────────────────────────────── */
export function DirectorB() {
  const dim = 'rgba(255,255,255,.55)'
  return (
    <Phone screenBg={B.ink} statusDark font={B.font}>
      <div style={{ padding: '60px 16px 0', color: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Row between>
          <div><div style={{ ...display, fontSize: 24, letterSpacing: -0.5 }}>Xayrli tong, Hasan</div><div style={{ fontSize: 13, color: dim }}>Yakshanba, 28-sentabr · 09:41</div></div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${B.gold}, #7A5A0C)`, border: `2px solid ${B.ink3}` }} />
        </Row>
        <div style={{ display: 'flex', background: B.ink2, borderRadius: 12, padding: 3, border: `1px solid ${B.lineDark}` }}>
          {['Bugun', 'Hafta', 'Oy'].map((t, i) => <div key={t} style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, padding: '7px 0', borderRadius: 9, background: i === 0 ? B.gold : 'transparent', color: i === 0 ? B.ink : dim }}>{t}</div>)}
        </div>
        <div style={{ ...darkCard, padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(227,190,74,.18), rgba(227,190,74,0) 70%)' }} />
          <div style={{ fontSize: 12.5, color: dim, letterSpacing: 0.6, textTransform: 'uppercase' }}>Bugungi sotuv</div>
          <div style={{ ...display, fontSize: 40, color: B.gold, lineHeight: 1.05, marginTop: 4, letterSpacing: -1.2, ...tnum }}>83,8 <span style={{ fontSize: 18, fontFamily: B.font, fontWeight: 500, color: dim, letterSpacing: 0 }}>mln so’m</span></div>
          <Row gap={8} style={{ marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7FD4A6', background: 'rgba(127,212,166,.12)', padding: '3px 8px', borderRadius: 6 }}>+12 %</span>
            <span style={{ fontSize: 12, color: dim }}>kechaga nisbatan · 214 buyurtma</span>
          </Row>
          <div style={{ marginTop: 12 }}><Sparkline data={revenue14} color={B.gold} w={322} h={64} fill glow width={2.5} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ ...darkCard, padding: 14 }}><div style={{ fontSize: 11.5, color: dim }}>Kassa · naqd</div><div style={{ ...display, fontSize: 22, color: '#fff', ...tnum }}>12,4 <span style={{ fontSize: 12, fontFamily: B.font, color: dim, fontWeight: 500 }}>mln</span></div></div>
          <div style={{ ...darkCard, padding: 14 }}><div style={{ fontSize: 11.5, color: dim }}>Karta · Click · Payme</div><div style={{ ...display, fontSize: 22, color: '#fff', ...tnum }}>71,4 <span style={{ fontSize: 12, fontFamily: B.font, color: dim, fontWeight: 500 }}>mln</span></div></div>
        </div>
        <div style={{ ...darkCard, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Kanallar bo’yicha tushum</div>
          <Row gap={16}>
            <Donut segments={channels.map((c, i) => ({ value: c.value, color: channelColorsB[i] }))} size={100} stroke={13} track="rgba(255,255,255,.06)">
              <div><div style={{ ...display, fontSize: 15, color: B.gold, ...tnum }}>83,8</div><div style={{ fontSize: 10, color: dim }}>mln so’m</div></div>
            </Donut>
            <div style={{ flex: 1 }}>
              {channels.map((c, i) => (
                <Row key={c.name} between style={{ fontSize: 12.5, padding: '4px 0' }}>
                  <Row gap={8}><span style={{ width: 10, height: 10, borderRadius: 3, background: channelColorsB[i] }} /><span style={{ color: 'rgba(255,255,255,.85)' }}>{c.name}</span></Row>
                  <span style={{ fontWeight: 600, ...tnum }}>{String(c.value).replace('.', ',')} mln <span style={{ color: dim, fontWeight: 400 }}>· {c.pct.toFixed(0)} %</span></span>
                </Row>
              ))}
            </div>
          </Row>
        </div>
        <div style={{ ...darkCard, padding: '12px 16px' }}>
          <Row between style={{ marginBottom: 4 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Ombor ogohlantirishlari</div><span style={{ fontSize: 11, fontWeight: 700, color: '#F0857A', background: 'rgba(240,133,122,.14)', padding: '2px 8px', borderRadius: 999 }}>3</span></Row>
          {stockAlerts.map(s => (
            <Row key={s.name} gap={10} style={{ padding: '7px 0', borderTop: `1px solid ${B.lineDark}` }}>
              {s.level === 'out' ? <PackageX size={18} color="#F0857A" /> : <TriangleAlert size={18} color={B.gold} />}
              <div style={{ flex: 1, minWidth: 0 }}><Ellipsis style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</Ellipsis><div style={{ fontSize: 11.5, color: s.level === 'out' ? '#F0857A' : dim }}>{s.note}</div></div>
            </Row>
          ))}
        </div>
        <div style={{ ...darkCard, padding: '12px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Top mahsulotlar · bugun</div>
          {topProducts.map(t => (
            <Row key={t.product.name} gap={10} style={{ padding: '6px 0' }}>
              <Photo tone={t.product.tone} icon={t.product.icon} size={40} radius={10} />
              <div style={{ flex: 1, minWidth: 0 }}><Ellipsis style={{ fontSize: 13, fontWeight: 600 }}>{t.product.name}</Ellipsis><div style={{ fontSize: 11.5, color: dim }}>{t.qty}</div></div>
              <span style={{ ...display, fontSize: 14, color: B.gold, ...tnum }}>{t.sum}</span>
            </Row>
          ))}
        </div>
      </div>
      <TabBar active={0} bg={B.ink} border={B.lineDark} color={B.text3} activeColor={B.gold} items={[{ label: 'Asosiy', icon: <Home size={22} /> }, { label: 'Hisobot', icon: <BarChart3 size={22} /> }, { label: 'Ombor', icon: <Boxes size={22} /> }, { label: 'Sozlamalar', icon: <Settings size={22} /> }]} />
    </Phone>
  )
}
