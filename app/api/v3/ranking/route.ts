import { NextRequest, NextResponse } from 'next/server'
import { d1MonthlyRanking } from '@/lib/db/d1'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period') as 'month' | 'year') || 'month'
    const page = Number(searchParams.get('page') || '1')
    const pageSize = Number(searchParams.get('pageSize') || '20')
    const baseDate = searchParams.get('date') || undefined // YYYY-MM-DD 기준일

    const data = await d1MonthlyRanking({ period, page, pageSize, baseDate })
    return NextResponse.json({
      period,
      start: data.start,
      end: data.end,
      totalUsers: data.totalUsers,
      page: data.page,
      pageSize: data.pageSize,
      items: data.items,
    })
  } catch (error) {
    console.error('GET /api/v3/ranking error:', error)
    return NextResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

