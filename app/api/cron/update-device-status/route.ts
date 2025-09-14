import { NextResponse } from 'next/server'
import { getD1, d1All, d1Run } from '@/lib/db/d1-utils'

function nowKST(): Date {
  const now = new Date()
  return new Date(now.getTime() + 9 * 60 * 60 * 1000)
}

function todayKST(): string { return nowKST().toISOString().slice(0, 10) }
function currentDisplayHour(): number { const h = nowKST().getHours(); return h <= 5 ? h + 24 : h }
function hourFrom(time: string): number { const h = parseInt(time.split(':')[0] || '0', 10); return h <= 5 ? h + 24 : h }

export async function GET() {
  const db = getD1()
  if (!db) return NextResponse.json({ ok: false, error: 'D1 not configured' }, { status: 500 })
  const date = todayKST()
  const cur = currentDisplayHour()
  let updatedRental = 0
  let updatedAvailable = 0

  try {
    const rows = await d1All(
      db,
      `SELECT r.device_id, r.start_time, r.end_time, r.status
         FROM reservations r
        WHERE r.date = ? AND r.status IN ('pending','approved','checked_in')`,
      date
    )
    const active = new Set<string>()
    for (const r of rows) {
      const sh = hourFrom(r.start_time)
      const eh = hourFrom(r.end_time)
      const endAdj = eh < sh ? eh + 24 : eh
      if (cur >= sh && cur < endAdj) active.add(r.device_id)
    }
    if (active.size > 0) {
      const placeholders = Array.from(active).map(() => '?').join(',')
      const res = await d1Run(db, `UPDATE devices SET status='rental', updated_at=CURRENT_TIMESTAMP WHERE id IN (${placeholders})`, ...Array.from(active))
      updatedRental = (active.size)
    }
    await d1Run(
      db,
      `UPDATE devices SET status='available', updated_at=CURRENT_TIMESTAMP
         WHERE (status='rental' OR status='in_use')
           AND id NOT IN (SELECT device_id FROM reservations WHERE date = ? AND status IN ('pending','approved','checked_in'))`,
      date
    )
    // We don't know exact count in this simple approach; admin UI will reflect latest.
    return NextResponse.json({ ok: true, updatedRental, updatedAvailable })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

