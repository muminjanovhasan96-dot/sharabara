/**
 * Oltin yo'l — /stage?fast=1 da avtopilot boshidan oxirigacha, so'ng localStorage'dagi natija tekshiriladi.
 */
import { test, expect } from '@playwright/test'

const STORE_KEY = 'sharabara-demo-v1'
const LISTING = 'L-58213'

interface Persisted {
  state: {
    data: {
      listings: { id: string; status: string; priceTiyin: number }[]
      orders: { id: string; totalTiyin: number; subOrders: { id: string; status: string }[] }[]
      payouts: { amountTiyin: number; status: string }[]
      audit: { entityId: string; field: string; to: string | number | null }[]
    }
  }
}

test('Oltin yo’l avtopilot oxirigacha boradi va raqamlar qulflangan', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/stage?fast=1')
  await expect(page.getByTestId('stage-phone')).toBeVisible()
  await expect(page.getByTestId('stage-desktop')).toBeVisible()

  await page.getByTestId('stage-golden').click()
  // if the golden listing was already used, a confirm dialog offers a reset first
  const confirm = page.getByRole('button', { name: 'Qaytarib boshlash' })
  if (await confirm.isVisible({ timeout: 1000 }).catch(() => false)) await confirm.click()

  await expect(page.getByTestId('stage-caption')).toBeVisible()
  await expect(page.getByTestId('stage-golden-done')).toBeVisible({ timeout: 90_000 })

  const persisted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null') as Persisted | null, STORE_KEY)
  expect(persisted).not.toBeNull()
  const d = persisted!.state.data

  const listing = d.listings.find((l) => l.id === LISTING)
  expect(listing?.status).toBe('sold')
  expect(listing?.priceTiyin).toBe(620_000_000)

  const order = d.orders.find((o) => o.totalTiyin === 623_500_000)
  expect(order, 'order with total 6 235 000 exists').toBeTruthy()
  expect(order!.subOrders[0].status).toBe('payout_paid')

  const payout = d.payouts.find((p) => p.amountTiyin === 601_400_000)
  expect(payout?.status).toBe('paid')

  const trail = d.audit.filter((a) => a.entityId === LISTING)
  expect(trail.length).toBeGreaterThan(0)
  const statuses = trail.filter((a) => a.field === 'status').map((a) => a.to)
  for (const s of ['submitted', 'in_review', 'offer_sent', 'published', 'reserved', 'sold']) expect(statuses).toContain(s)

  await page.getByTestId('stage-golden-done').getByRole('button', { name: /sinab/ }).click()
  await expect(page.getByTestId('stage-golden-done')).toHaveCount(0)
  expect(errors).toEqual([])
})
