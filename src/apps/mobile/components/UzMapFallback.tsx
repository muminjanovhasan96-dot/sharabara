import { cn } from '@/lib/utils'
import type { BtsBranch, Region } from '@/domain/types'

/** lon/lat → 0..100 viewBox (Uzbekistan bbox: lng 55.9–73.2, lat 37.1–45.6) */
function project(lng: number, lat: number): [number, number] {
  const x = ((lng - 55.9) / (73.2 - 55.9)) * 100
  const y = (1 - (lat - 37.1) / (45.6 - 37.1)) * 100
  return [x, y]
}

/** Simplified Uzbekistan outline (approximate polygon, lng/lat pairs). */
const OUTLINE: [number, number][] = [
  [55.99, 41.3], [56.0, 45.0], [58.5, 45.6], [61.0, 44.4], [62.0, 43.5], [64.9, 43.7], [66.1, 42.9], [67.9, 42.9],
  [68.6, 42.3], [70.9, 42.2], [71.3, 42.7], [73.2, 40.9], [71.7, 39.6], [70.4, 39.4], [68.1, 40.2], [67.4, 39.1],
  [67.7, 37.2], [66.5, 37.4], [65.6, 38.2], [64.1, 38.9], [62.2, 39.2], [61.2, 41.2], [60.0, 41.4], [58.4, 42.6], [57.0, 41.3],
]

export interface UzMapFallbackProps {
  regions: Region[]
  branches: BtsBranch[]
  selectedId?: string | null
  user?: { lat: number; lng: number } | null
  onSelect?: (id: string) => void
  className?: string
  caption?: string
}

/** Stylized SVG map used when OSM tiles fail (offline). */
export function UzMapFallback({ regions, branches, selectedId, user, onSelect, className, caption }: UzMapFallbackProps) {
  const d = OUTLINE.map(([lng, lat], i) => { const [x, y] = project(lng, lat); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}` }).join(' ') + ' Z'
  return (
    <div className={cn('hatch relative overflow-hidden rounded-card border border-line', className)}>
      <svg viewBox="0 0 100 60" className="block h-full w-full" role="img" aria-label="O’zbekiston xaritasi">
        <g transform="scale(1 0.6)">
          <path d={d} fill="var(--card)" stroke="var(--ink)" strokeWidth="0.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {regions.map((r) => { const [x, y] = project(r.lng, r.lat); return (
            <g key={r.id}>
              <circle cx={x} cy={y} r="0.9" fill="var(--ink-3)" />
              <text x={x + 1.4} y={y - 1} fontSize="2.6" fill="var(--ink-2)" fontFamily="var(--font-body)" transform={`translate(0 ${y}) scale(1 1.6667) translate(0 ${-y})`}>{r.name.replace(' shahri', '').replace(' viloyati', ' vil.')}</text>
            </g>
          ) })}
          {branches.map((b) => { const [x, y] = project(b.lng, b.lat); const sel = b.id === selectedId; return (
            <circle key={b.id} cx={x} cy={y} r={sel ? 1.8 : 1.1} fill={sel ? 'var(--gold-fill)' : 'var(--brick)'} stroke={sel ? 'var(--ink)' : 'none'} strokeWidth="0.4" className="cursor-pointer" onClick={() => onSelect?.(b.id)} />
          ) })}
          {user && (() => { const [x, y] = project(user.lng, user.lat); return <><circle cx={x} cy={y} r="2.6" fill="var(--blue)" fillOpacity=".2" /><circle cx={x} cy={y} r="1.1" fill="var(--blue)" stroke="var(--card)" strokeWidth="0.4" /></> })()}
        </g>
      </svg>
      {caption && <div className="absolute bottom-1.5 left-2 rounded-full bg-card/90 px-2 py-0.5 text-[10.5px] text-ink-3">{caption}</div>}
    </div>
  )
}
