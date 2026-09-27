import type { ManifestStatus } from '../types'
import { createMachine } from './machine'

export const manifestMachine = createMachine<ManifestStatus>('manifest', {
  open: ['closed'],
  closed: ['picked_up'],
  picked_up: [],
})

export const MANIFEST_STATUS_UZ: Record<ManifestStatus, string> = {
  open: 'Ochiq', closed: 'Yopildi', picked_up: 'BTS olib ketdi',
}
