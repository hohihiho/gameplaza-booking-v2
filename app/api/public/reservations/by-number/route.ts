import { NextRequest, NextResponse } from 'next/server'
import { getD1, d1First } from '@/lib/db/d1-utils'

// Public lookup by reservation number or id (UUID)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const number = searchParams.get('number')?.trim()

  if (!number) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'number 파라미터가 필요합니다' }, { status: 400 })
  }

  const db = getD1()
  if (!db) return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'D1 not configured' }, { status: 500 })

  const isUuid = /^[0-9a-fA-F-]{36}$/.test(number)

  let row: any = null
  if (isUuid) {
    row = await d1First(db, `SELECT * FROM reservations WHERE id = ?`, number)
  } else {
    // Try by reservation_number column if exists
    try {
      row = await d1First(db, `SELECT * FROM reservations WHERE reservation_number = ?`, number)
    } catch {
      // Column may not exist in current schema
      row = null
    }
  }

  if (!row) {
    return NextResponse.json({ code: 'NOT_FOUND', message: '해당 예약번호를 찾을 수 없습니다' }, { status: 404 })
  }

  const startHour = parseInt(String(row.start_time).split(':')[0] || '0')
  const endHour = parseInt(String(row.end_time).split(':')[0] || '0')

  return NextResponse.json({
    data: {
      id: row.id,
      reservation_number: row.reservation_number ?? null,
      user_id: row.user_id,
      device_id: row.device_id,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      timeSlot: { startHour, endHour }
    }
  })
}
