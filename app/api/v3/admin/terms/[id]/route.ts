import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1UpdateTerms, d1DeleteTerms } from '@/lib/db/d1'

export const PUT = withAuth(async (req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const patch = await req.json()
  const updated = await d1UpdateTerms(id, patch)
  if (!updated) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ terms: updated })
}, { requireAdmin: true })

export const DELETE = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const ok = await d1DeleteTerms(id)
  return new NextResponse(null, { status: ok ? 204 : 404 })
}, { requireAdmin: true })

