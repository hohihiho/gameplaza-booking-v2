import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listReservations as listRes, createReservation as createRes } from '@/lib/db/adapter'
import { computeTotalFromSlotId, CreditOptionType, computeTotalFromDeviceType } from '@/lib/pricing/index'
import { auth } from '@/lib/auth'
import { d1GetUserByEmail, d1ListUserRestrictions } from '@/lib/db/d1'

// Zod 스키마 정의
const GetReservationsSchema = z.object({
  page: z.string().optional().transform(val => Math.max(1, parseInt(val || '1'))),
  pageSize: z.string().optional().transform(val => Math.min(100, Math.max(1, parseInt(val || '10')))),
  status: z.string().optional()
})

const CreateReservationSchema = z.object({
  device_id: z.string().min(1, 'device_id는 필수입니다'),
  deviceId: z.string().optional(), // 호환성
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, '시작 시간은 HH:MM 형식이어야 합니다').optional(),
  start_hour: z.union([z.string(), z.number()]).optional(),
  startHour: z.union([z.string(), z.number()]).optional(), // 호환성
  end_time: z.string().regex(/^\d{2}:\d{2}$/, '종료 시간은 HH:MM 형식이어야 합니다').optional(),
  end_hour: z.union([z.string(), z.number()]).optional(),
  endHour: z.union([z.string(), z.number()]).optional(), // 호환성
  player_count: z.number().min(1).max(2).optional(),
  playerCount: z.number().min(1).max(2).optional(), // 호환성
  credit_type: z.enum(['fixed', 'freeplay', 'unlimited']).optional(),
  creditType: z.enum(['fixed', 'freeplay', 'unlimited']).optional(), // 호환성
  fixed_credits: z.number().optional(),
  total_amount: z.number().optional(),
  user_notes: z.string().max(500).optional(),
  userNotes: z.string().max(500).optional(), // 호환성
  slot_type: z.string().optional(),
  payment_method: z.string().optional(),
  payment_amount: z.number().optional(),
  // 가격 계산용
  device_type_id: z.union([z.string(), z.number()]).optional(),
  credit_option_type: z.string().optional(),
  participants: z.union([z.string(), z.number()]).optional(),
  is_2p: z.boolean().optional(),
  extra_fee: z.union([z.string(), z.number()]).optional(),
  time_slot_id: z.union([z.string(), z.number()]).optional()
})

// GET /api/v3/reservations
export async function GET(req: NextRequest) {
  try {
    // 인증 체크
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다'
      }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validatedParams = GetReservationsSchema.parse(params)
    
    // 예약 목록 조회
    const result = await listRes({
      page: validatedParams.page,
      pageSize: validatedParams.pageSize,
      status: validatedParams.status as any
    })
    
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('GET /api/v3/reservations error:', error)
    
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

// POST /api/v3/reservations
export async function POST(req: NextRequest) {
  try {
    // 인증 체크
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다'
      }, { status: 401 })
    }
    
    // 사용자 정보 조회 (정지 여부 확인) - D1
    const userData = await d1GetUserByEmail(session.user.email)
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: '사용자 정보를 찾을 수 없습니다'
      }, { status: 404 })
    }
    // 정지 사용자 체크: active restriction 존재 시 차단
    const restrictions = await d1ListUserRestrictions(userData.id)
    const isBlacklisted = Array.isArray(restrictions) && restrictions.some((r: any) => r.is_active === 1)
    if (isBlacklisted) {
      return NextResponse.json({
        success: false,
        error: '정지된 계정입니다. 관리자에게 문의하세요.'
      }, { status: 403 })
    }
    const body = await req.json()
    
    // 입력 데이터 검증 및 정규화
    const validated = CreateReservationSchema.parse(body)
    
    // 호환성 처리: 다양한 필드명 지원
    const deviceId = validated.device_id || validated.deviceId || ''
    const startHour = validated.start_hour ?? validated.startHour ?? (validated.start_time ? parseInt(validated.start_time.split(':')[0]) : undefined)
    const endHour = validated.end_hour ?? validated.endHour ?? (validated.end_time ? parseInt(validated.end_time.split(':')[0]) : undefined)
    const playerCount = validated.player_count ?? validated.playerCount ?? 1
    const creditType = (validated.credit_type || validated.creditType || 'fixed') as CreditOptionType
    const userNotes = validated.user_notes || validated.userNotes || ''
    
    // 예약 충돌 체크
    if (deviceId && validated.date && startHour !== undefined && endHour !== undefined) {
      const existingReservations = await listRes({
        device_id: deviceId,
        date: validated.date,
        status: 'active'
      })
      
      // 시간대 충돌 확인
      const hasConflict = existingReservations.reservations.some(reservation => {
        const resStartHour = reservation.start_hour || 0
        const resEndHour = reservation.end_hour || 0
        
        // 시간대가 겹치는지 확인
        return !(endHour <= resStartHour || startHour >= resEndHour)
      })
      
      if (hasConflict) {
        return NextResponse.json({
          success: false,
          error: '선택한 시간대에 이미 예약이 있습니다',
          conflictingSlots: existingReservations.reservations.map(r => ({
            start: r.start_hour,
            end: r.end_hour
          }))
        }, { status: 409 }) // Conflict
      }
    }
    
    // 가격 계산
    let totalAmount = validated.total_amount || 0
    
    // device_type_id가 있으면 기기별 가격 계산
    if (validated.device_type_id) {
      const deviceTypeId = typeof validated.device_type_id === 'string' 
        ? parseInt(validated.device_type_id) 
        : validated.device_type_id
      
      const creditOptionType = (validated.credit_option_type || creditType) as CreditOptionType
      const participants = typeof validated.participants === 'string'
        ? parseInt(validated.participants)
        : (validated.participants || playerCount)
      const is2p = validated.is_2p ?? (participants > 1)
      const extraFee = typeof validated.extra_fee === 'string'
        ? parseFloat(validated.extra_fee)
        : (validated.extra_fee || 0)
        
      const pricing = await computeTotalFromDeviceType(
        deviceTypeId,
        creditOptionType,
        { participants, is_2p: is2p, extra_fee: extraFee }
      )
      
      totalAmount = pricing.total
      
      console.log('Device-based pricing:', {
        deviceTypeId,
        creditOptionType,
        participants,
        is2p,
        extraFee,
        result: pricing
      })
    }
    // time_slot_id가 있으면 시간대별 가격 계산
    else if (validated.time_slot_id) {
      const slotId = typeof validated.time_slot_id === 'string'
        ? parseInt(validated.time_slot_id)
        : validated.time_slot_id
        
      const is2p = validated.is_2p ?? (playerCount > 1)
      
      const pricing = await computeTotalFromSlotId(slotId, creditType, is2p)
      totalAmount = pricing.total
      
      console.log('Slot-based pricing:', {
        slotId,
        creditType,
        is2p,
        result: pricing
      })
    }
    
    // 예약 생성 데이터 준비
    const reservationData = {
      id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userData.id, // 인증된 사용자 ID 사용
      device_id: deviceId,
      date: validated.date,
      start_hour: startHour,
      end_hour: endHour,
      start_time: startHour ? `${String(startHour).padStart(2, '0')}:00` : undefined,
      end_time: endHour ? `${String(endHour).padStart(2, '0')}:00` : undefined,
      player_count: playerCount,
      credit_type: creditType,
      fixed_credits: validated.fixed_credits,
      total_amount: totalAmount,
      user_notes: userNotes,
      slot_type: validated.slot_type || 'normal',
      payment_method: validated.payment_method || 'cash',
      payment_amount: validated.payment_amount || totalAmount,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Creating reservation with data:', reservationData)
    
    // 예약 생성
    const reservation = await createRes(reservationData)
    
    return NextResponse.json({
      success: true,
      reservation
    })
  } catch (error) {
    console.error('POST /api/v3/reservations error:', error)
    
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
