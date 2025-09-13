// Node >=18 required (fetch available)
// Usage: with dev server running on NEXT_PUBLIC_APP_URL or http://localhost:3000

function env(name: string, fallback?: string) {
  return process.env[name] || fallback || ''
}

const base = env('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')

function isISODate(s?: string | null) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function isTime(s?: string | null) {
  return !!s && /^\d{2}:\d{2}$/.test(s)
}

async function checkRanking() {
  const url = `${base}/api/v3/ranking?period=month`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ranking HTTP ${res.status}`)
  const body: any = await res.json()
  const items: Array<{ user_id: string; cnt: number; rank: number }> = body.items || []
  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      if (!(items[i].rank > items[i - 1].rank)) throw new Error('ranking order invalid')
      if (!(items[i].cnt <= items[i - 1].cnt)) throw new Error('ranking counts not non-increasing')
    }
    if (items[i].cnt < 0) throw new Error('ranking negative count')
  }
  return { count: items.length }
}

async function checkSchedule() {
  const url = `${base}/api/v3/schedule`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`schedule HTTP ${res.status}`)
  const body: any = await res.json()
  const events: any[] = Array.isArray(body?.events) ? body.events : []
  for (const ev of events) {
    if (!isISODate(ev.date)) throw new Error('schedule date invalid')
    if (isTime(ev.start_time) && isTime(ev.end_time)) {
      if (!(ev.start_time < ev.end_time)) throw new Error('schedule time range invalid')
    }
  }
  return { count: events.length }
}

async function checkScheduleToday() {
  const url = `${base}/api/v3/schedule/today`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`schedule today HTTP ${res.status}`)
  const body: any = await res.json()
  const events: any[] = Array.isArray(body?.events) ? body.events : []
  for (const ev of events) {
    if (!isISODate(ev.date)) throw new Error('schedule today date invalid')
  }
  return { count: events.length }
}

async function checkAvailableDevices() {
  const url = `${base}/api/v3/devices/available`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`devices available HTTP ${res.status}`)
  const body: any = await res.json()
  const devices: any[] = Array.isArray(body?.devices) ? body.devices : []
  for (const d of devices) {
    if (!d?.name) throw new Error('device missing name')
    const blocks: any[] = Array.isArray(d.time_blocks) ? d.time_blocks : []
    for (const b of blocks) {
      if (isTime(b.start_time) && isTime(b.end_time)) {
        if (!(b.start_time < b.end_time)) throw new Error('device time block invalid')
      }
    }
  }
  return { count: devices.length }
}

async function main() {
  console.log(`Verifying public data against ${base}`)
  const results: Record<string, any> = {}
  const steps: Array<[string, () => Promise<any>]> = [
    ['ranking', checkRanking],
    ['schedule', checkSchedule],
    ['scheduleToday', checkScheduleToday],
    ['availableDevices', checkAvailableDevices],
  ]
  for (const [name, fn] of steps) {
    try {
      results[name] = await fn()
      console.log(`✔ ${name}`, results[name])
    } catch (e: any) {
      console.error(`✖ ${name} failed:`, e?.message || e)
      process.exitCode = 1
    }
  }
  if (process.exitCode === 0) {
    console.log('All public data invariants passed.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

