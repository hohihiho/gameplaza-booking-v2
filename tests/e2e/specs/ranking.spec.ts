import { test, expect } from '@playwright/test'

test.describe('Ranking Page', () => {
  test('loads and shows title', async ({ page }) => {
    await page.goto('/ranking')
    await expect(page.getByRole('heading', { name: '월간 대여 랭킹' })).toBeVisible()
  })

  test('shows empty state or list', async ({ page }) => {
    await page.goto('/ranking')
    const empty = page.getByText('랭킹 데이터가 없습니다.')
    const listItem = page.locator('ol > li').first()
    await expect(Promise.race([
      empty.waitFor({ state: 'visible' }),
      listItem.waitFor({ state: 'visible' })
    ])).resolves.toBeTruthy()
  })
})

