import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ApproveReservationUseCase } from '@/src/application/use-cases/reservation/approve-reservation.use-case'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { NotificationSupabaseRepository } from '@/src/infrastructure/repositories/notification.supabase.repository'

// 테스트용 엔드포인트 - 인증 없이 예약 승인 테스트
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    
    // 관리자 사용자 찾기
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()
      
    if (!adminUser) {
      return NextResponse.json({ error: '관리자 사용자 없음' }, { status: 400 })
    }
    
    // 레포지토리 초기화
    const userRepository = new UserSupabaseRepository(supabase)
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const notificationRepository = new NotificationSupabaseRepository(supabase)
    
    // UseCase 실행
    const useCase = new ApproveReservationUseCase(
      userRepository as any,
      reservationRepository as any,
      deviceRepository as any,
      notificationRepository as any
    )
    
    console.log('테스트 예약 승인 시도:', {
      adminId: adminUser.id,
      reservationId: body.reservation_id
    })
    
    const result = await useCase.execute({
      userId: adminUser.id,
      reservationId: body.reservation_id
    })
    
    return NextResponse.json({ 
      success: true,
      reservation: {
        id: result.reservation.id,
        status: result.reservation.status.value,
        assignedDeviceNumber: result.assignedDeviceNumber
      },
      message: result.message
    })
    
  } catch (error: any) {
    console.error('예약 승인 오류:', error)
    return NextResponse.json(
      { error: error.message || '예약 승인 실패' },
      { status: 400 }
    )
  }
}