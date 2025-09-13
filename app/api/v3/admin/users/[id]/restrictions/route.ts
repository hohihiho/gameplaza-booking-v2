import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListUserRestrictions, d1AddUserRestriction, d1UpdateUserRestriction, d1SuspendUserForever } from '@/lib/db/d1'

export const GET = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = String((await params).id)
  const list = await d1ListUserRestrictions(id)
  return NextResponse.json({ restrictions: list })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  const id = String((await params).id)
  const body = await req.json()
  if (body.permanent === true) {
    const user = await d1SuspendUserForever(id, body.reason, body.created_by)
    return NextResponse.json({ user })
  }
  const list = await d1AddUserRestriction(id, {
    restriction_type: String(body.restriction_type),
    reason: body.reason,
    start_date: body.start_date,
    end_date: body.end_date,
    created_by: body.created_by,
  })
  return NextResponse.json({ restrictions: list }, { status: 201 })
}, { requireAdmin: true })

export const PUT = withAuth(async (req: NextRequest) => {
  const body = await req.json()
  const updated = await d1UpdateUserRestriction(Number(body.id), body)
  if (!updated) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ restriction: updated })
}, { requireAdmin: true })

