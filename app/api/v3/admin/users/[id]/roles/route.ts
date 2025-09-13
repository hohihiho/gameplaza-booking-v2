import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListUserRoles, d1AddUserRole, d1RemoveUserRole } from '@/lib/db/d1'

export const GET = withAuth(async (_req: NextRequest, { params }: any) => {
  const id = String((await params).id)
  const roles = await d1ListUserRoles(id)
  return NextResponse.json({ roles })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  const id = String((await params).id)
  const body = await req.json()
  const roles = await d1AddUserRole(id, String(body.role_type), String(body.granted_by))
  return NextResponse.json({ roles })
}, { requireAdmin: true })

export const DELETE = withAuth(async (req: NextRequest, { params }: any) => {
  const id = String((await params).id)
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role_type')
  if (!role) return NextResponse.json({ code: 'BAD_REQUEST' }, { status: 400 })
  await d1RemoveUserRole(id, role)
  return new NextResponse(null, { status: 204 })
}, { requireAdmin: true })

