import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listReservations } from '@/lib/db/adapter'
import { auth } from '@/lib/auth'

// 스키마 정의
const AvailabilitySchema = z.object({
  device_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_hour: z.string().transform(val => parseInt(val)),
  end_hour: z.string().transform(val => parseInt(val))
})

// GET /api/v3/availability
export async function GET(req: NextRequest) {
  try {
    // Better Auth 세션 체크
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다'
      }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validated = AvailabilitySchema.parse(params)
    
    // 해당 날짜의 기기 예약 조회
    const reservations = await listReservations({
      device_id: validated.device_id,
      date: validated.date,
      status: 'active' // 취소되지 않은 예약만
    })
    
    // 시간대 충돌 확인
    const hasConflict = reservations.reservations.some(reservation => {
      const resStartHour = reservation.start_hour || 0
      const resEndHour = reservation.end_hour || 0
      
      // 시간대가 겹치는지 확인
      return !(validated.end_hour <= resStartHour || validated.start_hour >= resEndHour)
    })
    
    // 사용 중인 시간대 목록
    const occupiedSlots = reservations.reservations.map(reservation => ({
      start: reservation.start_hour || 0,
      end: reservation.end_hour || 0,
      id: reservation.id
    }))
    
    return NextResponse.json({
      success: true,
      available: !hasConflict,
      occupied_slots: occupiedSlots,
      requested_slot: {
        start: validated.start_hour,
        end: validated.end_hour
      }
    })
  } catch (error) {
    console.error('GET /api/v3/availability error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}