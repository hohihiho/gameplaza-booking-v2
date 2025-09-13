import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { d1UpsertPushSubscription } from '@/lib/db/d1'

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  const body = await req.json().catch(() => null)
  if (!body?.subscription) return NextResponse.json({ code: 'BAD_REQUEST' }, { status: 400 })
  await d1UpsertPushSubscription(user.id, body.subscription)
  return NextResponse.json({ ok: true })
}

