import { NextRequest, NextResponse } from 'next/server'
import { getD1, d1All, d1Run } from '@/lib/db/d1-utils'

// List device types / Create device type
export async function GET() {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const rows = await d1All(
    db,
    `SELECT id, name, is_rentable, display_order, model_name, version_name, description, rental_settings
       FROM device_types ORDER BY display_order ASC, name ASC`
  )
  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const body = await req.json()
  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  const is_rentable = body?.is_rentable ? 1 : 0
  const display_order = Number(body?.display_order ?? 999)
  const model_name = body?.model_name ?? null
  const version_name = body?.version_name ?? null
  const description = body?.description ?? null
  const rental_settings = body?.rental_settings ? JSON.stringify(body.rental_settings) : null
  await d1Run(
    db,
    `INSERT INTO device_types (name, is_rentable, display_order, model_name, version_name, description, rental_settings, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` ,
    name, is_rentable, display_order, model_name, version_name, description, rental_settings
  )
  return NextResponse.json({ ok: true })
}

