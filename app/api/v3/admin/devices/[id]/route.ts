import { NextRequest, NextResponse } from 'next/server'
import { getD1, d1First, d1Run } from '@/lib/db/d1-utils'
import { publish } from '@/lib/realtime/publish'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const row = await d1First(db, `SELECT * FROM devices WHERE id = ?`, params.id)
  if (!row) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  return NextResponse.json({ data: row })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const body = await req.json()
  const fields: string[] = []
  const binds: any[] = []
  const allowed = ['device_type_id','device_number','status']
  for (const k of allowed) {
    if (body[k] !== undefined) { fields.push(`${k} = ?`); binds.push(body[k]) }
  }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
  const sql = `UPDATE devices SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  binds.push(params.id)
  await d1Run(db, sql, ...binds)
  // Publish status update if changed
  if (body.status) {
    await publish(`device:${params.id}`, 'device.status.updated', { id: params.id, status: body.status }, process.env.PUBLISH_SECRET)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  await d1Run(db, `DELETE FROM devices WHERE id = ?`, params.id)
  return NextResponse.json({ ok: true })
}
