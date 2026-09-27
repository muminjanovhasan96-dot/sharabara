import type { CSSProperties, ReactNode } from 'react'
import {
  Baby, BatteryFull, Bike, Car, Check as CheckIcon, Dumbbell, Footprints, Laptop, Shirt, Signal, Smartphone, Sofa, Tv, WashingMachine, Wifi,
  type LucideIcon,
} from 'lucide-react'

/* ─── Kontent (barcha yo’nalishlar uchun umumiy) ─────────────────────────── */

export type Badge = 'checked' | 'official' | 'drop'

export interface Product {
  name: string
  price: string
  old?: string
  badge: Badge
  region: string
  time: string
  tone: [string, string]
  icon: LucideIcon
}

export const products: Product[] = [
  { name: 'iPhone 13 Pro, 256 GB', price: '6 200 000 so’m', old: '6 900 000', badge: 'checked', region: 'Toshkent, Chilonzor', time: '2 soat oldin', tone: ['#5a6d99', '#1b2233'], icon: Smartphone },
  { name: 'Samsung 55" 4K Crystal UHD', price: '5 450 000 so’m', badge: 'official', region: 'Mall · Samsung Store', time: 'Bugun', tone: ['#8fa0b8', '#2b3547'], icon: Tv },
  { name: 'Divan Comfort 3, kulrang', price: '3 100 000 so’m', old: '3 800 000', badge: 'drop', region: 'Samarqand', time: 'Kecha', tone: ['#d6b18c', '#7d5433'], icon: Sofa },
  { name: 'Bosch Serie 4, 7 kg', price: '4 750 000 so’m', badge: 'official', region: 'Mall · Bosch', time: 'Bugun', tone: ['#eef1f5', '#8f99a5'], icon: WashingMachine },
  { name: 'Velosiped Trinx M136', price: '2 300 000 so’m', badge: 'checked', region: 'Buxoro', time: '5 soat oldin', tone: ['#63b57f', '#1c5434'], icon: Bike },
  { name: 'Nike Air Max 90, 42', price: '850 000 so’m', old: '1 100 000', badge: 'drop', region: 'Toshkent, Yunusobod', time: '1 soat oldin', tone: ['#f5b073', '#b04d24'], icon: Footprints },
  { name: 'MacBook Air M2, 8/256', price: '9 800 000 so’m', badge: 'checked', region: 'Toshkent, Mirzo Ulug’bek', time: '3 soat oldin', tone: ['#d3d7de', '#646b78'], icon: Laptop },
  { name: 'Chicco aravacha, 2 in 1', price: '1 650 000 so’m', badge: 'checked', region: 'Farg’ona', time: 'Kecha', tone: ['#eb9db6', '#8f3554'], icon: Baby },
]

export const badgeLabel: Record<Badge, string> = { checked: 'Narx tekshirilgan', official: 'Rasmiy', drop: 'Narx tushdi' }

export interface Category { label: string; icon: LucideIcon; bg: string; fg: string }
export const categories: Category[] = [
  { label: 'Telefonlar', icon: Smartphone, bg: '#E8F0FE', fg: '#2F6FED' },
  { label: 'Elektronika', icon: Tv, bg: '#EAF7EF', fg: '#1E9E6A' },
  { label: 'Uy-ro’zg’or', icon: WashingMachine, bg: '#FFF1E6', fg: '#E07A2F' },
  { label: 'Mebel', icon: Sofa, bg: '#F3ECFF', fg: '#7C5CD6' },
  { label: 'Kiyim', icon: Shirt, bg: '#FFE9EE', fg: '#D6455E' },
  { label: 'Bolalar', icon: Baby, bg: '#FFF8DB', fg: '#B8901E' },
  { label: 'Avto', icon: Car, bg: '#E6F4F8', fg: '#1D7FA3' },
  { label: 'Sport', icon: Dumbbell, bg: '#EEF1F5', fg: '#4A5568' },
]

export interface Channel { name: string; value: number; pct: number }
export const channels: Channel[] = [
  { name: 'Ilova', value: 38.2, pct: 45.6 },
  { name: 'Telegram', value: 24.6, pct: 29.4 },
  { name: 'Instagram', value: 14.1, pct: 16.8 },
  { name: 'Do’kon', value: 6.9, pct: 8.2 },
]

export type OrderState = 'ship' | 'paid' | 'wait' | 'done' | 'cancel'
export interface Order { id: string; client: string; item: string; sum: string; state: OrderState; when: string }
export const orders: Order[] = [
  { id: '№ 48213', client: 'Dilnoza R.', item: 'iPhone 13 Pro, 256 GB', sum: '6 200 000', state: 'ship', when: '09:41' },
  { id: '№ 48212', client: 'Samsung Store', item: 'Samsung 55" 4K', sum: '5 450 000', state: 'paid', when: '09:22' },
  { id: '№ 48211', client: 'Jasur T.', item: 'Divan Comfort 3', sum: '3 100 000', state: 'wait', when: '08:57' },
  { id: '№ 48210', client: 'Madina A.', item: 'Nike Air Max 90, 42', sum: '850 000', state: 'done', when: '08:30' },
  { id: '№ 48209', client: 'Bobur K.', item: 'Velosiped Trinx M136', sum: '2 300 000', state: 'cancel', when: 'Kecha' },
]
export const stateLabel: Record<OrderState, string> = {
  ship: 'Yetkazilmoqda', paid: 'To’landi', wait: 'Kutilmoqda', done: 'Yakunlandi', cancel: 'Bekor qilindi',
}

export interface Kpi { label: string; value: string; delta: string; up: boolean; spark: number[] }
export const kpis: Kpi[] = [
  { label: 'Buyurtmalar', value: '1 284', delta: '+8,4 %', up: true, spark: [40, 46, 44, 52, 58, 55, 63, 70] },
  { label: 'Tushum', value: '1,92 mlrd', delta: '+12,1 %', up: true, spark: [30, 38, 36, 45, 50, 58, 62, 71] },
  { label: 'Faol e’lonlar', value: '18 430', delta: '+3,2 %', up: true, spark: [60, 61, 63, 62, 66, 68, 70, 72] },
  { label: 'Moderatsiya', value: '37', delta: '−12', up: false, spark: [70, 66, 62, 64, 55, 50, 44, 37] },
]

export const revenue14 = [61, 68, 72, 58, 75, 88, 92, 70, 77, 81, 69, 85, 90, 83.8]
export const dayLabels14 = ['15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28']

export interface TopProduct { product: Product; qty: string; sum: string }
export const topProducts: TopProduct[] = [
  { product: products[0], qty: '4 dona', sum: '24,8 mln' },
  { product: products[1], qty: '3 dona', sum: '16,4 mln' },
  { product: products[2], qty: '2 dona', sum: '6,2 mln' },
]

export interface StockAlert { name: string; note: string; level: 'low' | 'out' }
export const stockAlerts: StockAlert[] = [
  { name: 'Bosch Serie 4, 7 kg', note: 'Tugadi · 6 ta buyurtma kutmoqda', level: 'out' },
  { name: 'Samsung 55" 4K', note: '2 dona qoldi', level: 'low' },
  { name: 'Chicco aravacha', note: '4 dona qoldi', level: 'low' },
]

export const adminNav = ['Boshqaruv paneli', 'Buyurtmalar', 'E’lonlar', 'Moderatsiya', 'Kompaniyalar', 'Kampaniyalar', 'Logistika', 'Komissiyalar', 'Audit']

/* ─── Ramkalar ────────────────────────────────────────────────────────────── */

export const PHONE_W = 390
export const PHONE_H = 844

interface PhoneProps { children: ReactNode; screenBg: string; statusDark?: boolean; bezel?: string; font?: string }

/** iPhone-ga o’xshash ramka: 390×844 ekran, 48px radius, Dynamic Island. */
export function Phone({ children, screenBg, statusDark = false, bezel = '#0E0F13', font }: PhoneProps) {
  const fg = statusDark ? '#F7F7F9' : '#0E0F13'
  return (
    <div
      style={{
        width: PHONE_W + 24, height: PHONE_H + 24, padding: 12, borderRadius: 60, background: bezel,
        boxShadow: '0 30px 60px -30px rgba(15,20,35,.45), inset 0 0 0 2px rgba(255,255,255,.08)', flex: 'none',
      }}
    >
      <div style={{ position: 'relative', width: PHONE_W, height: PHONE_H, borderRadius: 48, overflow: 'hidden', background: screenBg, fontFamily: font }}>
        {/* status bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 30px 0', color: fg, fontSize: 15, fontWeight: 600, zIndex: 20, pointerEvents: 'none' }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Signal size={15} strokeWidth={2.4} /><Wifi size={15} strokeWidth={2.4} /><BatteryFull size={20} strokeWidth={2} />
          </span>
        </div>
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 122, height: 36, borderRadius: 20, background: '#0E0F13', zIndex: 21 }} />
        {children}
      </div>
    </div>
  )
}

export const MON_W = 880
export const MON_H = 560

/** Ingichka ramkali monitor: 880×560 ekran. */
export function Monitor({ children, screenBg, font }: { children: ReactNode; screenBg: string; font?: string }) {
  return (
    <div style={{ flex: 'none', width: MON_W + 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: MON_W + 20, padding: 10, borderRadius: 18, background: 'linear-gradient(180deg,#2A2C31,#15161A)', boxShadow: '0 30px 60px -30px rgba(15,20,35,.5), inset 0 0 0 1px rgba(255,255,255,.08)' }}>
        <div style={{ position: 'relative', width: MON_W, height: MON_H, borderRadius: 10, overflow: 'hidden', background: screenBg, fontFamily: font }}>{children}</div>
      </div>
      <div style={{ width: 120, height: 22, background: 'linear-gradient(180deg,#1B1C20,#2A2C31)', clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)' }} />
      <div style={{ width: 260, height: 8, borderRadius: 999, background: '#1F2024' }} />
    </div>
  )
}

/* ─── Mahsulot “fotosi” ──────────────────────────────────────────────────── */

interface PhotoProps { tone: [string, string]; icon: LucideIcon; size?: number | string; height?: number | string; radius?: number; iconSize?: number; style?: CSSProperties; soft?: boolean; iconColor?: string }

/** Rasm o’rniga: gradient plitka + katta ikonka + yumshoq yorug’lik va soya. */
export function Photo({ tone, icon: Icon, size = 120, height, radius = 16, iconSize, style, soft = false, iconColor }: PhotoProps) {
  const h = height ?? size
  const iconPx = iconSize ?? (typeof size === 'number' ? Math.round(size * 0.42) : 48)
  const [a, b] = tone
  const bg = soft
    ? `radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,.75), rgba(255,255,255,0) 60%), linear-gradient(150deg, ${a} 0%, ${b} 100%)`
    : `radial-gradient(90% 70% at 28% 18%, rgba(255,255,255,.55), rgba(255,255,255,0) 60%), radial-gradient(70% 45% at 62% 92%, rgba(0,0,0,.28), rgba(0,0,0,0) 70%), linear-gradient(150deg, ${a} 0%, ${b} 100%)`
  return (
    <div style={{ width: size, height: h, borderRadius: radius, background: bg, display: 'grid', placeItems: 'center', flex: 'none', position: 'relative', overflow: 'hidden', ...style }}>
      <Icon size={iconPx} strokeWidth={soft ? 1.6 : 1.4} color={iconColor ?? 'rgba(255,255,255,.92)'} style={{ filter: soft ? 'drop-shadow(0 4px 8px rgba(0,0,0,.12))' : 'drop-shadow(0 6px 10px rgba(0,0,0,.25))' }} />
    </div>
  )
}

/* ─── Diagrammalar (statik SVG) ─────────────────────────────────────────── */

function pathFor(data: number[], w: number, h: number, pad = 2) {
  const min = Math.min(...data), max = Math.max(...data)
  const span = max - min || 1
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (v - min) / span) * (h - pad * 2)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

export function Sparkline({ data, color, w = 96, h = 32, fill = false, glow = false, width = 2 }: { data: number[]; color: string; w?: number; h?: number; fill?: boolean; glow?: boolean; width?: number }) {
  const d = pathFor(data, w, h, 3)
  const area = `${d} L${w - 3} ${h} L3 ${h} Z`
  const id = `sg-${color.replace('#', '')}-${w}-${h}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".35" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${id})`} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={glow ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined} />
    </svg>
  )
}

function topRoundedBar(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h)
  return `M${x} ${y + h} V${y + rr} Q${x} ${y} ${x + rr} ${y} H${x + w - rr} Q${x + w} ${y} ${x + w} ${y + rr} V${y + h} Z`
}

interface BarsProps { data: number[]; labels?: string[]; color: string; muted?: string; w: number; h: number; highlight?: number; radius?: number; gap?: number; labelColor?: string; grid?: string; valueLabel?: (v: number) => string }

/** Ustunli diagramma: ingichka ustunlar, yuqorisi 4px yumaloq, baza chizig’iga yopishgan. */
export function Bars({ data, labels, color, muted, w, h, highlight, radius = 4, gap = 6, labelColor = '#8A94A6', grid, valueLabel }: BarsProps) {
  const labelH = labels ? 16 : 0
  const valueH = valueLabel ? 14 : 0
  const plotH = h - labelH - valueH
  const max = Math.max(...data)
  const bw = (w - gap * (data.length - 1)) / data.length
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden>
      {grid && [0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={0} x2={w} y1={valueH + plotH * (1 - t)} y2={valueH + plotH * (1 - t)} stroke={grid} strokeWidth={1} />
      ))}
      {data.map((v, i) => {
        const bh = Math.max(3, (v / max) * (plotH - 2))
        const x = i * (bw + gap)
        const y = valueH + plotH - bh
        const hi = highlight === undefined || highlight === i
        return (
          <g key={i}>
            <path d={topRoundedBar(x, y, bw, bh, radius)} fill={hi ? color : (muted ?? color)} opacity={hi ? 1 : 0.5} />
            {valueLabel && hi && highlight !== undefined && (
              <text x={x + bw / 2 + 26 > w ? x + bw : x + bw / 2} y={valueH - 3} textAnchor={x + bw / 2 + 26 > w ? 'end' : 'middle'} fontSize={10} fontWeight={600} fill={labelColor}>{valueLabel(v)}</text>
            )}
            {labels && <text x={x + bw / 2} y={h - 3} textAnchor="middle" fontSize={10} fill={labelColor}>{labels[i]}</text>}
          </g>
        )
      })}
      <line x1={0} x2={w} y1={valueH + plotH} y2={valueH + plotH} stroke={labelColor} strokeOpacity={0.35} strokeWidth={1} />
    </svg>
  )
}

interface DonutProps { segments: { value: number; color: string }[]; size?: number; stroke?: number; track?: string; children?: ReactNode }

export function Donut({ segments, size = 120, stroke = 14, track = 'rgba(0,0,0,.06)', children }: DonutProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0)
  const gapLen = 3
  const starts = segments.map((_, i) => segments.slice(0, i).reduce((s, x) => s + (x.value / total) * c, 0))
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c
          const dash = `${Math.max(0, len - gapLen)} ${c - Math.max(0, len - gapLen)}`
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={dash} strokeDashoffset={-starts[i]} strokeLinecap="butt" />
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  )
}

/** Yumshoq “tabassum” trend chizig’i (yo’nalish C uchun) */
export function SmileLine({ color, w = 140, h = 44 }: { color: string; w?: number; h?: number }) {
  const d = `M4 ${h * 0.35} C ${w * 0.3} ${h * 0.95}, ${w * 0.6} ${h * 0.95}, ${w - 4} ${h * 0.15}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <circle cx={w - 4} cy={h * 0.15} r={5} fill={color} stroke="#fff" strokeWidth={2} />
    </svg>
  )
}

/* ─── Kichik yordamchilar ────────────────────────────────────────────────── */

export function Row({ children, style, gap = 8, between = false, center = true }: { children: ReactNode; style?: CSSProperties; gap?: number; between?: boolean; center?: boolean }) {
  return <div style={{ display: 'flex', alignItems: center ? 'center' : undefined, justifyContent: between ? 'space-between' : undefined, gap, ...style }}>{children}</div>
}

export function Ellipsis({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, ...style }}>{children}</div>
}

export const tnum: CSSProperties = { fontVariantNumeric: 'tabular-nums' }

/** “Narx tekshirilgan” muhri */
export function Seal({ size = 56, gold = '#D4A017', ink = '#10203A', ring = true }: { size?: number; gold?: string; ink?: string; ring?: boolean }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #fff3c4, ${gold} 60%)`, display: 'grid', placeItems: 'center', boxShadow: `0 6px 16px -6px ${gold}`, flex: 'none', position: 'relative' }}>
      {ring && <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: `1.5px dashed ${ink}`, opacity: 0.55 }} />}
      <CheckIcon size={Math.round(size * 0.46)} strokeWidth={3} color={ink} />
    </div>
  )
}
