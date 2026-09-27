/** Generic finite-state helper shared by all status machines. */

export class TransitionError extends Error {
  readonly machine: string
  readonly from: string
  readonly to: string
  constructor(machine: string, from: string, to: string) {
    super(`Noto'g'ri o'tish: ${from} → ${to} (${machine})`)
    this.name = 'TransitionError'
    this.machine = machine
    this.from = from
    this.to = to
  }
}

export interface Machine<S extends string> {
  name: string
  states: S[]
  can(from: S, to: S): boolean
  assert(from: S, to: S): void
  next(from: S): S[]
  /** true when no transition leaves the state */
  isTerminal(state: S): boolean
}

export function createMachine<S extends string>(name: string, transitions: Record<S, S[]>): Machine<S> {
  const states = Object.keys(transitions) as S[]
  const can = (from: S, to: S) => (transitions[from] ?? []).includes(to)
  return {
    name,
    states,
    can,
    assert(from, to) {
      if (!can(from, to)) throw new TransitionError(name, from, to)
    },
    next(from) {
      return [...(transitions[from] ?? [])]
    },
    isTerminal(state) {
      return (transitions[state] ?? []).length === 0
    },
  }
}
