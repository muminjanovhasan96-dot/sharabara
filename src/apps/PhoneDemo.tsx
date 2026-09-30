/**
 * «Telefon» havolalari (/tel/admin, /tel/direktor) uchun qobiq:
 *  - haqiqiy telefonda — to'liq ekran (bare), safe-area bilan;
 *  - kompyuterda — ekran balandligiga sig'adigan telefon ramkasi + shu sahifani telefonda ochish uchun QR.
 * Ichidagi ilova o'z konteyner kengligini (390px) ko'rib, o'zi telefon rejimiga o'tadi.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import QRCode from 'qrcode'
import { Smartphone } from 'lucide-react'
import { PhoneFrame } from '@/design'
import { useIsMobile } from '@/lib/hooks'
import { useStore } from '@/store'

const HINT = 'Telefon ko’rinishi. Haqiqiy qurilmada to’liq ekranda ochiladi.'
const SCAN = 'Telefoningizda ochish uchun kamera bilan skanerlang'

function fitScale() {
  if (typeof window === 'undefined') return 1
  return Math.min(1, (window.innerHeight - 96) / 880, (window.innerWidth - 32) / 420)
}

export function useQrSvg(url: string, size = 96): string {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    if (!url) return
    let on = true
    QRCode.toString(url, { type: 'svg', margin: 1, width: size, color: { dark: '#10203a', light: '#0000' } }).then((s) => { if (on) setSvg(s) }).catch(() => {})
    return () => { on = false }
  }, [url, size])
  return svg
}

export function PhoneDemo({ children }: { children: ReactNode }) {
  const mobile = useIsMobile()
  if (mobile) {
    return (
      <div className="h-dvh w-full">
        <PhoneFrame variant="bare"><div className="h-full">{children}</div></PhoneFrame>
      </div>
    )
  }
  return <DesktopFrame>{children}</DesktopFrame>
}

function DesktopFrame({ children }: { children: ReactNode }) {
  const now = useStore((s) => s.clock.now)
  const time = useMemo(() => { const d = new Date(now); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` }, [now])
  const [scale, setScale] = useState(() => fitScale())
  useEffect(() => {
    const fn = () => setScale(fitScale())
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const qr = useQrSvg(url, 88)
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 overflow-hidden bg-paper-2 px-4 py-4">
      <PhoneFrame time={time} scale={scale}>
        <div className="h-full">{children}</div>
      </PhoneFrame>
      <div className="flex items-center gap-3 rounded-[14px] border border-line bg-card px-3 py-2 shadow-soft">
        {qr ? <span className="h-[72px] w-[72px] shrink-0 rounded-[8px] bg-white p-1 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} aria-hidden="true" /> : <Smartphone size={22} className="text-ink-3" aria-hidden="true" />}
        <span className="max-w-[30ch] text-[12.5px] leading-snug text-ink-2"><span className="block font-semibold text-ink">{SCAN}</span>{HINT}</span>
      </div>
    </div>
  )
}
