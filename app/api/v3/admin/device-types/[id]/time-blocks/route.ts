import { NextRequest, NextResponse } from 'next/server'
import { getD1, d1All, d1Run } from '@/lib/db/d1-utils'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const rows = await d1All(
    db,
    `SELECT id, slot_type, start_time, end_time, enable_extra_people, extra_per_person, is_youth_time
       FROM rental_time_blocks WHERE device_type_id = ? ORDER BY start_time ASC`,
    params.id
  )
  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const body = await req.json()
  const slot_type = body?.slot_type
  const start_time = body?.start_time
  const end_time = body?.end_time
  if (!slot_type || !start_time || !end_time) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const enable_extra_people = body?.enable_extra_people ? 1 : 0
  const extra_per_person = body?.extra_per_person ?? null
  const is_youth_time = body?.is_youth_time ? 1 : 0
  await d1Run(
    db,
    `INSERT INTO rental_time_blocks (device_type_id, slot_type, start_time, end_time, enable_extra_people, extra_per_person, is_youth_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` ,
    params.id, slot_type, start_time, end_time, enable_extra_people, extra_per_person, is_youth_time
  )
  return NextResponse.json({ ok: true })
}

