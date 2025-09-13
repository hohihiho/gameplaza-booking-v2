import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListDevicePricing, d1UpsertDevicePricing, d1DeleteDevicePricing } from '@/lib/db/d1'

export const GET = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const list = await d1ListDevicePricing(id)
  return NextResponse.json({ pricing: list })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const body = await req.json()
  const upserted = await d1UpsertDevicePricing(id, {
    option_type: String(body.option_type),
    price: Number(body.price || 0),
    price_2p_extra: body.price_2p_extra != null ? Number(body.price_2p_extra) : null,
    enable_extra_people: body.enable_extra_people ? 1 : 0,
    extra_per_person: body.extra_per_person != null ? Number(body.extra_per_person) : null,
  })
  return NextResponse.json({ pricing: upserted }, { status: 201 })
}, { requireAdmin: true })

export const DELETE = withAuth(async (req: NextRequest, { params }: any) => {
  const id = Number((await params).id)
  const { searchParams } = new URL(req.url)
  const option_type = searchParams.get('option_type')
  if (!option_type) return NextResponse.json({ code: 'BAD_REQUEST' }, { status: 400 })
  const ok = await d1DeleteDevicePricing(id, option_type)
  return new NextResponse(null, { status: ok ? 204 : 404 })
}, { requireAdmin: true })

