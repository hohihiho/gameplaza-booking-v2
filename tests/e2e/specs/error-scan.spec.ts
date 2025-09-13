import { test, expect } from '@playwright/test'

type ConsoleEntry = {
  type: string
  text: string
  url?: string
}

// Attach listeners that will turn console errors/warnings and page errors into test failures
async function attachErrorGuards(page: import('@playwright/test').Page, bucket: ConsoleEntry[]) {
  page.on('pageerror', (error) => {
    bucket.push({ type: 'pageerror', text: String(error?.stack || error?.message || error) })
  })

  page.on('console', (msg) => {
    const type = msg.type()
    if (type === 'error' || type === 'warning') {
      bucket.push({ type, text: msg.text(), url: msg.location().url })
    }
  })
}

// Collect internal links from a page (hrefs starting with "/" and not hashes/mailto)
async function collectInternalLinks(page: import('@playwright/test').Page) {
  const anchors = await page.$$eval('a[href]', (els) =>
    els
      .map((a) => (a as HTMLAnchorElement).getAttribute('href') || '')
      .filter(Boolean)
  )
  const internal = anchors
    .filter((h) => h.startsWith('/') && !h.startsWith('/#') && !h.startsWith('/mailto:'))
    .map((h) => h.split('#')[0]) // strip hash for crawl uniqueness
  return Array.from(new Set(internal))
}

// Basic health check for a route: load, wait idle, ensure body visible
async function checkRoute(page: import('@playwright/test').Page, path: string, errors: ConsoleEntry[]) {
  const res = await page.goto(path)
  // Allow 2xx-4xx (redirects will be handled by page.url())
  const status = res?.status() ?? 200
  expect(status).toBeGreaterThanOrEqual(200)
  expect(status).toBeLessThan(500)
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  await expect(page.locator('body')).toBeVisible()

  if (errors.length) {
    const details = errors.map((e) => `${e.type}: ${e.text} ${e.url ?? ''}`).join('\n')
    test.fail(true, `Console/Page errors detected on ${path}:\n${details}`)
  }
}

test.describe('Error Scan (crawl and catch console/page errors)', () => {
  test('crawl internal pages and fail on errors', async ({ page, baseURL }, testInfo) => {
    if (!baseURL) throw new Error('baseURL is required')

    const maxPages = Number(process.env.ERROR_SCAN_MAX_PAGES || 30)
    const startPath = process.env.ERROR_SCAN_START || '/'

    const visited = new Set<string>()
    const queue: string[] = [startPath]
    const errors: ConsoleEntry[] = []

    await attachErrorGuards(page, errors)

    while (queue.length && visited.size < maxPages) {
      const path = queue.shift()!
      if (visited.has(path)) continue
      visited.add(path)

      // Reset errors per-page while keeping a running log for report
      const pageErrors: ConsoleEntry[] = []
      const offConsole = (msg: any) => {
        const type = msg.type()
        if (type === 'error' || type === 'warning') pageErrors.push({ type, text: msg.text(), url: msg.location().url })
      }
      const offPageError = (err: any) => pageErrors.push({ type: 'pageerror', text: String(err?.stack || err) })
      page.on('console', offConsole)
      page.on('pageerror', offPageError)

      await checkRoute(page, path, pageErrors)

      // Save artifacts if this page had errors
      if (pageErrors.length) {
        errors.push(...pageErrors)
        await testInfo.attach(`errors-${path.replace(/\W+/g, '_')}.txt`, {
          body: pageErrors.map((e) => `${e.type}: ${e.text} ${e.url ?? ''}`).join('\n'),
          contentType: 'text/plain',
        })
        await page.screenshot({ path: testInfo.outputPath(`error-${path.replace(/\W+/g, '_')}.png`), fullPage: true })
      }

      // Collect next links from current DOM
      const links = await collectInternalLinks(page)
      for (const href of links) if (!visited.has(href) && !queue.includes(href)) queue.push(href)

      // Detach per-page listeners
      page.off('console', offConsole)
      page.off('pageerror', offPageError)
    }

    if (errors.length) {
      const summary = errors.map((e) => `${e.type}: ${e.text} ${e.url ?? ''}`).join('\n')
      throw new Error(`Error scan found issues on ${visited.size} pages:\n${summary}`)
    }
  })
})

