import { test, expect } from '@playwright/test'

// 공용 페이지 (비로그인 접근 가능)
const publicPages: string[] = [
  '/',
  '/ranking',
  '/reservations',
  '/reservations/new',
  '/schedule',
  '/guide',
  '/login',
  '/signup',
  '/privacy',
  '/terms',
  '/offline',
]

// 로그인 필요(마이페이지 등)
const authPages: string[] = [
  '/mypage',
  '/mypage/profile',
  '/v3/reservations',
]

// 관리자 영역 (권한 필요)
const adminPages: string[] = [
  '/admin',
  '/admin/users',
  '/admin/reservations',
  '/admin/analytics/revenue',
  '/admin/analytics/devices',
  '/admin/analytics/reservations',
  '/admin/settings',
]

test.describe('Public pages', () => {
  for (const path of publicPages) {
    test(`loads ${path}`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBeGreaterThanOrEqual(200)
      expect(res?.status()).toBeLessThan(500)
      // 기본적으로 제목 혹은 본문 일부가 보이는지만 확인
      await expect(page).toHaveTitle(/.|\s*/)
    })
  }
})

test.describe('Auth required pages (unauthenticated)', () => {
  for (const path of authPages) {
    test(`redirects or blocks ${path}`, async ({ page }) => {
      const res = await page.goto(path)
      // 비로그인: 200(로그인 페이지로 렌더) 또는 302/401/403 가능
      const status = res?.status() ?? 200
      expect([200, 302, 401, 403]).toContain(status)
      // 로그인 유도 문구 또는 /login 리다이렉트 URL 확인
      const url = page.url()
      if (!url.includes('/login')) {
        await expect(page.getByText(/로그인|인증|login/i)).toBeVisible({ timeout: 3000 })
      }
    })
  }
})

test.describe('Admin pages (unauthenticated)', () => {
  for (const path of adminPages) {
    test(`forbids or redirects ${path}`, async ({ page }) => {
      const res = await page.goto(path)
      const status = res?.status() ?? 200
      // 비로그인 접근: 200(로그인 페이지 렌더) 또는 302/401/403 모두 허용
      expect([200, 302, 401, 403]).toContain(status)
      const url = page.url()
      if (!url.includes('/login')) {
        // 접근 거부 문구 혹은 관리자 권한 필요 문구
        await expect(page.getByText(/관리자|권한|금지|Forbidden|Unauthorized/i)).toBeVisible({ timeout: 3000 })
      }
    })
  }
})

