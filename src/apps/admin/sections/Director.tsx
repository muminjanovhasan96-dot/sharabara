import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DirectorDashboard } from '@/apps/director/DirectorDashboard'
import { isTab } from '@/apps/director/lib/ctx'
import type { TabKey } from '@/apps/director/strings'
import { useContainer } from '../lib/context'

/** Direktor paneli admin ichida: tab `?tab=` orqali, havolalar admin bo'limlariga nisbiy. */
export function Director() {
  const root = useContainer()
  const [sp, setSp] = useSearchParams()
  const raw = sp.get('tab')
  const tab: TabKey = isTab(raw) ? raw : 'umumiy'
  const onGo = useCallback((t: TabKey, search: URLSearchParams) => {
    const n = new URLSearchParams(search)
    if (t === 'umumiy') n.delete('tab'); else n.set('tab', t)
    setSp(n)
  }, [setSp])
  return <DirectorDashboard tab={tab} onGo={onGo} mode="desktop" linkMode="admin" container={root} embedded />
}
