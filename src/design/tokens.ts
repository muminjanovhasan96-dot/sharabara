/** "Toza bozor" palette as JS constants (for Recharts & inline SVG). Keep in sync with src/index.css. */
export const CHART = {
  gold: '#C9930A',
  goldFill: '#F5B400',
  ink: '#0F1F3A',
  brick: '#E0443B',
  green: '#1E9E6A',
  blue: '#2F6FED',
  violet: '#7C5CFF',
  ink2: '#4A5568',
  ink3: '#616B7A',
  paper: '#F3F4F7',
  paper2: '#E8EBF1',
  card: '#FFFFFF',
  line: 'rgba(15,31,58,.09)',
  lineStrong: 'rgba(15,31,58,.2)',
} as const

export type ChartColor = keyof typeof CHART

/** Ordered categorical series palette (max 6 distinct series before repeating). */
export const CHART_SERIES: readonly string[] = [CHART.blue, CHART.ink, CHART.goldFill, CHART.green, CHART.brick, CHART.violet]

export const chartTheme = {
  /** Props for Recharts <XAxis tick={...} /> / <YAxis tick={...} /> */
  axisTick: { fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-body)' } as const,
  axisLine: { stroke: 'var(--line)' } as const,
  grid: { stroke: 'var(--line)', strokeDasharray: '2 4' } as const,
  /** Tailwind classes for a custom tooltip container */
  tooltipClass:
    'rounded-[10px] border border-line bg-card px-3 py-2 text-[12px] text-ink shadow-soft tnum',
  tooltipLabelClass: 'eyebrow mb-1',
  /** Recharts <Tooltip cursor={...} /> */
  cursor: { stroke: 'var(--gold)', strokeWidth: 1, strokeDasharray: '3 3' } as const,
  strokeWidth: 1.75,
  /** Recharts activeDot for line charts */
  activeDot: { r: 4, fill: 'var(--gold-fill)', stroke: 'var(--ink)', strokeWidth: 1.5 } as const,
  /** Fill for area charts (gold at low alpha) */
  areaFill: 'rgba(184,144,30,.16)',
} as const

/** Map a semantic tone to a CSS color variable — for inline styles. */
export const TONE_VAR = {
  default: 'var(--ink)',
  muted: 'var(--ink-3)',
  gold: 'var(--gold)',
  brick: 'var(--brick)',
  green: 'var(--green)',
  blue: 'var(--blue)',
} as const
export type Tone = keyof typeof TONE_VAR
