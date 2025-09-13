import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'
import { CreateReservationV2UseCase } from '@/application/use-cases/reservation/create-reservation.v2.use-case'
import { SupabaseReservationRepositoryV2 } from '@/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseDeviceRepositoryV2 } from '@/infrastructure/repositories/supabase-device.repository.v2'
import { SupabaseUserRepository } from '@/infrastructure/repositories/supabase-user.repository'

// 테스트용 엔드포인트 - 인증 없이 예약 생성 테스트
export async function POST(request: NextRequest) {
  try {
    import { getDB, supabase } from '@/lib/db';
    
    // 테스트용 사용자 ID (첫 번째 사용자 사용)
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single()
      
    if (!users) {
      return NextResponse.json({ error: '테스트 사용자 없음' }, { status: 400 })
    }
    
    const userId = users.id
    const body = await request.json()
    
    // 레포지토리 초기화
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const userRepository = new SupabaseUserRepository(supabase)
    
    // UseCase 실행
    const useCase = new CreateReservationV2UseCase(
      reservationRepository,
      deviceRepository as any,
      userRepository as any
    )
    
    console.log('테스트 예약 생성 시도:', {
      userId,
      deviceId: body.device_id,
      date: body.date,
      startHour: body.start_hour,
      endHour: body.end_hour
    })
    
    const result = await useCase.execute({
      userId: userId,
      deviceId: body.device_id,
      date: body.date,
      startHour: body.start_hour,
      endHour: body.end_hour,
      userNotes: body.user_notes,
      isAdmin: true // 테스트를 위해 관리자 권한 추가
    })
    
    return NextResponse.json({ 
      reservation: result,
      message: '예약이 성공적으로 생성되었습니다'
    })
    
  } catch (error: any) {
    console.error('예약 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || '예약 생성 실패' },
      { status: 400 }
    )
  }
}