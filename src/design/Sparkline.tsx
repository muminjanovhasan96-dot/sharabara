import type { SVGAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SparklineProps extends Omit<SVGAttributes<SVGSVGElement>, 'values' | 'width' | 'height'> {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  /** soft fill under the line */
  area?: boolean
  /** dot on the last point */
  endDot?: boolean
  strokeWidth?: number
}

export function sparklinePoints(values: number[], width: number, height: number, pad = 2): [number, number][] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0
  return values.map((v, i) => [pad + i * stepX, height - pad - ((v - min) / span) * (height - pad * 2)])
}

/** Inline SVG polyline/area, gold stroke by default. */
export function Sparkline({
  values, width = 96, height = 28, stroke = 'var(--gold)', area = false, endDot = true, strokeWidth = 1.75, className, ...rest
}: SparklineProps) {
  const pts = sparklinePoints(values, width, height)
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  const areaPath =
    pts.length > 1 && last
      ? `M${pts[0][0]},${height} L${line.split(' ').map((p) => p).join(' L')} L${last[0]},${height} Z`
      : ''
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block overflow-visible', className)}
      aria-hidden="true"
      {...rest}
    >
      {area && areaPath && <path d={areaPath} fill={stroke} fillOpacity={0.14} stroke="none" />}
      {pts.length > 1 && (
        <polyline points={line} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {endDot && last && <circle cx={last[0]} cy={last[1]} r={2.25} fill={stroke} />}
    </svg>
  )
}
