import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { d1GetAgeVerification } from '@/lib/db/d1'

export async function GET() {
  const user = await requireAuth()
  const v = await d1GetAgeVerification(user.id)
  return NextResponse.json({ verified: v?.is_verified === 1, verified_at: v?.verified_at })
}

