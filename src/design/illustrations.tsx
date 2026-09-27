import type { HTMLAttributes, ReactNode, SVGAttributes } from 'react'
import { cn } from '@/lib/utils'
import { uz } from '@/i18n/uz'
import { Seal } from './Seal'
import { Stamp } from './Stamp'

/* ─── drawings: viewBox 0 0 200 200, currentColor strokes, ≤ ~15 elements each ─── */
export const ILLUSTRATION_CATEGORIES = ['phone', 'laptop', 'tv', 'appliance', 'furniture', 'clothing', 'sport', 'baby'] as const
export type IllustrationCategory = (typeof ILLUSTRATION_CATEGORIES)[number]
export type IllustrationId = `ill-${IllustrationCategory}-${1 | 2 | 3 | 4}`

const D: Record<IllustrationId, ReactNode> = {
  /* phone: front / back / with box / side */
  'ill-phone-1': (<>
    <rect x="60" y="30" width="80" height="140" rx="14" />
    <path d="M90 43h20" />
    <rect x="68" y="54" width="64" height="94" rx="3" strokeOpacity=".45" />
    <path d="M86 158h28" />
  </>),
  'ill-phone-2': (<>
    <rect x="60" y="30" width="80" height="140" rx="14" />
    <rect x="70" y="42" width="32" height="44" rx="9" />
    <circle cx="79" cy="53" r="4.5" /><circle cx="93" cy="53" r="4.5" /><circle cx="79" cy="75" r="4.5" />
    <circle cx="93" cy="75" r="2" />
    <circle cx="100" cy="128" r="6" strokeOpacity=".5" />
  </>),
  'ill-phone-3': (<>
    <rect x="28" y="108" width="92" height="62" rx="5" />
    <path d="M28 124h92" />
    <path d="M62 124v46M86 124v46" strokeOpacity=".4" />
    <rect x="122" y="52" width="48" height="104" rx="10" />
    <path d="M138 62h16" />
    <path d="M140 146h12" />
  </>),
  'ill-phone-4': (<>
    <rect x="92" y="30" width="16" height="140" rx="7" />
    <path d="M88 72v14M88 94v14" />
    <path d="M112 60v12" />
    <path d="M110 44q6 0 6 6v22q0 6-6 6" />
    <path d="M100 30v-4M100 174v-4" strokeOpacity=".4" />
  </>),
  /* laptop: open / closed / side / with mouse */
  'ill-laptop-1': (<>
    <rect x="42" y="42" width="116" height="80" rx="6" />
    <path d="M30 124L20 146h160l-10-22" />
    <path d="M20 146h160" />
    <path d="M85 135h30" />
    <circle cx="100" cy="49" r="1.5" />
  </>),
  'ill-laptop-2': (<>
    <path d="M30 98h140a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6v-6a6 6 0 0 1 6-6z" />
    <path d="M44 98l6-12h100l6 12" />
    <path d="M88 110h24" />
    <circle cx="100" cy="92" r="2" strokeOpacity=".5" />
  </>),
  'ill-laptop-3': (<>
    <path d="M28 130h144l-6-12H36z" />
    <path d="M40 118L58 42q1-4 5-4h4l-16 80" />
    <path d="M66 42l-12 62" strokeOpacity=".4" />
    <path d="M28 130q0 6 6 6h132q6 0 6-6" />
  </>),
  'ill-laptop-4': (<>
    <rect x="24" y="52" width="100" height="70" rx="5" />
    <path d="M18 134h112" />
    <path d="M30 124l-12 10M118 124l12 10" />
    <path d="M148 98a16 22 0 0 1 32 0v30a16 22 0 0 1-32 0z" />
    <path d="M164 98v14" />
    <path d="M148 112h32" strokeOpacity=".45" />
  </>),
  /* tv: flat / with legs / monitor / with remote */
  'ill-tv-1': (<>
    <rect x="24" y="44" width="152" height="92" rx="6" />
    <path d="M100 136v20M68 156h64" />
    <rect x="32" y="52" width="136" height="76" rx="2" strokeOpacity=".4" />
  </>),
  'ill-tv-2': (<>
    <rect x="24" y="44" width="152" height="92" rx="4" />
    <path d="M52 136l-12 22M148 136l12 22" />
    <path d="M48 116l30-32 22 22 26-30 26 40" />
    <circle cx="140" cy="66" r="6" />
  </>),
  'ill-tv-3': (<>
    <rect x="40" y="38" width="120" height="86" rx="6" />
    <path d="M100 124v26M72 160h56" />
    <path d="M100 150q-28 0-28 10h56q0-10-28-10" />
    <circle cx="100" cy="118" r="1.5" />
  </>),
  'ill-tv-4': (<>
    <rect x="22" y="52" width="108" height="76" rx="5" />
    <path d="M76 128v14M56 142h40" />
    <rect x="150" y="56" width="24" height="88" rx="9" />
    <circle cx="162" cy="70" r="3" />
    <path d="M156 88h12M156 100h12M156 112h12" />
    <path d="M162 124v8" strokeOpacity=".5" />
  </>),
  /* appliance: washer / fridge / kettle / vacuum */
  'ill-appliance-1': (<>
    <rect x="40" y="28" width="120" height="144" rx="8" />
    <path d="M40 56h120" />
    <circle cx="58" cy="42" r="5" />
    <path d="M80 42h50" />
    <circle cx="100" cy="116" r="36" />
    <circle cx="100" cy="116" r="26" />
    <path d="M82 124q18-14 36 0" strokeOpacity=".5" />
  </>),
  'ill-appliance-2': (<>
    <rect x="56" y="20" width="88" height="160" rx="8" />
    <path d="M56 84h88" />
    <path d="M70 52v18M70 104v34" />
    <path d="M62 180v8M138 180v8" />
    <path d="M100 30v42" strokeOpacity=".3" />
  </>),
  'ill-appliance-3': (<>
    <path d="M62 80h76l-8 84q-1 6-7 6H77q-6 0-7-6z" />
    <path d="M70 80q30-26 60 0" />
    <path d="M100 60v-6" />
    <path d="M138 96q34 22 0 56" />
    <path d="M62 100l-22-12 4-10" />
    <path d="M70 120h60" strokeOpacity=".35" />
    <circle cx="100" cy="66" r="4" />
  </>),
  'ill-appliance-4': (<>
    <ellipse cx="88" cy="136" rx="46" ry="28" />
    <path d="M112 118L156 34" />
    <path d="M150 34h22" />
    <path d="M60 164v6M116 164v6" />
    <circle cx="80" cy="132" r="10" />
    <path d="M132 134q18 8 20 28" />
    <path d="M46 150q-18 6-20 20" />
  </>),
  /* furniture: armchair / sofa / table / shelf */
  'ill-furniture-1': (<>
    <path d="M56 112V78q0-22 22-22h44q22 0 22 22v34" />
    <path d="M34 112q0-10 10-10h8q10 0 10 10v22H34z" />
    <path d="M138 112q0-10 10-10h8q10 0 10 10v22h-28z" />
    <path d="M62 134h76" />
    <path d="M56 112h88v22H56z" />
    <path d="M46 134v14M154 134v14" />
  </>),
  'ill-furniture-2': (<>
    <rect x="32" y="68" width="136" height="44" rx="10" />
    <path d="M20 112q0-8 8-8h144q8 0 8 8v32H20z" />
    <path d="M100 68v44" />
    <path d="M20 128h160" strokeOpacity=".4" />
    <path d="M38 144v14M162 144v14" />
  </>),
  'ill-furniture-3': (<>
    <rect x="24" y="78" width="152" height="14" rx="3" />
    <path d="M42 92v72M158 92v72" />
    <path d="M42 128h116" />
    <path d="M100 92v36" strokeOpacity=".4" />
  </>),
  'ill-furniture-4': (<>
    <rect x="50" y="24" width="100" height="152" rx="4" />
    <path d="M50 74h100M50 124h100" />
    <rect x="60" y="46" width="10" height="28" rx="1.5" /><rect x="72" y="52" width="9" height="22" rx="1.5" /><rect x="83" y="42" width="11" height="32" rx="1.5" />
    <rect x="110" y="98" width="12" height="26" rx="1.5" /><rect x="124" y="104" width="10" height="20" rx="1.5" />
    <path d="M62 160h20" strokeOpacity=".5" />
  </>),
  /* clothing: shirt / jacket / shoes / dress */
  'ill-clothing-1': (<>
    <path d="M70 40L34 64l16 26 16-8v80h68V82l16 8 16-26-36-24q-15 16-30 0z" />
    <path d="M70 40q15 16 30 16t30-16" strokeOpacity=".45" />
    <path d="M84 162h32" strokeOpacity=".35" />
  </>),
  'ill-clothing-2': (<>
    <path d="M66 42L32 64l16 28 14-6v76h76V86l14 6 16-28-34-22" />
    <path d="M66 42l18 20 16-24 16 24 18-20" />
    <path d="M100 62v100" />
    <path d="M62 128h14M124 128h14" strokeOpacity=".5" />
  </>),
  'ill-clothing-3': (<>
    <path d="M28 136q0-24 22-24h30l38-30q34 10 54 34v20H28z" />
    <path d="M28 136v10q0 6 6 6h132q6 0 6-6v-10" />
    <path d="M84 110l8-8M96 116l8-8M108 122l8-8" />
    <path d="M60 136h50" strokeOpacity=".35" />
    <path d="M118 82q10 10 30 14" strokeOpacity=".5" />
  </>),
  'ill-clothing-4': (<>
    <path d="M74 34h52l10 42-16 10 26 84H54l26-84-16-10z" />
    <path d="M74 34q26 20 52 0" strokeOpacity=".5" />
    <path d="M70 86h60" />
    <path d="M100 96v70" strokeOpacity=".3" />
  </>),
  /* sport: dumbbell / bike / ball / mat */
  'ill-sport-1': (<>
    <path d="M62 100h76" />
    <rect x="34" y="76" width="14" height="48" rx="4" /><rect x="48" y="66" width="14" height="68" rx="4" />
    <rect x="138" y="66" width="14" height="68" rx="4" /><rect x="152" y="76" width="14" height="48" rx="4" />
    <path d="M24 92v16M176 92v16" />
  </>),
  'ill-sport-2': (<>
    <circle cx="50" cy="130" r="30" /><circle cx="150" cy="130" r="30" />
    <path d="M50 130L84 74h48l18 56H100z" />
    <path d="M84 74L100 130" />
    <path d="M70 68h20" />
    <path d="M132 74l12-14h10" />
    <circle cx="100" cy="130" r="5" />
  </>),
  'ill-sport-3': (<>
    <circle cx="100" cy="100" r="60" />
    <path d="M40 100h120M100 40v120" />
    <path d="M60 58q22 42 0 84M140 58q-22 42 0 84" />
  </>),
  'ill-sport-4': (<>
    <path d="M52 108h110q18 0 18 18v6q0 18-18 18H52" />
    <circle cx="52" cy="129" r="21" />
    <circle cx="52" cy="129" r="11" />
    <path d="M52 118q11 0 11 11" strokeOpacity=".5" />
    <path d="M90 108v42M130 108v42" strokeOpacity=".3" />
  </>),
  /* baby: stroller / crib / toy / bottle */
  'ill-baby-1': (<>
    <path d="M52 100q0-46 46-46 46 0 46 46z" />
    <path d="M52 100h92v22q0 8-8 8H60q-8 0-8-8z" />
    <path d="M52 100L30 60H18" />
    <circle cx="66" cy="152" r="13" /><circle cx="130" cy="152" r="13" />
    <path d="M66 130v9M130 130v9" />
    <path d="M98 54v-10" strokeOpacity=".5" />
  </>),
  'ill-baby-2': (<>
    <rect x="34" y="64" width="132" height="76" rx="4" />
    <path d="M54 64v76M74 64v76M94 64v76M114 64v76M134 64v76M154 64v76" strokeOpacity=".5" />
    <path d="M34 100h132" />
    <path d="M40 140v26M160 140v26" />
  </>),
  'ill-baby-3': (<>
    <circle cx="100" cy="108" r="46" />
    <circle cx="64" cy="70" r="15" /><circle cx="136" cy="70" r="15" />
    <circle cx="84" cy="100" r="2.5" fill="currentColor" /><circle cx="116" cy="100" r="2.5" fill="currentColor" />
    <ellipse cx="100" cy="122" rx="14" ry="10" />
    <path d="M96 118h8l-4 5z" fill="currentColor" />
    <path d="M100 123v6M94 129q6 4 12 0" />
  </>),
  'ill-baby-4': (<>
    <rect x="70" y="72" width="60" height="98" rx="10" />
    <rect x="80" y="54" width="40" height="18" rx="3" />
    <path d="M90 54q0-22 10-22t10 22" />
    <path d="M70 100h12M70 120h12M70 140h12" />
    <path d="M118 90v60" strokeOpacity=".3" />
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

/** Linear product illustration in currentColor (ink). Unknown id → generic box. */
export function Illustration({ id, size = '100%', className, title, ...rest }: IllustrationProps) {
  const body = isIllustrationId(id) ? D[id] : (
    <>
      <rect x="40" y="60" width="120" height="90" rx="6" />
      <path d="M40 80h120M100 80v70" />
    </>
  )
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
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

/** Kategoriya bo'yicha "foto-uslub" fon: to'yingan gradient + yaltiroq blik (rasm o'rnida) */
const TILE_GRADIENT: Record<string, string> = {
  phone: 'linear-gradient(145deg, #1f2f55 0%, #0f1f3a 55%, #2a3f6d 100%)',
  laptop: 'linear-gradient(145deg, #4b5a72 0%, #2c3648 55%, #5c6b85 100%)',
  tv: 'linear-gradient(145deg, #3a3f8f 0%, #22265a 55%, #4a50a8 100%)',
  appliance: 'linear-gradient(145deg, #1f8a8a 0%, #12595c 55%, #2aa3a0 100%)',
  furniture: 'linear-gradient(145deg, #b47a3a 0%, #7d4f20 55%, #c99552 100%)',
  clothing: 'linear-gradient(145deg, #c2456b 0%, #7e2748 55%, #d4608a 100%)',
  sport: 'linear-gradient(145deg, #2f9e5f 0%, #1b6b3f 55%, #3fbd75 100%)',
  baby: 'linear-gradient(145deg, #3f8fdc 0%, #245c9a 55%, #5aa6ec 100%)',
}
function tileGradient(id: string): string {
  const cat = id.split('-')[1] ?? ''
  return TILE_GRADIENT[cat] ?? 'linear-gradient(145deg, #3d4a63 0%, #1f2a40 55%, #4c5a76 100%)'
}

/** Foto-uslub mahsulot plitkasi: gradient fon, oq silueti, blik; badge va SOTILDI shtampi. */
export function ProductImage({ id, aspect = '1/1', sold = false, stampText, badge, corner, fill = 0.62, rounded = true, title, className, children, style, ...rest }: ProductImageProps) {
  return (
    <div
      className={cn('relative overflow-hidden text-white', ASPECT[aspect], rounded && 'rounded-[14px]', className)}
      style={{ background: tileGradient(String(id)), ...style }}
      {...rest}
    >
      {/* blik */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 18% 10%, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 55%)' }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.22) 100%)' }} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center" style={{ padding: `${(1 - fill) * 50}%` }}>
        <Illustration id={id} title={title} className={cn('h-full w-full drop-shadow-[0_6px_14px_rgba(0,0,0,.35)] opacity-95', sold && 'opacity-40')} />
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
