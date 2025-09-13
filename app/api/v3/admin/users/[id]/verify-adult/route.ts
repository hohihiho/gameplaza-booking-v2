import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1SetAgeVerified, d1UnsetAgeVerified } from '@/lib/db/d1'

export const POST = withAuth(async (_req: Request, { params }: any) => {
  const id = String((await params).id)
  const v = await d1SetAgeVerified(id)
  return NextResponse.json({ verification: v })
}, { requireAdmin: true })

export const DELETE = withAuth(async (_req: Request, { params }: any) => {
  const id = String((await params).id)
  const v = await d1UnsetAgeVerified(id)
  return NextResponse.json({ verification: v })
}, { requireAdmin: true })

