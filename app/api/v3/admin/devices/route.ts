import { NextRequest, NextResponse } from 'next/server'
import { getD1, d1All, d1Run } from '@/lib/db/d1-utils'

// List devices / Create device
export async function GET(req: NextRequest) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const { searchParams } = new URL(req.url)
  const typeId = searchParams.get('typeId')
  const where = typeId ? 'WHERE d.device_type_id = ?' : ''
  const binds: any[] = []
  if (typeId) binds.push(typeId)
  const rows = await d1All(
    db,
    `SELECT d.id, d.device_type_id, d.device_number, d.status,
            t.name as type_name, t.model_name, t.version_name
       FROM devices d
       JOIN device_types t ON t.id = d.device_type_id
      ${where}
      ORDER BY t.display_order ASC, d.device_number ASC`,
    ...binds
  )
  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const body = await req.json()
  const device_type_id = body?.device_type_id
  const device_number = Number(body?.device_number)
  const status = String(body?.status || 'available')
  const id = crypto.randomUUID()
  if (!device_type_id || !device_number) return NextResponse.json({ error: 'device_type_id and device_number required' }, { status: 400 })
  await d1Run(
    db,
    `INSERT INTO devices (id, device_type_id, device_number, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` ,
    id, device_type_id, device_number, status
  )
  return NextResponse.json({ ok: true, id })
}

