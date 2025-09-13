import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListTerms, d1CreateTerms } from '@/lib/db/d1'

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || undefined
  const list = await d1ListTerms(type)
  return NextResponse.json({ terms: list })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json()
  const created = await d1CreateTerms({
    type: String(body.type),
    version: Number(body.version),
    title: String(body.title),
    content: String(body.content),
    is_active: Boolean(body.is_active),
  })
  return NextResponse.json({ terms: created }, { status: 201 })
}, { requireAdmin: true })

