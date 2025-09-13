import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListPushTemplates, d1CreatePushTemplate } from '@/lib/db/d1'

export const GET = withAuth(async () => {
  const list = await d1ListPushTemplates()
  return NextResponse.json({ templates: list })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json()
  const created = await d1CreatePushTemplate({
    template_key: String(body.template_key),
    title: String(body.title),
    body: String(body.body),
    data: body.data ?? null,
  })
  return NextResponse.json({ template: created }, { status: 201 })
}, { requireAdmin: true })

