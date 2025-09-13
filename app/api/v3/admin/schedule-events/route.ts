import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListScheduleEvents, d1CreateScheduleEvent } from '@/lib/db/d1'

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || undefined
  const list = await d1ListScheduleEvents(date ? { date } : undefined)
  return NextResponse.json({ events: list })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json()
  const created = await d1CreateScheduleEvent(body)
  return NextResponse.json({ event: created }, { status: 201 })
}, { requireAdmin: true })

