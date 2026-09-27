/** mulberry32 — tiny deterministic PRNG. Same seed ⇒ same sequence. */
export interface Rng {
  next(): number // [0, 1)
  int(a: number, b: number): number // inclusive both ends
  float(a: number, b: number): number
  pick<T>(arr: readonly T[]): T
  chance(p: number): boolean
  shuffle<T>(arr: readonly T[]): T[]
  /** deterministic sub-generator for an independent stream */
  fork(label: string): Rng
}

export function rng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const r: Rng = {
    next,
    int(lo, hi) {
      if (hi < lo) [lo, hi] = [hi, lo]
      return lo + Math.floor(next() * (hi - lo + 1))
    },
    float(lo, hi) {
      return lo + next() * (hi - lo)
    },
    pick(arr) {
      if (!arr.length) throw new Error("rng.pick: bo'sh massiv")
      return arr[Math.floor(next() * arr.length)]
    },
    chance(p) {
      return next() < p
    },
    shuffle(arr) {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    fork(label) {
      let h = 2166136261
      for (const ch of label) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
      return rng((h ^ Math.floor(next() * 0xffffffff)) >>> 0)
    },
  }
  return r
}
