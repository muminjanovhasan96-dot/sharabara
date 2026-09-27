import type { CSSProperties, ReactNode } from 'react'
import { BarChart3, Bell, Boxes, ChevronDown, Heart, Home, LayoutGrid, MessageCircle, PackageX, Plus, Search, Settings, SlidersHorizontal, TriangleAlert, User } from 'lucide-react'
import {
  Bars, Ellipsis, Monitor, Phone, Photo, Row, Seal, SmileLine, adminNav, badgeLabel, categories, channels, dayLabels14, kpis, orders, products,
  revenue14, stateLabel, stockAlerts, tnum, topProducts, type Product,
} from './shared'

export const C = {
  bg: '#FFFCF7', card: '#FFFFFF', text: '#2B2F36', text2: '#6B7280', text3: '#9AA3B2', line: '#F0EBE2',
  green: '#1E9E6A', greenSoft: '#DDF3E9', gold: '#D4A017', red: '#D9534F', redSoft: '#FFE3E1', amber: '#D28A12', amberSoft: '#FFF0CC',
  peach: '#FFE1D1', mint: '#D8F3E6', lilac: '#E8DEFA', sky: '#D9ECFC', lemon: '#FFF3C4', rose: '#FFE0E8', sand: '#F3EAD8', mist: '#E3EEF3',
  font: 'ui-rounded, "SF Pro Rounded", -apple-system, Nunito, "Segoe UI", system-ui, sans-serif',
}
export const channelColorsC = ['#2FA37D', '#3D8FE0', '#E8763F', '#B060C8']
const channelTracksC = [C.mint, C.sky, C.peach, C.lilac]

const pastelTones: [string, string][] = [
  ['#DDE7FA', '#B7C6EA'], ['#E1E9F2', '#B9C5D4'], ['#FFE3D0', '#F1B995'], ['#E4EEF3', '#BDCFDA'],
  ['#D8F3E6', '#A4DEC2'], ['#FFF1BF', '#F4D27A'], ['#E8DEFA', '#C7B5EF'], ['#FFDCE5', '#F3AABD'],
]
const pastelIcon = ['#3F5DA6', '#4A5E78', '#B5552A', '#4F6C80', '#1F7A52', '#9A7710', '#6B4BB8', '#B03B5D']
const catTiles = [C.sky, C.mint, C.peach, C.lilac, C.rose, C.lemon, C.mist, C.sand]

const card: CSSProperties = { background: C.card, borderRadius: 24, boxShadow: '0 2px 6px rgba(43,47,54,.04), 0 14px 34px -22px rgba(43,47,54,.18)' }

function BadgeC({ kind }: { kind: Product['badge'] }) {
  if (kind === 'checked') return <Row gap={5} style={{ fontSize: 11, fontWeight: 700, color: C.text2 }}><Seal size={16} gold={C.gold} ink="#4A3A08" ring={false} />{badgeLabel.checked}</Row>
  const bg = kind === 'official' ? C.sky : C.rose
  const fg = kind === 'official' ? '#2D63A8' : '#B23B4A'
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: bg, color: fg }}>{badgeLabel[kind]}</span>
}

function ProductCardC({ p, idx, w = 171 }: { p: Product; idx: number; w?: number }) {
  return (
    <div style={{ ...card, width: w, padding: 8, flex: 'none' }}>
      <div style={{ position: 'relative' }}>
        <Photo tone={pastelTones[idx]} icon={p.icon} size={w - 16} height={w - 30} radius={18} soft iconColor={pastelIcon[idx]} />
        <div style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.9)', display: 'grid', placeItems: 'center' }}><Heart size={15} color={C.text2} /></div>
      </div>
      <div style={{ padding: '10px 6px 6px' }}>
        <BadgeC kind={p.badge} />
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 6, letterSpacing: -0.4, ...tnum }}>{p.price.replace(' so’m', '')} <span style={{ fontSize: 11, fontWeight: 600, color: C.text3 }}>so’m</span></div>
        {p.old ? <div style={{ fontSize: 12, color: C.text3, textDecoration: 'line-through', ...tnum }}>{p.old} so’m</div> : <div style={{ fontSize: 12 }}>&nbsp;</div>}
        <div style={{ fontSize: 14, color: C.text, lineHeight: '18px', marginTop: 4, height: 36, overflow: 'hidden', fontWeight: 500 }}>{p.name}</div>
        <Ellipsis style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>{p.region} · {p.time}</Ellipsis>
      </div>
    </div>
  )
}

function FloatingTabs({ items, active }: { items: { label: string; icon: ReactNode }[]; active: number }) {
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 128, background: `linear-gradient(180deg, rgba(255,252,247,0) 0%, ${C.bg} 45%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 22, height: 68, borderRadius: 28, background: '#fff', boxShadow: '0 12px 36px -12px rgba(43,47,54,.28), 0 0 0 1px rgba(43,47,54,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px' }}>
        {items.slice(0, 2).map((it, i) => <Tab key={it.label} it={it} on={i === active} />)}
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.green, display: 'grid', placeItems: 'center', color: '#fff', boxShadow: `0 10px 22px -8px ${C.green}`, marginTop: -30, border: '5px solid #fff' }}><Plus size={26} strokeWidth={2.6} /></div>
        {items.slice(2).map((it, i) => <Tab key={it.label} it={it} on={i + 2 === active} />)}
      </div>
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 134, height: 5, borderRadius: 999, background: C.text }} />
    </>
  )
}
function Tab({ it, on }: { it: { label: string; icon: ReactNode }; on: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 60, color: on ? C.green : C.text3, background: on ? C.greenSoft : 'transparent', borderRadius: 16, padding: '6px 0' }}>
      {it.icon}<span style={{ fontSize: 10.5, fontWeight: 700 }}>{it.label}</span>
    </div>
  )
}

/* ─── 1. Mijoz ilovasi — Bosh sahifa ─────────────────────────────────────── */
export function HomeC() {
  return (
    <Phone screenBg={C.bg} font={C.font}>
      <div style={{ paddingTop: 60, color: C.text }}>
        <Row between style={{ padding: '0 20px' }}>
          <div><div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6 }}>Salom, Hasan!</div><div style={{ fontSize: 15, color: C.text2 }}>Bugun nima topamiz?</div></div>
          <div style={{ width: 44, height: 44, borderRadius: 16, background: C.lemon, display: 'grid', placeItems: 'center', position: 'relative' }}><Bell size={20} color="#9A7710" /><span style={{ position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: '50%', background: C.red, border: `2px solid ${C.lemon}` }} /></div>
        </Row>
        <div style={{ margin: '14px 20px 0', height: 54, borderRadius: 999, background: '#fff', boxShadow: '0 2px 10px rgba(43,47,54,.06), 0 0 0 1px rgba(43,47,54,.05)', display: 'flex', alignItems: 'center', padding: '0 6px 0 18px', gap: 10, color: C.text3, fontSize: 16 }}>
          <span style={{ flex: 1 }}>iPhone, divan, velosiped…</span>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: C.green, display: 'grid', placeItems: 'center' }}><Search size={19} color="#fff" strokeWidth={2.4} /></div>
        </div>
        <div style={{ margin: '14px 20px 0', borderRadius: 24, background: C.lemon, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -24, top: -24, width: 110, height: 110, borderRadius: 36, background: 'rgba(255,255,255,.45)', transform: 'rotate(18deg)' }} />
          <div style={{ position: 'absolute', right: 40, bottom: -30, width: 70, height: 70, borderRadius: '50%', background: 'rgba(212,160,23,.18)' }} />
          <Seal size={48} gold={C.gold} ink="#4A3A08" />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>Narx bilan yutamiz</div>
            <div style={{ fontSize: 13, color: '#6B5A1F', marginTop: 2 }}>12 480 ta e’londa narx tekshirilgan</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '16px 20px 0' }}>
          {categories.map((c, i) => (
            <div key={c.label} style={{ borderRadius: 20, background: catTiles[i], height: 78, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <c.icon size={24} color={pastelIcon[i]} strokeWidth={1.9} />
              <span style={{ fontSize: 11, fontWeight: 700, color: pastelIcon[i] }}>{c.label}</span>
            </div>
          ))}
        </div>
        <Row between style={{ padding: '18px 20px 10px' }}>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3 }}>Siz uchun tanladik</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>Barchasi</span>
        </Row>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 20px' }}>
          {[0, 6, 2, 5].map(i => <ProductCardC key={i} p={products[i]} idx={i} />)}
        </div>
      </div>
      <FloatingTabs active={0} items={[{ label: 'Asosiy', icon: <Home size={22} /> }, { label: 'Katalog', icon: <LayoutGrid size={22} /> }, { label: 'Xabarlar', icon: <MessageCircle size={22} /> }, { label: 'Profil', icon: <User size={22} /> }]} />
    </Phone>
  )
}

/* ─── 2. Admin — Boshqaruv paneli ───────────────────────────────────────── */
const stateStyleC: Record<string, { bg: string; fg: string }> = {
  ship: { bg: C.sky, fg: '#2D63A8' }, paid: { bg: C.mint, fg: '#1F7A52' }, wait: { bg: C.lemon, fg: '#9A7710' }, done: { bg: C.sand, fg: '#7A6A4A' }, cancel: { bg: C.rose, fg: '#B23B4A' },
}
const kpiTint = [C.sky, C.mint, C.lilac, C.peach]
const kpiFg = ['#3F5DA6', '#1F7A52', '#6B4BB8', '#B5552A']

export function AdminC() {
  return (
    <Monitor screenBg={C.bg} font={C.font}>
      <div style={{ display: 'flex', height: '100%', color: C.text }}>
        <aside style={{ width: 196, background: '#fff', borderRight: `1px solid ${C.line}`, padding: '16px 12px', display: 'flex', flexDirection: 'column' }}>
          <Row gap={8} style={{ padding: '0 6px', marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: 12, background: C.green, color: '#fff', fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 15 }}>S</div>
            <div><div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>Sharabara</div><div style={{ fontSize: 10.5, color: C.text3, marginTop: -2 }}>Boshqaruv</div></div>
          </Row>
          {adminNav.map((n, i) => (
            <div key={n} style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: 999, fontSize: 13, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? C.green : C.text2, background: i === 0 ? C.greenSoft : 'transparent', marginBottom: 1 }}>{n}</div>
          ))}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 6px 0', borderTop: `1px solid ${C.line}` }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.peach, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#B5552A' }}>N</div>
            <div><div style={{ fontSize: 12.5, fontWeight: 700 }}>Nilufar S.</div><div style={{ fontSize: 10.5, color: C.text3 }}>Operator</div></div>
          </div>
        </aside>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '14px 18px 16px', gap: 12 }}>
          <Row between>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>Boshqaruv paneli</div>
            <Row gap={8}>
              <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: '#fff', boxShadow: '0 0 0 1px rgba(43,47,54,.06)' }}>
                {['Bugun', '7 kun', '30 kun', 'Davr'].map((t, i) => <span key={t} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: i === 1 ? C.green : 'transparent', color: i === 1 ? '#fff' : C.text2 }}>{t}</span>)}
              </div>
              <div style={{ height: 34, width: 34, borderRadius: 999, background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 1px rgba(43,47,54,.06)' }}><SlidersHorizontal size={15} color={C.text2} /></div>
              <div style={{ height: 34, width: 34, borderRadius: 999, background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 1px rgba(43,47,54,.06)' }}><Bell size={15} color={C.text2} /></div>
            </Row>
          </Row>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {kpis.map((k, i) => (
              <div key={k.label} style={{ ...card, borderRadius: 20, padding: '10px 14px', height: 96, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Row between>
                  <div style={{ width: 30, height: 30, borderRadius: 12, background: kpiTint[i], display: 'grid', placeItems: 'center' }}><BarChart3 size={15} color={kpiFg[i]} /></div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: k.up ? '#1F7A52' : '#B23B4A', background: k.up ? C.mint : C.rose, padding: '3px 8px', borderRadius: 999, ...tnum }}>{k.delta}</span>
                </Row>
                <div><div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4, whiteSpace: 'nowrap', ...tnum }}>{k.value}</div><div style={{ fontSize: 11.5, color: C.text3, fontWeight: 600, whiteSpace: 'nowrap' }}>{k.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 232px', gap: 12 }}>
            <div style={{ ...card, borderRadius: 20, padding: '12px 16px 10px' }}>
              <Row between style={{ marginBottom: 6 }}><div><div style={{ fontSize: 14, fontWeight: 800 }}>Kunlik tushum</div><div style={{ fontSize: 11.5, color: C.text3, fontWeight: 600 }}>mln so’m · so’nggi 14 kun</div></div><Row gap={4} style={{ fontSize: 12, fontWeight: 700, color: C.text2 }}>Sentabr <ChevronDown size={14} /></Row></Row>
              <Bars data={revenue14} labels={dayLabels14} color={C.green} muted="#BFE6D4" w={378} h={96} highlight={13} radius={6} gap={8} valueLabel={v => `${String(v).replace('.', ',')} mln`} labelColor={C.text3} />
            </div>
            <div style={{ ...card, borderRadius: 20, padding: '12px 14px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Kanallar</div>
              {channels.map((c, i) => (
                <div key={c.name} style={{ marginBottom: 7 }}>
                  <Row between style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 3 }}><span>{c.name}</span><span style={{ ...tnum }}>{c.pct.toFixed(0)} %</span></Row>
                  <div style={{ height: 8, borderRadius: 4, background: channelTracksC[i] }}><div style={{ width: `${c.pct}%`, height: '100%', borderRadius: 4, background: channelColorsC[i] }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...card, borderRadius: 20, padding: '10px 16px 0', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Row between style={{ marginBottom: 4 }}><div style={{ fontSize: 14, fontWeight: 800 }}>So’nggi buyurtmalar</div><span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>Barchasi</span></Row>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr style={{ color: C.text3, fontSize: 11, textAlign: 'left' }}>{['Raqam', 'Mijoz', 'Tovar', 'Summa', 'Holat', 'Vaqt'].map(h => <th key={h} style={{ padding: '3px 0 5px', fontWeight: 700 }}>{h}</th>)}</tr></thead>
              <tbody>
                {orders.slice(0, 3).map(o => (
                  <tr key={o.id} style={{ borderTop: `1px solid ${C.line}`, height: 34 }}>
                    <td style={{ color: C.text3, ...tnum }}>{o.id}</td><td style={{ fontWeight: 700 }}>{o.client}</td><td style={{ color: C.text2 }}>{o.item}</td>
                    <td style={{ fontWeight: 800, ...tnum }}>{o.sum} so’m</td>
                    <td><span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: stateStyleC[o.state].bg, color: stateStyleC[o.state].fg }}>{stateLabel[o.state]}</span></td>
                    <td style={{ color: C.text3, ...tnum }}>{o.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </Monitor>
  )
}

/* ─── 3. Direktor paneli ────────────────────────────────────────────────── */
export function DirectorC() {
  return (
    <Phone screenBg={C.bg} font={C.font}>
      <div style={{ padding: '60px 20px 0', color: C.text, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Row between>
          <div><div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Xayrli tong, Hasan!</div><div style={{ fontSize: 14, color: C.text2 }}>Yakshanba, 28-sentabr</div></div>
          <div style={{ width: 44, height: 44, borderRadius: 16, background: C.peach, display: 'grid', placeItems: 'center', fontWeight: 800, color: '#B5552A' }}>H</div>
        </Row>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Bugun', 'Hafta', 'Oy'].map((t, i) => <div key={t} style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, background: i === 0 ? C.green : '#fff', color: i === 0 ? '#fff' : C.text2, boxShadow: i === 0 ? undefined : '0 0 0 1px rgba(43,47,54,.06)' }}>{t}</div>)}
        </div>
        <div style={{ ...card, background: C.mint, boxShadow: 'none', padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 40, background: 'rgba(255,255,255,.45)', transform: 'rotate(20deg)' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1F7A52' }}>Bugun</div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginTop: 2, ...tnum }}>83,8 mln so’m</div>
          <Row between style={{ marginTop: 8, alignItems: 'flex-end' }}>
            <div>
              <Row gap={6}><span style={{ fontSize: 12.5, fontWeight: 800, color: '#1F7A52', background: '#fff', padding: '4px 10px', borderRadius: 999 }}>+12 %</span><span style={{ fontSize: 12.5, color: '#3C6B55', fontWeight: 600 }}>kechaga nisbatan</span></Row>
              <div style={{ fontSize: 12.5, color: '#3C6B55', marginTop: 8, fontWeight: 600 }}>Yaxshi ketmoqda — shu tarzda davom eting</div>
            </div>
            <SmileLine color="#1F7A52" w={120} h={44} />
          </Row>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ ...card, boxShadow: 'none', background: C.peach, padding: 14 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: '#B5552A' }}>Buyurtmalar</div><div style={{ fontSize: 26, fontWeight: 800, ...tnum }}>214</div><div style={{ fontSize: 12, color: '#8A5A3A', fontWeight: 600 }}>o’rtacha chek 392 000</div></div>
          <div style={{ ...card, boxShadow: 'none', background: C.sky, padding: 14 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: '#2D63A8' }}>Kassa</div><div style={{ fontSize: 26, fontWeight: 800, ...tnum }}>12,4 <span style={{ fontSize: 13 }}>mln naqd</span></div><div style={{ fontSize: 12, color: '#3F5DA6', fontWeight: 600 }}>karta · Click · Payme 71,4 mln</div></div>
        </div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Kanallar bo’yicha tushum</div>
          {channels.map((c, i) => (
            <div key={c.name} style={{ marginBottom: 8 }}>
              <Row between style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}><span>{c.name}</span><span style={{ ...tnum }}>{String(c.value).replace('.', ',')} mln <span style={{ color: C.text3 }}>· {c.pct.toFixed(0)} %</span></span></Row>
              <div style={{ height: 12, borderRadius: 6, background: channelTracksC[i] }}><div style={{ width: `${c.pct}%`, height: '100%', borderRadius: 6, background: channelColorsC[i] }} /></div>
            </div>
          ))}
        </div>
        <div style={{ ...card, padding: '12px 16px' }}>
          <Row between style={{ marginBottom: 4 }}><div style={{ fontSize: 15, fontWeight: 800 }}>Ombor</div><span style={{ fontSize: 11.5, fontWeight: 800, color: '#B23B4A', background: C.rose, padding: '3px 9px', borderRadius: 999 }}>3 ogohlantirish</span></Row>
          {stockAlerts.map(s => (
            <Row key={s.name} gap={10} style={{ padding: '7px 0', borderTop: `1px solid ${C.line}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 12, background: s.level === 'out' ? C.rose : C.lemon, display: 'grid', placeItems: 'center' }}>{s.level === 'out' ? <PackageX size={16} color="#B23B4A" /> : <TriangleAlert size={16} color="#9A7710" />}</div>
              <div style={{ flex: 1, minWidth: 0 }}><Ellipsis style={{ fontSize: 13.5, fontWeight: 700 }}>{s.name}</Ellipsis><div style={{ fontSize: 12, color: C.text3, fontWeight: 600 }}>{s.note}</div></div>
            </Row>
          ))}
        </div>
        <div style={{ ...card, padding: '12px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Top mahsulotlar · bugun</div>
          {topProducts.map((t, i) => (
            <Row key={t.product.name} gap={10} style={{ padding: '6px 0' }}>
              <Photo tone={pastelTones[i]} icon={t.product.icon} size={40} radius={14} soft iconColor={pastelIcon[i]} />
              <div style={{ flex: 1, minWidth: 0 }}><Ellipsis style={{ fontSize: 13.5, fontWeight: 700 }}>{t.product.name}</Ellipsis><div style={{ fontSize: 12, color: C.text3, fontWeight: 600 }}>{t.qty}</div></div>
              <span style={{ fontSize: 14, fontWeight: 800, ...tnum }}>{t.sum}</span>
            </Row>
          ))}
        </div>
      </div>
      <FloatingTabs active={0} items={[{ label: 'Asosiy', icon: <Home size={22} /> }, { label: 'Hisobot', icon: <BarChart3 size={22} /> }, { label: 'Ombor', icon: <Boxes size={22} /> }, { label: 'Sozlamalar', icon: <Settings size={22} /> }]} />
    </Phone>
  )
}
