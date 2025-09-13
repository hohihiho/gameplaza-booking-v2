import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { createReservation } from '@/lib/db/adapter'

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json()
  // Admin proxy reservation: requires target user_id
  if (!body.user_id || !body.device_id || !body.date) {
    return NextResponse.json({ code: 'BAD_REQUEST', message: 'user_id, device_id, date are required' }, { status: 400 })
  }
  const now = new Date().toISOString()
  const resv = await createReservation({
    id: `adm-${Date.now()}`,
    user_id: String(body.user_id),
    device_id: String(body.device_id),
    date: String(body.date),
    start_time: body.start_time ?? '00:00',
    end_time: body.end_time ?? '00:00',
    player_count: Number(body.player_count ?? 1),
    credit_type: String(body.credit_type ?? 'freeplay'),
    fixed_credits: body.fixed_credits != null ? Number(body.fixed_credits) : undefined,
    total_amount: Number(body.total_amount ?? 0),
    user_notes: body.user_notes ?? null,
    slot_type: String(body.slot_type ?? 'normal'),
    status: 'approved',
    created_at: now,
    updated_at: now,
    payment_method: body.payment_method ?? null,
    payment_amount: body.payment_amount != null ? Number(body.payment_amount) : undefined,
  })
  return NextResponse.json({ reservation: resv }, { status: 201 })
}, { requireAdmin: true })

