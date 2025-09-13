import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { d1UpdateUserImage } from '@/lib/db/d1'

export async function PUT(req: NextRequest) {
  const user = await requireAuth()
  const body = await req.json().catch(() => null)
  if (!body?.image_url) return NextResponse.json({ code: 'BAD_REQUEST' }, { status: 400 })
  const updated = await d1UpdateUserImage(user.id, String(body.image_url))
  return NextResponse.json({ user: updated })
}

