import { NextRequest, NextResponse } from 'next/server'
import { d1ListScheduleEvents } from '@/lib/db/d1'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const list = await d1ListScheduleEvents(date ? { date } : undefined)
  return NextResponse.json({ events: list })
}

