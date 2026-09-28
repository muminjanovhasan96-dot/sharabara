import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Landing } from '@/apps/Landing'
import { AppBase } from '@/lib/router'
// Mobil ilova eng muhim marshrut (va /stage ichida ham) — lazy emas, entry bilan birga preload bo'ladi
import MobileApp from '@/apps/mobile/MobileApp'

const AdminApp = lazy(() => import('@/apps/admin/AdminApp'))
const PartnerApp = lazy(() => import('@/apps/partner/PartnerApp'))
const BtsApp = lazy(() => import('@/apps/bts/BtsApp'))
const StageApp = lazy(() => import('@/apps/stage/StageApp'))
const DesignLab = lazy(() => import('@/apps/design-lab/DesignLab'))
const DirectorApp = lazy(() => import('@/apps/director/DirectorApp'))
const StoryApp = lazy(() => import('@/apps/story/StoryApp'))

function Fallback() {
  return (
    <div className="min-h-dvh grid place-items-center bg-paper text-ink-2" aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <div className="skeleton h-12 w-12 rounded-full" />
        <span className="text-sm">Yuklanmoqda…</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/m/*" element={<AppBase base="/m" app="mobile"><MobileApp /></AppBase>} />
        <Route path="/admin/*" element={<AppBase base="/admin" app="admin"><AdminApp /></AppBase>} />
        <Route path="/partner/*" element={<AppBase base="/partner" app="partner"><PartnerApp /></AppBase>} />
        <Route path="/bts/*" element={<AppBase base="/bts" app="bts"><BtsApp /></AppBase>} />
        <Route path="/direktor/*" element={<AppBase base="/direktor" app="director"><DirectorApp /></AppBase>} />
        <Route path="/stage" element={<StageApp />} />
        <Route path="/hikoya" element={<StoryApp />} />
        <Route path="/dizayn" element={<DesignLab />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
