import { NextRequest, NextResponse } from 'next/server'
import { getD1, d1Run } from '@/lib/db/d1-utils'

export async function PUT(req: NextRequest, { params }: { params: { id: string, blockId: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const body = await req.json()
  const fields: string[] = []
  const binds: any[] = []
  const map: Record<string,string> = {
    slot_type: 'slot_type',
    start_time: 'start_time',
    end_time: 'end_time',
    enable_extra_people: 'enable_extra_people',
    extra_per_person: 'extra_per_person',
    is_youth_time: 'is_youth_time'
  }
  for (const k of Object.keys(map)) {
    if (body[k] !== undefined) {
      fields.push(`${map[k]} = ?`)
      const val = (k === 'enable_extra_people' || k === 'is_youth_time') ? (body[k] ? 1 : 0) : body[k]
      binds.push(val)
    }
  }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
  const sql = `UPDATE rental_time_blocks SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND device_type_id = ?`
  binds.push(params.blockId, params.id)
  await d1Run(db, sql, ...binds)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string, blockId: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  await d1Run(db, `DELETE FROM rental_time_blocks WHERE id = ? AND device_type_id = ?`, params.blockId, params.id)
  return NextResponse.json({ ok: true })
}

