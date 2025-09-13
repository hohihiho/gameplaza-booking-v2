import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ConfirmReservationPayment } from '@/lib/db/d1'

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  const id = String((await params).id)
  const body = await req.json()
  const method = String(body.payment_method)
  const amount = Number(body.payment_amount || 0)
  const updated = await d1ConfirmReservationPayment(id, method, amount)
  if (!updated) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ reservation: updated })
}, { requireAdmin: true })

