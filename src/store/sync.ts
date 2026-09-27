import { useStore } from './index'

const CHANNEL = 'sharabara-sync'
let channel: BroadcastChannel | null = null
let applyingRemote = false

/** Cross-tab live sync: every local mutation is broadcast; remote ones are applied without re-broadcast. */
export function startSync() {
  if (typeof BroadcastChannel === 'undefined' || channel) return
  channel = new BroadcastChannel(CHANNEL)
  channel.onmessage = (ev: MessageEvent) => {
    const msg = ev.data as { type: 'state'; tabId: string; version: number; data: unknown; clock: unknown; ui: unknown }
    if (!msg || msg.type !== 'state') return
    const s = useStore.getState()
    if (msg.tabId === s.tabId) return
    if (msg.version <= s.version && msg.version !== 0) return
    applyingRemote = true
    try {
      s.applyRemote({ data: msg.data as never, clock: msg.clock as never, ui: msg.ui as never, version: msg.version })
    } finally { applyingRemote = false }
  }
  let timer: ReturnType<typeof setTimeout> | null = null
  useStore.subscribe((s) => s.version, () => {
    if (applyingRemote) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      const s = useStore.getState()
      channel?.postMessage({ type: 'state', tabId: s.tabId, version: s.version, data: s.data, clock: s.clock, ui: s.ui })
    }, 40)
  })
}
