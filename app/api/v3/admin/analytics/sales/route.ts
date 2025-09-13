import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1SalesStats } from '@/lib/db/d1'

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined
  const stats = await d1SalesStats({ start, end })
  return NextResponse.json(stats)
}, { requireAdmin: true })

