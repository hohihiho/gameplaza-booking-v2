import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1UpdateTimeBlock, d1DeleteTimeBlock } from '@/lib/db/d1'

export const PUT = withAuth(async (req: NextRequest, { params }: any) => {
  const { id, blockId } = await params
  const patch = await req.json()
  const updated = await d1UpdateTimeBlock(Number(id), Number(blockId), patch)
  if (!updated) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ time_block: updated })
}, { requireAdmin: true })

export const DELETE = withAuth(async (_req: NextRequest, { params }: any) => {
  const { id, blockId } = await params
  const ok = await d1DeleteTimeBlock(Number(id), Number(blockId))
  return new NextResponse(null, { status: ok ? 204 : 404 })
}, { requireAdmin: true })

