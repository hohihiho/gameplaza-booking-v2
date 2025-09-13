import { NextResponse } from 'next/server'
import { d1ListScheduleEvents } from '@/lib/db/d1'

function todayKST(): string {
  const now = new Date()
  // Approximate KST (UTC+9): add 9 hours to UTC
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

export async function GET() {
  const date = todayKST()
  const events = await d1ListScheduleEvents({ date })
  return NextResponse.json({ date, events })
}

