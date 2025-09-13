import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('home page loads and has title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/게임플라자|Gwangju Game Plaza/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('basic navigation works', async ({ page }) => {
    await page.goto('/')
    // Try clicking first visible nav link if exists
    const nav = page.locator('nav a').first()
    if (await nav.isVisible()) {
      const href = await nav.getAttribute('href')
      if (href) {
        await nav.click()
        await page.waitForLoadState('networkidle')
        await expect(page.url()).toContain(href)
      }
    }
  })
})

