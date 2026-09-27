import type { CSSProperties, ReactNode } from 'react'
import {
  BarChart3, Bell, Boxes, Camera, ChevronDown, ChevronRight, Heart, Home, LayoutGrid, MapPin, MessageCircle, Plus, Search, Settings, TriangleAlert, User, Wallet, PackageX,
} from 'lucide-react'
import {
  Bars, Donut, Ellipsis, Monitor, Phone, Photo, Row, Seal, Sparkline, adminNav, badgeLabel, categories, channels, dayLabels14, kpis, orders, products,
  revenue14, stateLabel, stockAlerts, tnum, topProducts, type Product,
} from './shared'

export const A = {
  page: '#F4F5F7', card: '#FFFFFF', navy: '#10203A', text2: '#5B6472', text3: '#8A94A6', line: '#E6E8EC',
  gold: '#D4A017', goldSoft: '#FFF6DA', green: '#1E9E6A', greenSoft: '#E6F6EE', red: '#E0443B', redSoft: '#FDEBEA',
  blue: '#2F6FED', blueSoft: '#EEF3FF', amber: '#E09A1B', amberSoft: '#FFF4DE', purple: '#8B5CF6',
  font: '-apple-system, "SF Pro Text", Inter, "Segoe UI", Roboto, system-ui, sans-serif',
}
export const channelColorsA = [A.blue, A.green, A.gold, A.purple]

const card: CSSProperties = { background: A.card, borderRadius: 16, boxShadow: '0 1px 2px rgba(16,32,58,.05), 0 0 0 1px rgba(16,32,58,.04)' }

function BadgePill({ kind }: { kind: Product['badge'] }) {
  const bg = kind === 'checked' ? A.green : kind === 'official' ? A.blue : A.red
  return <span style={{ background: bg, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 8, letterSpacing: 0.1, whiteSpace: 'nowrap' }}>{badgeLabel[kind]}</span>
}

function ProductCardA({ p, w = 156, peek = false }: { p: Product; w?: number; peek?: boolean }) {
  return (
    <div style={{ width: w, flex: 'none' }}>
      <div style={{ position: 'relative' }}>
        <Photo tone={p.tone} icon={p.icon} size={w} radius={16} />
        {!peek && <div style={{ position: 'absolute', top: 8, left: 8 }}><BadgePill kind={p.badge} /></div>}
        <div style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center' }}><Heart size={15} color={A.text2} /></div>
      </div>
      <div style={{ marginTop: 8 }}>
        <Row gap={6} style={{ alignItems: 'baseline' }}>
          <span style={{ fontSize: 19, fontWeight: 800, color: A.navy, letterSpacing: -0.4, ...tnum }}>{p.price.replace(' so’m', '')}</span>
          <span style={{ fontSize: 11, color: A.text3 }}>so’m</span>
        </Row>
        {p.old && <div style={{ fontSize: 12, color: A.text3, textDecoration: 'line-through', marginTop: -2, ...tnum }}>{p.old} so’m</div>}
        <div style={{ fontSize: 13, color: A.navy, lineHeight: '17px', marginTop: 4, height: 34, overflow: 'hidden' }}>{p.name}</div>
        <Ellipsis style={{ fontSize: 11, color: A.text3, marginTop: 4 }}>{p.region} · {p.time}</Ellipsis>
      </div>
    </div>
  )
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <Row between style={{ padding: '0 16px', marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: A.navy, letterSpacing: -0.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: A.text3 }}>{sub}</div>}
      </div>
      <Row gap={2} style={{ color: A.gold, fontSize: 13, fontWeight: 600 }}>Barchasi <ChevronRight size={14} /></Row>
    </Row>
  )
}

export function TabBar({ items, active, raised, bg = '#fff', color = A.text3, activeColor = A.navy, border = A.line }: { items: { label: string; icon: ReactNode }[]; active: number; raised?: { label: string; icon: ReactNode; color: string; fg?: string }; bg?: string; color?: string; activeColor?: string; border?: string }) {
  const all = raised ? [...items.slice(0, 2), null, ...items.slice(2)] : items
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, background: bg, borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', padding: '10px 8px 0' }}>
      {all.map((it, i) => it === null ? (
        <div key="raised" style={{ width: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: -26 }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: raised!.color, display: 'grid', placeItems: 'center', boxShadow: `0 10px 20px -8px ${raised!.color}`, border: `4px solid ${bg}`, color: raised!.fg ?? '#fff' }}>{raised!.icon}</div>
          <span style={{ fontSize: 10, fontWeight: 600, color: activeColor }}>{raised!.label}</span>
        </div>
      ) : (
        <div key={it.label} style={{ width: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: (raised ? (i < 2 ? i : i - 1) : i) === active ? activeColor : color }}>
          {it.icon}<span style={{ fontSize: 10, fontWeight: 600 }}>{it.label}</span>
        </div>
      ))}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 134, height: 5, borderRadius: 999, background: activeColor, opacity: 0.9 }} />
    </div>
  )
}

/* ─── 1. Mijoz ilovasi — Bosh sahifa ─────────────────────────────────────── */
export function HomeA() {
  return (
    <Phone screenBg="#fff" font={A.font}>
      <div style={{ paddingTop: 58, color: A.navy }}>
        <Row between style={{ padding: '0 16px', height: 40 }}>
          <Row gap={4} style={{ fontSize: 15, fontWeight: 600 }}><MapPin size={16} color={A.gold} />Toshkent<ChevronDown size={16} color={A.text3} /></Row>
          <div style={{ position: 'relative' }}><Bell size={22} /><span style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: A.red, border: '2px solid #fff' }} /></div>
        </Row>
        <div style={{ margin: '4px 16px 12px', height: 44, borderRadius: 14, background: A.page, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', color: A.text3, fontSize: 15 }}>
          <Search size={18} /><span style={{ flex: 1 }}>iPhone, divan, velosiped…</span><Camera size={18} />
        </div>
        <div style={{ margin: '0 16px 14px', height: 104, borderRadius: 16, background: `linear-gradient(110deg, ${A.navy} 0%, #1D3557 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(212,160,23,.18)' }} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3 }}>Narx bilan yutamiz</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.72)', marginTop: 3 }}>12 480 ta e’londa narx tekshirilgan</div>
            <div style={{ marginTop: 8, display: 'inline-flex', background: A.gold, color: A.navy, fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 8 }}>Tekshirilganlarni ko’rish</div>
          </div>
          <Seal size={58} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 12, padding: '0 12px', marginBottom: 16 }}>
          {categories.map(c => (
            <div key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: c.bg, display: 'grid', placeItems: 'center' }}><c.icon size={26} color={c.fg} strokeWidth={1.8} /></div>
              <span style={{ fontSize: 11, fontWeight: 500, color: A.navy }}>{c.label}</span>
            </div>
          ))}
        </div>
        <SectionHead title="Narx tekshirilgan" sub="Bozor narxi bilan solishtirilgan" />
        <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflow: 'hidden', maskImage: 'linear-gradient(to right, #000 86%, transparent)', WebkitMaskImage: 'linear-gradient(to right, #000 86%, transparent)' }}>
          {[products[0], products[6], products[4]].map((p, i) => <ProductCardA key={p.name} p={p} peek={i === 2} />)}
        </div>
        <div style={{ height: 18 }} />
        <SectionHead title="Mall · Rasmiy do’konlar" sub="Kompaniyalardan yangi tovarlar" />
        <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflow: 'hidden', maskImage: 'linear-gradient(to right, #000 86%, transparent)', WebkitMaskImage: 'linear-gradient(to right, #000 86%, transparent)' }}>
          {[products[1], products[3], products[2]].map((p, i) => <ProductCardA key={p.name} p={p} peek={i === 2} />)}
        </div>
      </div>
      <TabBar
        active={0}
        items={[
          { label: 'Asosiy', icon: <Home size={22} /> }, { label: 'Katalog', icon: <LayoutGrid size={22} /> },
          { label: 'Xabarlar', icon: <MessageCircle size={22} /> }, { label: 'Profil', icon: <User size={22} /> },
        ]}
        raised={{ label: 'Sotish', icon: <Plus size={26} strokeWidth={2.6} />, color: A.gold, fg: A.navy }}
      />
    </Phone>
  )
}

/* ─── 2. Admin — Boshqaruv paneli ───────────────────────────────────────── */
const stateStyleA: Record<string, { bg: string; fg: string }> = {
  ship: { bg: A.blueSoft, fg: A.blue }, paid: { bg: A.greenSoft, fg: A.green }, wait: { bg: A.amberSoft, fg: A.amber }, done: { bg: '#EEF1F5', fg: A.text2 }, cancel: { bg: A.redSoft, fg: A.red },
}

export function AdminA() {
  return (
    <Monitor screenBg={A.page} font={A.font}>
      <div style={{ display: 'flex', height: '100%', color: A.navy }}>
        <aside style={{ width: 196, background: '#fff', borderRight: `1px solid ${A.line}`, padding: '14px 10px', display: 'flex', flexDirection: 'column' }}>
          <Row gap={8} style={{ padding: '0 6px', marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: A.gold, color: A.navy, fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 15 }}>S</div>
            <div><div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.2 }}>Sharabara</div><div style={{ fontSize: 10, color: A.text3, marginTop: -2 }}>Admin</div></div>
          </Row>
          {adminNav.map((n, i) => (
            <div key={n} style={{ height: 32, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', borderRadius: 10, fontSize: 12.5, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? A.blue : A.text2, background: i === 0 ? A.blueSoft : 'transparent' }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: i === 0 ? A.blue : A.line }} />{n}
            </div>
          ))}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', borderTop: `1px solid ${A.line}` }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7C5CD6,#2F6FED)' }} />
            <div><div style={{ fontSize: 12, fontWeight: 600 }}>Nilufar S.</div><div style={{ fontSize: 10, color: A.text3 }}>Operator</div></div>
          </div>
        </aside>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Row between style={{ height: 52, padding: '0 16px', background: '#fff', borderBottom: `1px solid ${A.line}` }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.2 }}>Boshqaruv paneli</div>
            <Row gap={10}>
              <Row gap={6} style={{ width: 200, height: 30, borderRadius: 8, background: A.page, padding: '0 10px', color: A.text3, fontSize: 12 }}><Search size={14} />Qidirish: buyurtma, mijoz…</Row>
              <div style={{ height: 30, padding: '0 10px', borderRadius: 8, border: `1px solid ${A.line}`, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>28-sen, 2026 <ChevronDown size={14} color={A.text3} /></div>
              <Bell size={18} color={A.text2} />
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A017,#E0443B)' }} />
            </Row>
          </Row>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
              {kpis.map(k => (
                <div key={k.label} style={{ ...card, padding: '12px 12px', height: 86, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Row between>
                    <span style={{ fontSize: 11, color: A.text3, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{k.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: k.up ? A.green : A.red, background: k.up ? A.greenSoft : A.redSoft, padding: '2px 5px', borderRadius: 6, whiteSpace: 'nowrap', flex: 'none', ...tnum }}>{k.delta}</span>
                  </Row>
                  <Row between style={{ alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, whiteSpace: 'nowrap', ...tnum }}>{k.value}</span>
                    <Sparkline data={k.spark} color={k.up ? A.blue : A.red} w={44} h={24} fill />
                  </Row>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 224px', gap: 14 }}>
              <div style={{ ...card, padding: '12px 14px 10px' }}>
                <Row between style={{ marginBottom: 6 }}>
                  <div><div style={{ fontSize: 13, fontWeight: 700 }}>Tushum · so’nggi 14 kun</div><div style={{ fontSize: 11, color: A.text3 }}>mln so’m, kunlik</div></div>
                  <Row gap={4}>
                    {['14 kun', '30 kun', 'Yil'].map((t, i) => <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6, background: i === 0 ? A.blueSoft : 'transparent', color: i === 0 ? A.blue : A.text3 }}>{t}</span>)}
                  </Row>
                </Row>
                <Bars data={revenue14} labels={dayLabels14} color={A.blue} w={386} h={104} highlight={13} grid={A.line} valueLabel={v => `${String(v).replace('.', ',')} mln`} labelColor={A.text3} />
              </div>
              <div style={{ ...card, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Kanallar bo’yicha</div>
                {channels.map((c, i) => (
                  <div key={c.name} style={{ marginBottom: 7 }}>
                    <Row between style={{ fontSize: 11.5, marginBottom: 3 }}><Row gap={6}><span style={{ width: 8, height: 8, borderRadius: 2, background: channelColorsA[i] }} />{c.name}</Row><span style={{ fontWeight: 700, ...tnum }}>{c.pct.toFixed(0)} %</span></Row>
                    <div style={{ height: 6, borderRadius: 3, background: A.page }}><div style={{ width: `${c.pct}%`, height: '100%', borderRadius: 3, background: channelColorsA[i] }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...card, padding: '10px 14px 0', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Row between style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>So’nggi buyurtmalar</div>
                <span style={{ fontSize: 11.5, color: A.blue, fontWeight: 600 }}>Barchasini ko’rish</span>
              </Row>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ color: A.text3, fontSize: 10.5, textAlign: 'left' }}>{['Raqam', 'Mijoz', 'Tovar', 'Summa', 'Holat', 'Vaqt'].map(h => <th key={h} style={{ padding: '4px 0 6px', fontWeight: 600, borderBottom: `1px solid ${A.line}` }}>{h}</th>)}</tr></thead>
                <tbody>
                  {orders.slice(0, 4).map(o => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${A.line}`, height: 31 }}>
                      <td style={{ color: A.text3, ...tnum }}>{o.id}</td><td style={{ fontWeight: 600 }}>{o.client}</td><td style={{ color: A.text2 }}>{o.item}</td>
                      <td style={{ fontWeight: 700, ...tnum }}>{o.sum} so’m</td>
                      <td><span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: stateStyleA[o.state].bg, color: stateStyleA[o.state].fg }}>{stateLabel[o.state]}</span></td>
                      <td style={{ color: A.text3, ...tnum }}>{o.when}</td>
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
export function DirectorA() {
  return (
    <Phone screenBg={A.page} font={A.font}>
      <div style={{ padding: '60px 16px 0', color: A.navy, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Row between>
          <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>Xayrli tong, Hasan</div><div style={{ fontSize: 13, color: A.text3 }}>Yakshanba, 28-sentabr · 09:41</div></div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A017,#10203A)' }} />
        </Row>
        <div style={{ display: 'flex', background: '#E6E8EC', borderRadius: 12, padding: 3 }}>
          {['Bugun', 'Hafta', 'Oy'].map((t, i) => <div key={t} style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, padding: '7px 0', borderRadius: 9, background: i === 0 ? '#fff' : 'transparent', color: i === 0 ? A.navy : A.text2, boxShadow: i === 0 ? '0 1px 3px rgba(16,32,58,.12)' : undefined }}>{t}</div>)}
        </div>
        <div style={{ ...card, padding: 16 }}>
          <Row between>
            <div>
              <div style={{ fontSize: 13, color: A.text3, fontWeight: 500 }}>Bugungi sotuv</div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginTop: 2, ...tnum }}>83,8 <span style={{ fontSize: 18, fontWeight: 600, color: A.text2 }}>mln so’m</span></div>
            </div>
            <Sparkline data={revenue14} color={A.blue} w={110} h={44} fill />
          </Row>
          <Row gap={8} style={{ marginTop: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: A.green, background: A.greenSoft, padding: '3px 8px', borderRadius: 6 }}>+12 %</span>
            <span style={{ fontSize: 12, color: A.text3 }}>kechaga nisbatan</span>
          </Row>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${A.line}` }}>
            <div><div style={{ fontSize: 11.5, color: A.text3 }}>Buyurtmalar</div><div style={{ fontSize: 18, fontWeight: 800, ...tnum }}>214</div></div>
            <div><div style={{ fontSize: 11.5, color: A.text3 }}>O’rtacha chek</div><div style={{ fontSize: 18, fontWeight: 800, ...tnum }}>392 000 <span style={{ fontSize: 12, fontWeight: 500, color: A.text2 }}>so’m</span></div></div>
          </div>
        </div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Kanallar bo’yicha tushum</div>
          <Row gap={16}>
            <Donut segments={channels.map((c, i) => ({ value: c.value, color: channelColorsA[i] }))} size={104} stroke={14}>
              <div><div style={{ fontSize: 15, fontWeight: 800, ...tnum }}>83,8</div><div style={{ fontSize: 10, color: A.text3 }}>mln so’m</div></div>
            </Donut>
            <div style={{ flex: 1 }}>
              {channels.map((c, i) => (
                <Row key={c.name} between style={{ fontSize: 12.5, padding: '4px 0' }}>
                  <Row gap={8}><span style={{ width: 10, height: 10, borderRadius: 3, background: channelColorsA[i] }} />{c.name}</Row>
                  <span style={{ fontWeight: 700, ...tnum }}>{String(c.value).replace('.', ',')} mln <span style={{ color: A.text3, fontWeight: 500 }}>· {c.pct.toFixed(0)} %</span></span>
                </Row>
              ))}
            </div>
          </Row>
        </div>
        <div style={{ ...card, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Row gap={10}><div style={{ width: 36, height: 36, borderRadius: 10, background: A.goldSoft, display: 'grid', placeItems: 'center' }}><Wallet size={18} color={A.gold} /></div><div><div style={{ fontSize: 11, color: A.text3 }}>Kassa · naqd</div><div style={{ fontSize: 15, fontWeight: 800, ...tnum }}>12,4 mln</div></div></Row>
          <Row gap={10}><div style={{ width: 36, height: 36, borderRadius: 10, background: A.blueSoft, display: 'grid', placeItems: 'center' }}><BarChart3 size={18} color={A.blue} /></div><div><div style={{ fontSize: 11, color: A.text3 }}>Karta · Click · Payme</div><div style={{ fontSize: 15, fontWeight: 800, ...tnum }}>71,4 mln</div></div></Row>
        </div>
        <div style={{ ...card, padding: '12px 16px' }}>
          <Row between style={{ marginBottom: 6 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Ombor ogohlantirishlari</div><span style={{ fontSize: 11, fontWeight: 700, color: A.red, background: A.redSoft, padding: '2px 8px', borderRadius: 999 }}>3</span></Row>
          {stockAlerts.map(s => (
            <Row key={s.name} gap={10} style={{ padding: '6px 0', borderTop: `1px solid ${A.line}` }}>
              {s.level === 'out' ? <PackageX size={18} color={A.red} /> : <TriangleAlert size={18} color={A.amber} />}
              <div style={{ flex: 1, minWidth: 0 }}><Ellipsis style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</Ellipsis><div style={{ fontSize: 11.5, color: s.level === 'out' ? A.red : A.text3 }}>{s.note}</div></div>
            </Row>
          ))}
        </div>
        <div style={{ ...card, padding: '12px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Top mahsulotlar · bugun</div>
          {topProducts.map(t => (
            <Row key={t.product.name} gap={10} style={{ padding: '6px 0' }}>
              <Photo tone={t.product.tone} icon={t.product.icon} size={40} radius={10} />
              <div style={{ flex: 1, minWidth: 0 }}><Ellipsis style={{ fontSize: 13, fontWeight: 600 }}>{t.product.name}</Ellipsis><div style={{ fontSize: 11.5, color: A.text3 }}>{t.qty}</div></div>
              <span style={{ fontSize: 13, fontWeight: 800, ...tnum }}>{t.sum}</span>
            </Row>
          ))}
        </div>
      </div>
      <TabBar active={0} items={[{ label: 'Asosiy', icon: <Home size={22} /> }, { label: 'Hisobot', icon: <BarChart3 size={22} /> }, { label: 'Ombor', icon: <Boxes size={22} /> }, { label: 'Sozlamalar', icon: <Settings size={22} /> }]} />
    </Phone>
  )
}
