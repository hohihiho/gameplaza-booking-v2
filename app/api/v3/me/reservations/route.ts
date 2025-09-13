import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { listReservationsByUser } from '@/lib/db/adapter'

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')))
  const status = searchParams.get('status') || undefined
  const list = await listReservationsByUser(user.id, { page, pageSize, status })
  return NextResponse.json(list)
}

