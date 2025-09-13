import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListDeviceTypes, d1CreateDeviceType } from '@/lib/db/d1'

export const GET = withAuth(async (_req: NextRequest) => {
  const list = await d1ListDeviceTypes()
  return NextResponse.json({ device_types: list })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json()
  const created = await d1CreateDeviceType({
    name: String(body.name),
    is_rentable: Boolean(body.is_rentable),
    max_rentable_count: Number(body.max_rentable_count ?? 1),
    color_code: body.color_code ? String(body.color_code) : null,
  })
  return NextResponse.json({ device_type: created }, { status: 201 })
}, { requireAdmin: true })

