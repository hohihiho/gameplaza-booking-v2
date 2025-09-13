import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { d1RemovePushSubscription } from '@/lib/db/d1'

export async function POST() {
  const user = await requireAuth()
  await d1RemovePushSubscription(user.id)
  return NextResponse.json({ ok: true })
}

