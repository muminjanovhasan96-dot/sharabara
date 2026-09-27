import type { BtsBranch, ISODate, RegionId, Staff, User } from '../domain/types'
import { addDays } from '../domain/clock'
import type { Rng } from './rng'
import { BRANCH_NAMES, FEMALE_NAMES, LAST_NAMES_F, LAST_NAMES_M, MALE_NAMES, REGIONS, STREETS } from './static'

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[\u02bc'\u2018\u2019]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function phoneMask(r: Rng): string {
  const prefixes = ['90', '91', '93', '94', '97', '98', '99', '33', '88']
  return `+998 ${r.pick(prefixes)} ••• •• ${String(r.int(10, 99))}`
}

export function makeBranches(r: Rng): BtsBranch[] {
  const out: BtsBranch[] = []
  for (const region of REGIONS) {
    const names = BRANCH_NAMES[region.id]
    for (const name of names) {
      const isTashkent = region.id === 'toshkent_sh'
      const id = isTashkent ? `br-${slugify(name)}` : `br-${region.id}-${slugify(name)}`
      const shortRegion = region.name.replace(' viloyati', '').replace(' shahri', '')
      out.push({
        id,
        regionId: region.id,
        name: isTashkent ? `BTS ${name} (namuna)` : `BTS ${shortRegion} ${name} (namuna)`,
        address: `${r.pick(STREETS)} ko'chasi, ${r.int(2, 180)}-uy`,
        lat: Math.round((region.lat + r.float(-0.03, 0.03)) * 10_000) / 10_000,
        lng: Math.round((region.lng + r.float(-0.03, 0.03)) * 10_000) / 10_000,
        hours: r.chance(0.8) ? '09:00–19:00' : '09:00–18:00',
        phoneMasked: phoneMask(r),
      })
    }
  }
  return out
}

export function makeUsers(r: Rng, now: ISODate): User[] {
  const regionIds = REGIONS.map((x) => x.id)
  const used = new Set<string>(['Aziz Karimov', 'Dilnoza Rashidova'])
  const users: User[] = []

  const base = (id: string, name: string, regionId: RegionId, i: number): User => ({
    id, name, regionId, phoneMasked: phoneMask(r), avatarSeed: i * 7 + 3,
    rating: Math.round(r.float(4.2, 5.0) * 10) / 10,
    soldCount: r.int(0, 60),
    joinedAt: addDays(now, -r.int(30, 1095)),
    verifiedSeller: r.chance(0.35),
    blocked: null,
    language: r.chance(0.85) ? 'uz' : 'ru',
    notificationsEnabled: r.chance(0.9),
    cashOnDelivery: r.chance(0.3),
  })

  users.push({ ...base('u-buyer', 'Aziz Karimov', 'namangan', 0), rating: 4.8, soldCount: 3, verifiedSeller: false, joinedAt: addDays(now, -410) })
  users.push({ ...base('u-seller', 'Dilnoza Rashidova', 'toshkent_sh', 1), rating: 4.9, soldCount: 312, verifiedSeller: true, joinedAt: addDays(now, -122) })

  let i = 2
  while (users.length < 40) {
    const female = r.chance(0.5)
    const first = female ? r.pick(FEMALE_NAMES) : r.pick(MALE_NAMES)
    const last = female ? r.pick(LAST_NAMES_F) : r.pick(LAST_NAMES_M)
    const name = `${first} ${last}`
    if (used.has(name)) continue
    used.add(name)
    // Toshkent is over-represented, like the real market
    const regionId = r.chance(0.35) ? 'toshkent_sh' : r.pick(regionIds)
    users.push(base(`u-${String(i).padStart(3, '0')}`, name, regionId, i))
    i += 1
  }
  // one blocked user for the admin screen
  const blocked = users[15]
  blocked.blocked = { at: addDays(now, -6), reason: "Soxta IMEI bilan e'lon joylagan", by: 's-mod' }
  return users
}

export function makeStaff(): Staff[] {
  return [
    { id: 's-super', name: 'Bekzod Alimov', role: 'super_admin', avatarSeed: 101 },
    { id: 's-dir', name: 'Jahongir Karimov', role: 'director', avatarSeed: 109 },
    { id: 's-mod', name: 'Kamola Nurmatova', role: 'moderator', avatarSeed: 102 },
    { id: 's-price', name: 'Otabek Rasulov', role: 'price_analyst', avatarSeed: 103 },
    { id: 's-log', name: 'Shahnoza Ergasheva', role: 'logistics', avatarSeed: 104 },
    { id: 's-fin', name: 'Rustam Xolmatov', role: 'finance', avatarSeed: 105 },
    { id: 's-op', name: 'Gulnora Tursunova', role: 'operator', avatarSeed: 106 },
    { id: 's-mod2', name: 'Javohir Mirzayev', role: 'moderator', avatarSeed: 107 },
    { id: 's-mod3', name: 'Sevara Qodirova', role: 'moderator', avatarSeed: 108 },
  ]
}
