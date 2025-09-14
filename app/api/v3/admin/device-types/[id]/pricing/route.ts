import { NextRequest, NextResponse } from 'next/server'
import { getD1, d1All, d1Run } from '@/lib/db/d1-utils'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const rows = await d1All(
    db,
    `SELECT id, option_type, price, price_2p_extra, enable_extra_people, extra_per_person
       FROM device_pricing WHERE device_type_id = ? ORDER BY option_type ASC`,
    params.id
  )
  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const body = await req.json()
  const option_type = String(body?.option_type || '').trim() // 'fixed' | 'freeplay' | 'unlimited'
  const price = Number(body?.price ?? 0)
  if (!option_type) return NextResponse.json({ error: 'option_type required' }, { status: 400 })
  await d1Run(
    db,
    `INSERT INTO device_pricing (device_type_id, option_type, price, price_2p_extra, enable_extra_people, extra_per_person, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` ,
    params.id, option_type, price, body?.price_2p_extra ?? null, body?.enable_extra_people ? 1 : 0, body?.extra_per_person ?? null
  )
  return NextResponse.json({ ok: true })
}

