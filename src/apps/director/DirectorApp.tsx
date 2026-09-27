/**
 * Sharabara — Direktor paneli (/direktor/*). Telefonda to'liq ekran, pastki tablar;
 * kompyuterda to'liq kenglik, yuqori tablar. Admin ichida `sections/Director.tsx` shu dashboardni chizadi.
 */
import { useCallback, useState } from 'react'
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { ThemeProvider } from '@/design'
import { useIsMobile } from '@/lib/hooks'
import { useAppNavigate, useStageNav } from '@/lib/router'
import { DirectorDashboard } from './DirectorDashboard'
import { isTab } from './lib/ctx'
import type { TabKey } from './strings'

export default function DirectorApp({ embedded = false }: { embedded?: boolean }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  return (
    <div ref={setEl} data-director-root className={embedded ? 'h-full min-h-0 w-full bg-paper text-ink' : 'h-dvh w-full bg-paper text-ink'}>
      {el && (
        <ThemeProvider scope={el} storageKey="sb-director-theme">
          <Routes>
            <Route path=":tab?" element={<Page />} />
            <Route path="*" element={<Navigate to="." replace />} />
          </Routes>
        </ThemeProvider>
      )}
    </div>
  )
}

function Page() {
  useStageNav()
  const { tab } = useParams()
  const nav = useAppNavigate()
  const [sp] = useSearchParams()
  const mobile = useIsMobile()
  const onGo = useCallback((t: TabKey, search: URLSearchParams) => {
    const q = search.toString()
    nav(`/${t === 'umumiy' ? '' : t}${q ? `?${q}` : ''}`)
  }, [nav])
  if (tab !== undefined && !isTab(tab)) return <Navigate to={`..${sp.toString() ? `?${sp}` : ''}`} replace />
  return <DirectorDashboard tab={isTab(tab) ? tab : 'umumiy'} onGo={onGo} mode={mobile ? 'mobile' : 'desktop'} linkMode="absolute" />
}
