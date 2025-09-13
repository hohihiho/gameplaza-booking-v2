import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1GetPaymentQr, d1SetPaymentQr } from '@/lib/db/d1'

export const GET = withAuth(async (_req: NextRequest, { user }: any) => {
  const row = await d1GetPaymentQr(user.id)
  return NextResponse.json({ image_url: row?.image_url || null })
}, { requireAdmin: true })

export const PUT = withAuth(async (req: NextRequest, { user }: any) => {
  const body = await req.json().catch(() => null)
  if (!body?.image_url) return NextResponse.json({ code: 'BAD_REQUEST' }, { status: 400 })
  const row = await d1SetPaymentQr(user.id, String(body.image_url))
  return NextResponse.json({ image_url: row?.image_url })
}, { requireAdmin: true })

