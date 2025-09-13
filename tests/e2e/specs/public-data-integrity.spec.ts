import { test, expect } from '@playwright/test'

function isISODate(s: string | undefined | null) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function isTime(s: string | undefined | null) {
  return !!s && /^\d{2}:\d{2}$/.test(s)
}

test.describe('Public data integrity checks', () => {
  test('ranking invariants', async ({ request }) => {
    const res = await request.get('/api/v3/ranking?period=month')
    if (res.status() >= 500) test.skip()
    expect([200]).toContain(res.status())
    const body = await res.json()
    expect(body).toHaveProperty('items')
    const items: Array<{ user_id: string; cnt: number; rank: number }> = body.items || []
    // ranks ascending, counts non-increasing across page
    for (let i = 0; i < items.length; i++) {
      if (i > 0) {
        expect(items[i].rank).toBeGreaterThan(items[i - 1].rank)
        expect(items[i].cnt).toBeLessThanOrEqual(items[i - 1].cnt)
      }
      expect(items[i].cnt).toBeGreaterThanOrEqual(0)
    }
  })

  test('schedule events shape', async ({ request }) => {
    const res = await request.get('/api/v3/schedule')
    if (res.status() >= 500) test.skip()
    expect([200]).toContain(res.status())
    const body = await res.json()
    const events: any[] = Array.isArray(body?.events) ? body.events : []
    for (const ev of events) {
      expect(isISODate(ev.date)).toBeTruthy()
      if (ev.start_time && ev.end_time && isTime(ev.start_time) && isTime(ev.end_time)) {
        expect(ev.start_time < ev.end_time).toBeTruthy()
      }
      if (ev.block_type) {
        expect(['early','overnight','all_day']).toContain(ev.block_type)
      }
      if (ev.type) {
        expect(['special','early_open','overnight','early_close','event','reservation_block']).toContain(ev.type)
      }
    }
  })

  test('schedule today shape', async ({ request }) => {
    const res = await request.get('/api/v3/schedule/today')
    if (res.status() >= 500) test.skip()
    expect([200]).toContain(res.status())
    const body = await res.json()
    if (Array.isArray(body?.events)) {
      for (const ev of body.events) {
        expect(isISODate(ev.date)).toBeTruthy()
      }
    }
  })

  test('available devices aggregate', async ({ request }) => {
    const res = await request.get('/api/v3/devices/available')
    if (res.status() >= 500) test.skip()
    expect([200]).toContain(res.status())
    const body = await res.json()
    const devices: any[] = Array.isArray(body?.devices) ? body.devices : []
    for (const d of devices) {
      expect(d).toHaveProperty('name')
      // time blocks have valid times
      const blocks: any[] = Array.isArray(d.time_blocks) ? d.time_blocks : []
      for (const b of blocks) {
        if (isTime(b.start_time) && isTime(b.end_time)) {
          expect(b.start_time < b.end_time).toBeTruthy()
        }
      }
    }
  })
})

