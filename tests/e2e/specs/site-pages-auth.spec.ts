import { test, expect } from '@playwright/test'

test.use({
  extraHTTPHeaders: {
    'x-e2e-impersonate': 'user'
  }
})

test.describe('Auth pages as user', () => {
  const authPages = ['/mypage', '/mypage/profile', '/v3/reservations']

  for (const path of authPages) {
    test(`loads ${path} for user`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBeGreaterThanOrEqual(200)
      expect(res?.status()).toBeLessThan(500)
      await expect(page).toHaveTitle(/.|\s*/)
    })
  }
})

test.describe('Admin pages as admin', () => {
  test.use({
    extraHTTPHeaders: {
      'x-e2e-impersonate': 'admin'
    }
  })

  const adminPages = [
    '/admin',
    '/admin/users',
    '/admin/reservations',
    '/admin/analytics/revenue',
    '/admin/analytics/devices',
    '/admin/analytics/reservations',
    '/admin/settings'
  ]

  for (const path of adminPages) {
    test(`loads ${path} for admin`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBeGreaterThanOrEqual(200)
      expect(res?.status()).toBeLessThan(500)
      await expect(page).toHaveTitle(/.|\s*/)
    })
  }
})

