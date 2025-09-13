import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListTimeBlocks, d1CreateTimeBlock } from '@/lib/db/d1'

export const GET = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const list = await d1ListTimeBlocks(id)
  return NextResponse.json({ time_blocks: list })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const body = await req.json()
  const created = await d1CreateTimeBlock(id, {
    slot_type: String(body.slot_type),
    start_time: String(body.start_time),
    end_time: String(body.end_time),
    enable_extra_people: body.enable_extra_people ? 1 : 0,
    extra_per_person: body.extra_per_person != null ? Number(body.extra_per_person) : null,
  })
  return NextResponse.json({ time_block: created }, { status: 201 })
}, { requireAdmin: true })

