import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1UpdatePushTemplate, d1DeletePushTemplate } from '@/lib/db/d1'

export const PUT = withAuth(async (req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const patch = await req.json()
  const updated = await d1UpdatePushTemplate(id, patch)
  if (!updated) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ template: updated })
}, { requireAdmin: true })

export const DELETE = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const ok = await d1DeletePushTemplate(id)
  return new NextResponse(null, { status: ok ? 204 : 404 })
}, { requireAdmin: true })

