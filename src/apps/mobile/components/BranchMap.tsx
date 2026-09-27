import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import type { BtsBranch, Region } from '@/domain/types'
import { UzMapFallback } from './UzMapFallback'
import { ms } from '../strings'

const pin = (selected: boolean) => L.divIcon({
  className: '',
  iconSize: [28, 28], iconAnchor: [14, 14],
  html: `<span style="display:inline-flex;width:28px;height:28px;border-radius:9999px;background:${selected ? '#E3BE4A' : '#FBF8F0'};border:1.5px solid #1A2430;box-shadow:0 0 0 2px ${selected ? '#1A2430' : 'rgba(26,36,48,.15)'} inset,0 4px 10px -4px rgba(26,36,48,.5);align-items:center;justify-content:center"><span style="width:12px;height:12px;border-radius:9999px;border:1px solid ${selected ? '#1A2430' : '#B8901E'}"></span></span>`,
})
const me = L.divIcon({ className: '', iconSize: [18, 18], iconAnchor: [9, 9], html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#2F5F8F;border:3px solid #FBF8F0;box-shadow:0 0 0 6px rgba(47,95,143,.2)"></span>' })

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => { map.flyTo(center, zoom, { duration: 0.6 }) }, [center[0], center[1], zoom]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export interface BranchMapProps {
  regions: Region[]
  branches: BtsBranch[]
  selectedId: string | null
  onSelect: (id: string) => void
  center: [number, number]
  zoom: number
  user: { lat: number; lng: number } | null
  className?: string
}

/** Leaflet + OSM; on tile error → stylized SVG fallback. */
export function BranchMap({ regions, branches, selectedId, onSelect, center, zoom, user, className }: BranchMapProps) {
  const [fallback, setFallback] = useState(typeof navigator !== 'undefined' && navigator.onLine === false)
  const tileEvents = useMemo(() => ({ tileerror: () => setFallback(true) }), [])
  if (fallback) return <UzMapFallback regions={regions} branches={branches} selectedId={selectedId} user={user} onSelect={onSelect} className={className} caption={ms.checkout.mapOffline} />
  return (
    <div className={className}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full" attributionControl={false} zoomControl={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={tileEvents} />
        <Recenter center={center} zoom={zoom} />
        {branches.map((b) => <Marker key={b.id} position={[b.lat, b.lng]} icon={pin(b.id === selectedId)} eventHandlers={{ click: () => onSelect(b.id) }} />)}
        {user && <Marker position={[user.lat, user.lng]} icon={me} interactive={false} />}
      </MapContainer>
    </div>
  )
}
