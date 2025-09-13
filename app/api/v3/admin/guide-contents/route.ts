import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListGuideContents, d1CreateGuideContent } from '@/lib/db/d1'

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('category_id')
  const list = await d1ListGuideContents(categoryId ? Number(categoryId) : undefined)
  return NextResponse.json({ contents: list })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json()
  const created = await d1CreateGuideContent({
    category_id: Number(body.category_id),
    title: String(body.title),
    content: String(body.content),
    is_published: Boolean(body.is_published),
    display_order: body.display_order != null ? Number(body.display_order) : undefined,
  })
  return NextResponse.json({ content: created }, { status: 201 })
}, { requireAdmin: true })

