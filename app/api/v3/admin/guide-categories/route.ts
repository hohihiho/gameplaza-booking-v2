import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListGuideCategories, d1CreateGuideCategory } from '@/lib/db/d1'

export const GET = withAuth(async () => {
  const cats = await d1ListGuideCategories()
  return NextResponse.json({ categories: cats })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json()
  const created = await d1CreateGuideCategory({
    slug: String(body.slug),
    name: String(body.name),
    description: body.description,
    display_order: body.display_order != null ? Number(body.display_order) : undefined,
    icon: body.icon,
  })
  return NextResponse.json({ category: created }, { status: 201 })
}, { requireAdmin: true })

