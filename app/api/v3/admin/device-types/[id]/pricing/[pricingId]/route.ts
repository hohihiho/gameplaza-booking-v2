import { NextRequest, NextResponse } from 'next/server'
import { getD1, d1Run } from '@/lib/db/d1-utils'

export async function PUT(req: NextRequest, { params }: { params: { id: string, pricingId: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  const body = await req.json()
  const fields: string[] = []
  const binds: any[] = []
  const allowed = ['option_type','price','price_2p_extra','enable_extra_people','extra_per_person']
  for (const k of allowed) {
    if (body[k] !== undefined) {
      fields.push(`${k} = ?`)
      if (k === 'enable_extra_people') binds.push(body[k] ? 1 : 0)
      else binds.push(body[k])
    }
  }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
  const sql = `UPDATE device_pricing SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND device_type_id = ?`
  binds.push(params.pricingId, params.id)
  await d1Run(db, sql, ...binds)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string, pricingId: string } }) {
  const db = getD1()
  if (!db) return NextResponse.json({ error: 'D1 not configured' }, { status: 500 })
  await d1Run(db, `DELETE FROM device_pricing WHERE id = ? AND device_type_id = ?`, params.pricingId, params.id)
  return NextResponse.json({ ok: true })
}

