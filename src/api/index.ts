import { listings } from './listings'
import { orders } from './orders'
import { logistics } from './logistics'
import { finance } from './finance'
import { admin } from './admin'
import { partner } from './partner'
import { demo } from './demo'
import { warehouse } from './warehouse'

export { bus, ApiError, setFastMode, delay, currentActor } from './core'
export type { BusEvents } from './core'
export type { NewListingInput } from './listings'
export type { ImportRow } from './partner'
export { DELIVERY_FEE } from './orders'

export const api = { listings, orders, logistics, finance, admin, partner, demo, warehouse }
export type Api = typeof api
