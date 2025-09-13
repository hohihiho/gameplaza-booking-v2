import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1GetDeviceTypeById, d1UpdateDeviceType, d1DeleteDeviceType } from '@/lib/db/d1'

export const GET = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const item = await d1GetDeviceTypeById(id)
  if (!item) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ device_type: item })
}, { requireAdmin: true })

export const PUT = withAuth(async (req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const patch = await req.json()
  const updated = await d1UpdateDeviceType(id, patch)
  if (!updated) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ device_type: updated })
}, { requireAdmin: true })

export const DELETE = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const ok = await d1DeleteDeviceType(id)
  return new NextResponse(null, { status: ok ? 204 : 404 })
}, { requireAdmin: true })

