import type { HTMLAttributes, ReactNode, SVGAttributes } from 'react'
import { cn } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { Seal } from './Seal'
import { Stamp } from './Stamp'

/* ─── drawings: viewBox 0 0 200 200, currentColor strokes, ≤ ~15 elements each ─── */
export const ILLUSTRATION_CATEGORIES = ['phone', 'laptop', 'tv', 'appliance', 'furniture', 'clothing', 'sport', 'baby'] as const
export type IllustrationCategory = (typeof ILLUSTRATION_CATEGORIES)[number]
export type IllustrationId = `ill-${IllustrationCategory}-${1 | 2 | 3 | 4}`

/* ─── «Studiya foto» uslubi: to'ldirilgan shakllar, yumshoq soya, blik. viewBox 0 0 200 200 ─── */
const SH = '#1a2430'
const shadow = (cx = 100, cy = 176, rx = 52) => <ellipse cx={cx} cy={cy} rx={rx} ry={6} fill={SH} opacity=".13" />
const gloss = (x: number, y: number, w: number, h: number, rx = 10, o = 0.1) => <rect x={x} y={y} width={w} height={h} rx={rx} fill="#fff" opacity={o} />
const wall = (x: number, y: number, w: number, h: number, rx: number, a: string, b: string) => (<>
  <rect x={x} y={y} width={w} height={h} rx={rx} fill={a} />
  <path d={`M${x} ${y + h * 0.62} Q${x + w * 0.3} ${y + h * 0.3} ${x + w * 0.55} ${y + h * 0.5} T${x + w} ${y + h * 0.35} V${y + h - rx} a${rx} ${rx} 0 0 1 -${rx} ${rx} H${x + rx} a${rx} ${rx} 0 0 1 -${rx} -${rx} Z`} fill={b} opacity=".85" />
  <circle cx={x + w * 0.72} cy={y + h * 0.28} r={Math.min(w, h) * 0.09} fill="#fff" opacity=".35" />
</>)

function phoneFront(body: string, wp1: string, wp2: string) {
  return (<>
    {shadow(100, 180, 46)}
    <rect x="58" y="22" width="84" height="152" rx="17" fill={body} />
    <rect x="62" y="26" width="76" height="144" rx="14" fill="#0b1220" />
    {wall(62, 26, 76, 144, 14, wp1, wp2)}
    <rect x="86" y="32" width="28" height="9" rx="4.5" fill="#05080f" />
    {gloss(62, 26, 18, 144, 14, 0.07)}
    <rect x="86" y="163" width="28" height="3" rx="1.5" fill="#fff" opacity=".7" />
  </>)
}
function phoneBack(body: string, cam: string) {
  return (<>
    {shadow(100, 180, 46)}
    <rect x="58" y="22" width="84" height="152" rx="17" fill={body} />
    {gloss(58, 22, 20, 152, 17, 0.12)}
    <rect x="66" y="30" width="38" height="52" rx="11" fill={cam} />
    <circle cx="77" cy="41" r="6" fill="#0b1220" /><circle cx="77" cy="41" r="2.5" fill="#2b3a5c" />
    <circle cx="93" cy="41" r="6" fill="#0b1220" /><circle cx="93" cy="41" r="2.5" fill="#2b3a5c" />
    <circle cx="77" cy="63" r="6" fill="#0b1220" /><circle cx="77" cy="63" r="2.5" fill="#2b3a5c" />
    <circle cx="94" cy="66" r="2.5" fill="#f3e7c3" />
    <circle cx="100" cy="128" r="8" fill="#fff" opacity=".18" />
  </>)
}
function laptopOpen(base: string, screenA: string, screenB: string, skew = 0) {
  return (<>
    {shadow(100, 170, 78)}
    <g transform={`skewX(${skew})`}>
      <rect x="40" y="36" width="120" height="82" rx="6" fill={base} />
      <rect x="45" y="41" width="110" height="72" rx="3" fill="#0b1220" />
      {wall(45, 41, 110, 72, 3, screenA, screenB)}
    </g>
    <path d="M28 122h144l12 26H16z" fill={base} />
    <path d="M28 122h144l12 26H16z" fill="#000" opacity=".08" />
    <rect x="82" y="128" width="36" height="6" rx="3" fill="#000" opacity=".18" />
    {gloss(16, 140, 168, 6, 3, 0.25)}
  </>)
}
function laptopClosed(base: string) {
  return (<>
    {shadow(100, 152, 76)}
    <rect x="22" y="96" width="156" height="30" rx="6" fill={base} />
    <rect x="22" y="96" width="156" height="12" rx="6" fill="#fff" opacity=".22" />
    <rect x="30" y="126" width="140" height="8" rx="4" fill="#000" opacity=".2" />
    <circle cx="100" cy="111" r="6" fill="#fff" opacity=".55" />
  </>)
}
function tv(frame: string, a: string, b: string, stand: 'legs' | 'center' = 'legs') {
  return (<>
    {shadow(100, 172, 70)}
    <rect x="16" y="40" width="168" height="98" rx="5" fill={frame} />
    <rect x="20" y="44" width="160" height="90" rx="2" fill="#0b1220" />
    {wall(20, 44, 160, 90, 2, a, b)}
    {gloss(20, 44, 50, 90, 2, 0.06)}
    {stand === 'legs' ? <><path d="M40 138l-12 24h20z" fill={frame} /><path d="M160 138l12 24h-20z" fill={frame} /></> : <><rect x="94" y="138" width="12" height="16" fill={frame} /><rect x="64" y="154" width="72" height="8" rx="4" fill={frame} /></>}
  </>)
}
const PH = { blue: '#4d6f96', graphite: '#33363d', gold: '#d8c39e', green: '#5c7c65' }
const D: Record<IllustrationId, ReactNode> = {
  'ill-phone-1': phoneFront(PH.blue, '#2e5c9a', '#7fb1e6'),
  'ill-phone-2': phoneBack(PH.graphite, '#202227'),
  'ill-phone-3': (<>
    {shadow(100, 180, 70)}
    <rect x="18" y="98" width="98" height="74" rx="6" fill="#efe8d8" />
    <rect x="18" y="98" width="98" height="16" rx="6" fill="#e3d9c2" />
    <rect x="18" y="98" width="98" height="6" rx="3" fill="#fff" opacity=".5" />
    <circle cx="67" cy="140" r="13" fill="#e3be4a" /><path d="M60 140l5 5 9-10" fill="none" stroke="#1a2430" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="118" y="34" width="60" height="120" rx="13" fill={PH.gold} />
    <rect x="121" y="37" width="54" height="114" rx="11" fill="#0b1220" />
    {wall(121, 37, 54, 114, 11, '#8a6a2a', '#f0d48a')}
    <rect x="136" y="42" width="24" height="7" rx="3.5" fill="#05080f" />
  </>),
  'ill-phone-4': (<>
    {shadow(100, 180, 78)}
    <g transform="translate(-22 0)">{phoneBack(PH.green, '#3f5647')}</g>
    <g transform="translate(24 8) scale(.94)">{phoneFront(PH.graphite, '#3a2f6e', '#9a8fe6')}</g>
  </>),
  'ill-laptop-1': laptopOpen('#c9ccd2', '#2d4a8a', '#8fc3ff'),
  'ill-laptop-2': laptopClosed('#6d7178'),
  'ill-laptop-3': laptopOpen('#3a3d44', '#4a2c6f', '#d7a1ff', -6),
  'ill-laptop-4': (<>
    <g transform="translate(-12 0) scale(.9)">{laptopOpen('#d5d7dc', '#1d5c4a', '#8fe0c4')}</g>
    <ellipse cx="164" cy="150" rx="14" ry="20" fill="#e6e7ea" /><ellipse cx="164" cy="150" rx="14" ry="20" fill="#000" opacity=".06" /><rect x="163" y="134" width="2" height="12" fill="#000" opacity=".25" />
  </>),
  'ill-tv-1': tv('#15181d', '#1d3a6e', '#7cc4ff'),
  'ill-tv-2': tv('#2a2d33', '#5a1f4a', '#ff9ac6', 'center'),
  'ill-tv-3': (<>
    {tv('#15181d', '#1f5a3a', '#9fe8b8')}
    <rect x="150" y="146" width="14" height="42" rx="5" fill="#2a2d33" transform="rotate(-18 157 167)" />
    <circle cx="155" cy="156" r="2.5" fill="#e3be4a" transform="rotate(-18 157 167)" />
  </>),
  'ill-tv-4': (<>
    {tv('#15181d', '#6e3a1d', '#ffc98a', 'center')}
    <rect x="30" y="164" width="140" height="10" rx="5" fill="#33363d" />
  </>),
  'ill-appliance-1': (<>
    {shadow(100, 178, 60)}
    <rect x="46" y="28" width="108" height="148" rx="8" fill="#f2f2f0" />
    <rect x="46" y="28" width="108" height="24" rx="8" fill="#e4e5e3" />
    <rect x="56" y="36" width="42" height="8" rx="4" fill="#9aa0a8" /><circle cx="140" cy="40" r="6" fill="#e3be4a" />
    <circle cx="100" cy="112" r="40" fill="#cfd3d8" /><circle cx="100" cy="112" r="32" fill="#1a2b45" /><circle cx="100" cy="112" r="22" fill="#2e4a75" opacity=".9" />
    <path d="M78 100q22-18 44 0" fill="none" stroke="#fff" strokeWidth="3" opacity=".35" strokeLinecap="round" />
  </>),
  'ill-appliance-2': (<>
    {shadow(100, 182, 52)}
    <rect x="54" y="18" width="92" height="164" rx="8" fill="#e8ebee" />
    <rect x="54" y="18" width="92" height="64" rx="8" fill="#dfe3e7" />
    <rect x="54" y="80" width="92" height="3" fill="#b8bec6" />
    <rect x="132" y="34" width="5" height="34" rx="2.5" fill="#9aa0a8" /><rect x="132" y="96" width="5" height="56" rx="2.5" fill="#9aa0a8" />
    {gloss(54, 18, 22, 164, 8, 0.35)}
  </>),
  'ill-appliance-3': (<>
    {shadow(100, 150, 78)}
    <rect x="18" y="62" width="164" height="60" rx="14" fill="#f4f4f2" />
    <rect x="18" y="62" width="164" height="30" rx="14" fill="#fff" opacity=".6" />
    <rect x="30" y="100" width="140" height="4" rx="2" fill="#c5cad0" /><rect x="30" y="108" width="140" height="4" rx="2" fill="#c5cad0" />
    <circle cx="160" cy="80" r="3" fill="#2e6b4a" />
    <path d="M60 130q10 14 0 28M100 130q10 14 0 28M140 130q10 14 0 28" fill="none" stroke="#9fc8e8" strokeWidth="3" strokeLinecap="round" opacity=".8" />
  </>),
  'ill-appliance-4': (<>
    {shadow(100, 178, 54)}
    <rect x="96" y="18" width="12" height="120" rx="6" fill="#33363d" />
    <rect x="88" y="14" width="28" height="18" rx="6" fill="#4b4f57" />
    <rect x="86" y="64" width="34" height="58" rx="8" fill="#e3be4a" />
    <rect x="90" y="70" width="26" height="30" rx="4" fill="#fff" opacity=".35" />
    <path d="M102 138v14" stroke="#33363d" strokeWidth="8" strokeLinecap="round" />
    <rect x="58" y="150" width="88" height="20" rx="10" fill="#4b4f57" />
    <rect x="58" y="150" width="88" height="8" rx="4" fill="#fff" opacity=".18" />
  </>),
  'ill-furniture-1': (<>
    {shadow(100, 172, 84)}
    <rect x="22" y="76" width="156" height="60" rx="10" fill="#8a6a4d" />
    <rect x="34" y="60" width="132" height="40" rx="10" fill="#a07f5f" />
    <rect x="40" y="96" width="56" height="34" rx="6" fill="#b8956f" /><rect x="104" y="96" width="56" height="34" rx="6" fill="#b8956f" />
    <rect x="22" y="76" width="18" height="60" rx="8" fill="#7a5c42" /><rect x="160" y="76" width="18" height="60" rx="8" fill="#7a5c42" />
    <rect x="34" y="136" width="8" height="18" rx="2" fill="#3b2c20" /><rect x="158" y="136" width="8" height="18" rx="2" fill="#3b2c20" />
    {gloss(34, 60, 132, 12, 6, 0.12)}
  </>),
  'ill-furniture-2': (<>
    {shadow(100, 182, 58)}
    <rect x="48" y="16" width="104" height="166" rx="6" fill="#d9c7a8" />
    <rect x="52" y="20" width="47" height="158" rx="3" fill="#e8d9bd" /><rect x="101" y="20" width="47" height="158" rx="3" fill="#e8d9bd" />
    <rect x="92" y="90" width="4" height="22" rx="2" fill="#7a5c42" /><rect x="104" y="90" width="4" height="22" rx="2" fill="#7a5c42" />
    <rect x="48" y="16" width="104" height="6" rx="3" fill="#fff" opacity=".4" />
  </>),
  'ill-furniture-3': (<>
    {shadow(100, 176, 82)}
    <rect x="20" y="86" width="160" height="12" rx="4" fill="#c9a97a" />
    <rect x="28" y="98" width="8" height="66" fill="#8a6a4d" /><rect x="164" y="98" width="8" height="66" fill="#8a6a4d" />
    <rect x="112" y="98" width="60" height="30" rx="4" fill="#b8956f" />
    <rect x="60" y="46" width="60" height="40" rx="4" fill="#2a2d33" /><rect x="64" y="50" width="52" height="32" rx="2" fill="#2f6fa8" /><rect x="84" y="86" width="12" height="4" fill="#2a2d33" />
    <rect x="44" y="110" width="40" height="8" rx="4" fill="#3d4149" /><rect x="50" y="118" width="6" height="40" fill="#3d4149" /><rect x="72" y="118" width="6" height="40" fill="#3d4149" />
    <rect x="40" y="70" width="46" height="42" rx="8" fill="#5a5f68" />
  </>),
  'ill-furniture-4': (<>
    {shadow(100, 174, 64)}
    <rect x="46" y="48" width="108" height="72" rx="14" fill="#5c7c65" />
    <rect x="36" y="88" width="128" height="52" rx="12" fill="#4b6853" />
    <rect x="58" y="96" width="84" height="34" rx="8" fill="#6f8f78" />
    <rect x="36" y="88" width="22" height="52" rx="10" fill="#3f5747" /><rect x="142" y="88" width="22" height="52" rx="10" fill="#3f5747" />
    <rect x="50" y="140" width="8" height="16" rx="2" fill="#3b2c20" /><rect x="142" y="140" width="8" height="16" rx="2" fill="#3b2c20" />
    {gloss(46, 48, 108, 14, 8, 0.12)}
  </>),
  'ill-clothing-1': (<>
    {shadow(100, 176, 62)}
    <path d="M70 34l30 10 30-10 30 22-16 22-12-6v96H68V72l-12 6-16-22z" fill="#2f6fa8" />
    <path d="M70 34l30 10 30-10 30 22-16 22-12-6v96H68V72l-12 6-16-22z" fill="#fff" opacity=".08" />
    <path d="M84 36q16 14 32 0" fill="none" stroke="#1d4a74" strokeWidth="4" strokeLinecap="round" />
    <rect x="86" y="96" width="28" height="28" rx="6" fill="#e3be4a" />
  </>),
  'ill-clothing-2': (<>
    {shadow(100, 176, 62)}
    <path d="M62 44l22-14h32l22 14 24 30-18 18-10-8v90H56V84l-10 8-18-18z" fill="#1a2430" />
    <path d="M74 60h52M74 82h52M74 104h52M74 126h52M74 148h52" stroke="#2c3a4e" strokeWidth="8" strokeLinecap="round" />
    <rect x="96" y="34" width="8" height="140" fill="#3a4a60" />
    <path d="M84 30q16 12 32 0" fill="none" stroke="#0e141c" strokeWidth="5" strokeLinecap="round" />
  </>),
  'ill-clothing-3': (<>
    {shadow(100, 176, 56)}
    <path d="M78 34h44l6 40-8 6 26 92H54l26-92-8-6z" fill="#a63a2a" />
    <path d="M78 34h44l6 40-8 6 26 92H54l26-92-8-6z" fill="#fff" opacity=".06" />
    <path d="M84 34q16 14 32 0" fill="none" stroke="#7d281c" strokeWidth="4" strokeLinecap="round" />
    <path d="M70 80h60" stroke="#e3be4a" strokeWidth="5" strokeLinecap="round" />
  </>),
  'ill-clothing-4': (<>
    {shadow(100, 176, 62)}
    <path d="M66 46l20-12h28l20 12 26 26-18 16-10-6v92H58V82l-10 6-18-16z" fill="#8b8f96" />
    <path d="M78 34q8-16 22-16t22 16" fill="none" stroke="#6f737a" strokeWidth="10" strokeLinecap="round" />
    <rect x="76" y="118" width="48" height="26" rx="8" fill="#6f737a" />
    <path d="M92 60v30M108 60v30" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
  </>),
  'ill-sport-1': (<>
    {shadow(100, 152, 76)}
    <rect x="70" y="92" width="60" height="14" rx="7" fill="#7a7f88" />
    <rect x="26" y="70" width="18" height="58" rx="5" fill="#2a2d33" /><rect x="44" y="76" width="16" height="46" rx="4" fill="#3d4149" />
    <rect x="156" y="70" width="18" height="58" rx="5" fill="#2a2d33" /><rect x="140" y="76" width="16" height="46" rx="4" fill="#3d4149" />
    {gloss(70, 92, 60, 5, 2.5, 0.3)}
  </>),
  'ill-sport-2': (<>
    {shadow(100, 176, 82)}
    <path d="M30 150h140l-6 12H36z" fill="#2a2d33" /><rect x="40" y="140" width="120" height="12" rx="4" fill="#4b4f57" />
    <rect x="130" y="40" width="10" height="104" rx="5" fill="#33363d" /><rect x="120" y="36" width="44" height="26" rx="6" fill="#1a2430" /><rect x="126" y="42" width="32" height="14" rx="3" fill="#2f6fa8" />
    <rect x="24" y="112" width="8" height="34" rx="4" fill="#33363d" /><rect x="24" y="108" width="60" height="8" rx="4" fill="#33363d" />
  </>),
  'ill-sport-3': (<>
    {shadow(100, 176, 84)}
    <circle cx="52" cy="130" r="34" fill="none" stroke="#2a2d33" strokeWidth="7" /><circle cx="148" cy="130" r="34" fill="none" stroke="#2a2d33" strokeWidth="7" />
    <circle cx="52" cy="130" r="8" fill="#7a7f88" /><circle cx="148" cy="130" r="8" fill="#7a7f88" />
    <path d="M52 130l38-56h40l18 56M90 74l24 56M118 74l-10-16h18M60 74h30" fill="none" stroke="#2e6b4a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="98" y="112" width="26" height="8" rx="4" fill="#1a2430" />
  </>),
  'ill-sport-4': (<>
    {shadow(100, 174, 54)}
    <circle cx="100" cy="106" r="58" fill="#f2f2f0" />
    <path d="M100 66l22 16-8 26H86l-8-26z" fill="#1a2430" />
    <path d="M100 66V48M122 82l18-8M114 108l12 18M86 108l-12 18M78 82l-18-8" stroke="#1a2430" strokeWidth="4" strokeLinecap="round" />
    <path d="M60 74l18 0M140 74l-18 0" stroke="#1a2430" strokeWidth="4" strokeLinecap="round" opacity="0" />
    <circle cx="100" cy="106" r="58" fill="url(#none)" />
    {gloss(52, 52, 40, 30, 20, 0.6)}
  </>),
  'ill-baby-1': (<>
    {shadow(100, 176, 70)}
    <path d="M52 76h76l8 44H60z" fill="#2f6fa8" /><path d="M52 76q-8-30 18-46h58q10 10 10 46z" fill="#3f8fdc" />
    <path d="M136 120l30-52" stroke="#33363d" strokeWidth="6" strokeLinecap="round" /><rect x="160" y="60" width="18" height="8" rx="4" fill="#33363d" />
    <circle cx="70" cy="146" r="18" fill="#2a2d33" /><circle cx="70" cy="146" r="7" fill="#7a7f88" /><circle cx="134" cy="146" r="18" fill="#2a2d33" /><circle cx="134" cy="146" r="7" fill="#7a7f88" />
    {gloss(60, 36, 60, 12, 6, 0.2)}
  </>),
  'ill-baby-2': (<>
    {shadow(100, 176, 72)}
    <rect x="30" y="60" width="140" height="80" rx="6" fill="#e8d9bd" />
    {[46, 62, 78, 94, 110, 126, 142, 158].map((x) => <rect key={x} x={x - 3} y="66" width="6" height="68" rx="3" fill="#d9c7a8" />)}
    <rect x="30" y="56" width="140" height="8" rx="4" fill="#c9b48d" /><rect x="30" y="134" width="140" height="8" rx="4" fill="#c9b48d" />
    <rect x="36" y="142" width="8" height="24" fill="#c9b48d" /><rect x="156" y="142" width="8" height="24" fill="#c9b48d" />
    <rect x="44" y="112" width="112" height="14" rx="4" fill="#9fc8e8" />
  </>),
  'ill-baby-3': (<>
    {shadow(100, 174, 60)}
    <path d="M48 60q0-24 24-24h56q24 0 24 24v60q0 40-52 44-52-4-52-44z" fill="#5a5f68" />
    <path d="M60 64q0-16 16-16h48q16 0 16 16v52q0 30-40 34-40-4-40-34z" fill="#8b8f96" />
    <rect x="86" y="96" width="28" height="18" rx="6" fill="#e3be4a" />
    <path d="M100 48v48" stroke="#1a2430" strokeWidth="6" strokeLinecap="round" />
  </>),
  'ill-baby-4': (<>
    {shadow(100, 176, 70)}
    <rect x="34" y="96" width="60" height="60" rx="8" fill="#a63a2a" /><rect x="106" y="96" width="60" height="60" rx="8" fill="#2f6fa8" /><rect x="70" y="36" width="60" height="60" rx="8" fill="#e3be4a" />
    <text x="64" y="136" fontSize="30" fontWeight="800" fill="#fff" opacity=".85" textAnchor="middle" fontFamily="Inter, sans-serif">A</text>
    <text x="136" y="136" fontSize="30" fontWeight="800" fill="#fff" opacity=".85" textAnchor="middle" fontFamily="Inter, sans-serif">B</text>
    <text x="100" y="76" fontSize="30" fontWeight="800" fill="#1a2430" opacity=".85" textAnchor="middle" fontFamily="Inter, sans-serif">C</text>
  </>),
}

export const ILLUSTRATION_IDS = Object.keys(D) as IllustrationId[]

export function isIllustrationId(id: string): id is IllustrationId {
  return id in D
}

/** Deterministic id from a category key + index (or any string seed). */
export function illustrationFor(category: IllustrationCategory | string, seed: number | string = 0): IllustrationId {
  const cat = (ILLUSTRATION_CATEGORIES as readonly string[]).includes(category) ? (category as IllustrationCategory) : 'phone'
  const n = typeof seed === 'number' ? seed : Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0)
  const v = ((Math.abs(n) % 4) + 1) as 1 | 2 | 3 | 4
  return `ill-${cat}-${v}`
}

export interface IllustrationProps extends Omit<SVGAttributes<SVGSVGElement>, 'id'> {
  id: IllustrationId | string
  size?: number | string
  title?: string
}

/** «Studiya foto» uslubidagi to'ldirilgan mahsulot rasmi. Noma'lum id → quti. */
export function Illustration({ id, size = '100%', className, title, ...rest }: IllustrationProps) {
  const body = isIllustrationId(id) ? D[id] : (
    <>
      {shadow(100, 170, 60)}
      <rect x="40" y="60" width="120" height="90" rx="8" fill="#e8d9bd" />
      <rect x="40" y="60" width="120" height="16" rx="8" fill="#d9c7a8" />
    </>
  )
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={cn('block', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      {body}
    </svg>
  )
}

/* ─── ProductImage ───────────────────────────────────────────────────── */
export type Aspect = '1/1' | '4/3' | '3/4' | '16/9' | '3/2'
const ASPECT: Record<Aspect, string> = { '1/1': 'aspect-square', '4/3': 'aspect-[4/3]', '3/4': 'aspect-[3/4]', '16/9': 'aspect-video', '3/2': 'aspect-[3/2]' }

export interface ProductImageProps extends HTMLAttributes<HTMLDivElement> {
  id: IllustrationId | string
  aspect?: Aspect
  /** show SOTILDI stamp */
  sold?: boolean
  stampText?: string
  /** top-left badge slot */
  badge?: ReactNode
  /** top-right slot (e.g. save button) */
  corner?: ReactNode
  /** illustration scale inside the box (0–1), default .68 */
  fill?: number
  rounded?: boolean
  title?: string
}

/** Studiya foni: iliq oq, tepadan yorug'lik, kategoriya bo'yicha juda xira rang. */
const STUDIO_TINT: Record<string, string> = { phone: '#eef1f6', laptop: '#eef0f2', tv: '#eeeef6', appliance: '#edf3f3', furniture: '#f4efe6', clothing: '#f6eeee', sport: '#edf3ee', baby: '#eef2f6' }
function studioBackground(id: string): string {
  const cat = id.split('-')[1] ?? ''
  const tint = STUDIO_TINT[cat] ?? '#f0eee8'
  return `radial-gradient(120% 90% at 50% 0%, #fdfcf9 0%, ${tint} 100%)`
}

/** Foto-uslub mahsulot plitkasi: gradient fon, oq silueti, blik; badge va SOTILDI shtampi. */
export function ProductImage({ id, aspect = '1/1', sold = false, stampText, badge, corner, fill = 0.72, rounded = true, title, className, children, style, ...rest }: ProductImageProps) {
  return (
    <div
      className={cn('relative overflow-hidden text-ink', ASPECT[aspect], rounded && 'rounded-[14px]', className)}
      style={{ background: studioBackground(String(id)), ...style }}
      {...rest}
    >
      <div className="absolute inset-0 flex items-center justify-center" style={{ padding: `${(1 - fill) * 50}%` }}>
        <Illustration id={id} title={title} className={cn('h-full w-full', sold && 'opacity-40')} />
      </div>
      {badge && <div className="absolute left-2 top-2 flex flex-wrap gap-1">{badge}</div>}
      {corner && <div className="absolute right-2 top-2">{corner}</div>}
      {sold && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <Stamp text={stampText} size={aspect === '16/9' || aspect === '3/2' ? 'md' : 'lg'} />
        </div>
      )}
      {children}
    </div>
  )
}

/* ─── Wordmark / Logo ────────────────────────────────────────────────── */
export interface WordmarkProps extends HTMLAttributes<HTMLSpanElement> {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  /** hide the seal */
  textOnly?: boolean
  tone?: 'ink' | 'paper'
}
const WM = { sm: { font: 14, seal: 28 as const }, md: { font: 18, seal: 40 as const }, lg: { font: 26, seal: 56 as const } }

/** "SHARA-BARA" Bitter 800, letterspacing .06em, with a small Seal before it. */
export function Wordmark({ text = uz.app.wordmark, size = 'md', textOnly = false, tone = 'ink', className, ...rest }: WordmarkProps) {
  const s = WM[size]
  return (
    <span className={cn('inline-flex items-center gap-2', tone === 'paper' ? 'text-paper' : 'text-ink', className)} {...rest}>
      {!textOnly && <Logo size={s.seal} />}
      <span className="font-display leading-none" style={{ fontWeight: 800, letterSpacing: "-0.03em", fontSize: s.font * 1.15 }}>
        {text}
      </span>
    </span>
  )
}

/** Seal-only logo (ink disc, gold ring, stamp glyph). */
export function Logo({ size = 40, className }: { size?: 28 | 40 | 56 | 80 | 120; className?: string }) {
  return <Seal icon="stamp" variant="ink" size={size} ticks className={className} aria-label={uz.app.name} role="img" />
}
