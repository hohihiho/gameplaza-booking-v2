import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { getReservationById, deleteReservation } from '@/lib/db/adapter'

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await context.params
  const reservation = await getReservationById(id)
  if (!reservation) {
    return NextResponse.json({ code: 'NOT_FOUND', message: `Reservation ${id} not found` }, { status: 404 })
  }
  return NextResponse.json(reservation)
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await context.params
  const ok = await deleteReservation(id)
  return new NextResponse(null, { status: ok ? 204 : 404 })
}
