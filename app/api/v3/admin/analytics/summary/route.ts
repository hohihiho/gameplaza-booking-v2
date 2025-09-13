import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1AdminAnalytics, d1DailySales } from '@/lib/db/d1'

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined
  const mode = (searchParams.get('mode') as 'month' | 'year' | null) || undefined
  const date = searchParams.get('date') || undefined
  const summary = await d1AdminAnalytics({ start, end }, mode)
  const daily = date ? await d1DailySales(date) : null
  return NextResponse.json({ summary, daily })
}, { requireAdmin: true })

