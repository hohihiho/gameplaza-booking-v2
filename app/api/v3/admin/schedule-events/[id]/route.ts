import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1GetScheduleEventById, d1UpdateScheduleEvent, d1DeleteScheduleEvent } from '@/lib/db/d1'

export const GET = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const item = await d1GetScheduleEventById(id)
  if (!item) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ event: item })
}, { requireAdmin: true })

export const PUT = withAuth(async (req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const patch = await req.json()
  const updated = await d1UpdateScheduleEvent(id, patch)
  if (!updated) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ event: updated })
}, { requireAdmin: true })

export const DELETE = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const ok = await d1DeleteScheduleEvent(id)
  return new NextResponse(null, { status: ok ? 204 : 404 })
}, { requireAdmin: true })

