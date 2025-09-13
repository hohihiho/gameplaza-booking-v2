import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ActivateTerms } from '@/lib/db/d1'

export const POST = withAuth(async (_req: Request, { params }: any) => {
  const id = Number((await params).id)
  const updated = await d1ActivateTerms(id)
  if (!updated) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ terms: updated })
}, { requireAdmin: true })

