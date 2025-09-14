import { NextRequest, NextResponse } from 'next/server'
import { getD1, d1All } from '@/lib/db/d1-utils'

function nowKST(): Date { const now = new Date(); return new Date(now.getTime() + 9*60*60*1000) }
function todayKST(): string { return nowKST().toISOString().slice(0,10) }
function currentDisplayHour(): number { const h = nowKST().getHours(); return h <= 5 ? h + 24 : h }
function hourFrom(time: string): number { const h = parseInt(time.split(':')[0] || '0', 10); return h <= 5 ? h + 24 : h }

export async function GET(_req: NextRequest) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const date = todayKST()
  const cur = currentDisplayHour()

  // load today's active reservations and all devices
  const [resRows, devRows] = await Promise.all([
    d1All(db, `SELECT device_id, start_time, end_time, status FROM reservations WHERE date = ? AND status IN ('pending','approved','checked_in')`, date),
    d1All(db, `SELECT id, status FROM devices`)
  ])

  const computed: Record<string,string> = {}
  for (const r of resRows) {
    const sh = hourFrom(r.start_time)
    const eh = hourFrom(r.end_time)
    const endAdj = eh < sh ? eh + 24 : eh
    if (cur >= sh && cur < endAdj) computed[r.device_id] = 'rental'
  }

  const out = devRows.map((d: any) => {
    // maintenance/disabled take precedence
    if (d.status === 'maintenance' || d.status === 'disabled') return { id: d.id, status: d.status }
    return { id: d.id, status: computed[d.id] || 'available' }
  })

  return NextResponse.json({ data: out })
}

