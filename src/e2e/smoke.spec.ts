/**
 * Smoke: har marshrut konsol xatosisiz ochiladi va ko'rinadigan matn bor.
 */
import { test, expect } from '@playwright/test'

const ROUTES = ['/', '/m', '/admin', '/partner', '/bts', '/stage', '/hikoya', '/direktor', '/tel/admin', '/tel/direktor']

for (const route of ROUTES) {
  test(`${route} konsol xatosisiz ochiladi`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      if (/favicon|Failed to load resource/i.test(text)) return
      errors.push(text)
    })
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto(route)
    await expect(page.locator('#root')).not.toBeEmpty()
    await page.waitForTimeout(600)
    const text = (await page.locator('body').innerText()).trim()
    expect(text.length).toBeGreaterThan(0)
    expect(errors).toEqual([])
  })
}
