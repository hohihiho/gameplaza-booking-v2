import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { updateReservation, getReservationById } from '@/lib/db/adapter'

type PaymentMethod = 'cash' | 'transfer'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await context.params
  const body = await req.json().catch(() => ({})) as Partial<{
    check_in_at: string
    payment_method: PaymentMethod
    payment_amount: number
  }>

  // 존재 확인
  const current = await getReservationById(id)
  if (!current) {
    return NextResponse.json({ code: 'NOT_FOUND', message: `Reservation ${id} not found` }, { status: 404 })
  }

  // 입력 정규화
  const now = new Date().toISOString()
  const check_in_at = body.check_in_at || now

  if (body.payment_method && body.payment_method !== 'cash' && body.payment_method !== 'transfer') {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'payment_method must be cash or transfer' }, { status: 400 })
  }
  if (body.payment_amount != null && (typeof body.payment_amount !== 'number' || body.payment_amount < 0)) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'payment_amount must be a non-negative number' }, { status: 400 })
  }

  const updated = await updateReservation(id, {
    check_in_at,
    payment_method: body.payment_method ?? current.payment_method,
    payment_amount: body.payment_amount ?? current.payment_amount,
    status: current.status === 'pending' ? 'checked_in' : current.status,
  })

  return NextResponse.json({ reservation: updated })
}
