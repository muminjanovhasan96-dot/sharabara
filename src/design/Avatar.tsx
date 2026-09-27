import { Seal } from './Seal'
import type { SealProps, SealSize } from './Seal'

export interface AvatarProps extends Omit<SealProps, 'variant' | 'icon' | 'Icon' | 'initials'> {
  /** full name → initials */
  name: string
  /** deterministic tone seed (id); defaults to name */
  seed?: string
  size?: SealSize
}

const FILLS = [
  'color-mix(in srgb, var(--gold-fill) 38%, var(--paper-2))',
  'color-mix(in srgb, var(--green) 18%, var(--paper-2))',
  'color-mix(in srgb, var(--blue) 18%, var(--paper-2))',
  'color-mix(in srgb, var(--brick) 16%, var(--paper-2))',
  'var(--paper-2)',
]

export function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return Math.abs(h >>> 0)
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return (parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')
}

/** Seal-based initials avatar; fill tone is deterministic by seed. */
export function Avatar({ name, seed, size = 40, ...rest }: AvatarProps) {
  const fill = FILLS[hashSeed(seed ?? name) % FILLS.length]
  return <Seal variant="avatar" initials={initialsOf(name)} fill={fill} size={size} aria-label={name} role="img" {...rest} />
}
