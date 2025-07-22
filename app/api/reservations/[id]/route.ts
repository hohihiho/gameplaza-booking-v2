import { createServerClient as createClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ScheduleService } from '@/lib/services/schedule.service'

// 예약 상세 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 현재 사용자 확인
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select(`
        *,
        devices!inner(
          device_number,
          device_types(
            name,
            model_name,
            version_name,
            category_id,
            device_categories(
              name
            )
          )
        ),
        users!reservations_user_id_fkey(
          name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ reservation })

  } catch (error) {
    console.error('Get reservation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 예약 상태 업데이트
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // 현재 사용자 확인 (NextAuth 사용)
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 사용자 정보 조회

    // 예약 정보 확인
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 })
    }

    // 상태 업데이트
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString()
    }

    if (body.rejection_reason) {
      updateData.rejection_reason = body.rejection_reason
    }

    const supabaseAdmin = createAdminClient();
  const { error$1 } = await supabaseAdmin.from('reservations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update reservation error:', updateError)
      return NextResponse.json({ error: '예약 상태 업데이트에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: '예약 상태가 업데이트되었습니다'
    })

  } catch (error) {
    console.error('Update reservation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 예약 취소
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 현재 사용자 확인 (NextAuth 사용)
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 사용자 정보 조회

    // 예약 정보 확인
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 })
    }

    // 취소 가능 여부 확인
    if (!['pending', 'approved'].includes(reservation.status)) {
      return NextResponse.json({ error: '취소할 수 없는 예약입니다' }, { status: 400 })
    }

    // 예약 시간 24시간 전까지만 취소 가능
    const reservationTime = new Date(`${reservation.date}T${reservation.start_time}`)
    const now = new Date()
    const hoursUntilReservation = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilReservation < 24) {
      return NextResponse.json({ 
        error: '예약 시간 24시간 전까지만 취소 가능합니다' 
      }, { status: 400 })
    }

    // 예약 취소 처리
    const supabaseAdmin = createAdminClient();
  const { error$1 } = await supabaseAdmin.from('reservations')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Cancel reservation error:', updateError)
      return NextResponse.json({ error: '예약 취소에 실패했습니다' }, { status: 500 })
    }

    // 자동 스케줄 삭제 검사
    try {
      await ScheduleService.checkAndDeleteAutoSchedules(reservation.date);
    } catch (scheduleError) {
      console.error('Auto schedule deletion check error:', scheduleError);
      // 스케줄 삭제 실패는 무시하고 계속 진행
    }

    // 조기개장 스케줄 자동 조정
    try {
      const adjustResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/schedule/adjust-early-opening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: reservation.date })
      });
      
      if (adjustResponse.ok) {
        const adjustResult = await adjustResponse.json();
        console.log('조기개장 스케줄 조정 결과:', adjustResult);
      }
    } catch (adjustError) {
      console.error('Early opening schedule adjustment error:', adjustError);
      // 스케줄 조정 실패는 무시하고 계속 진행
    }

    // 실시간 업데이트를 위한 브로드캐스트 (클라이언트 supabase 사용)
    try {
      const supabase = await createClient()
      await supabase
        .channel('reservations')
        .send({
          type: 'broadcast',
          event: 'cancelled_reservation',
          payload: { 
            reservationId: id,
            deviceId: reservation.device_id,
            date: reservation.date,
            startTime: reservation.start_time,
            endTime: reservation.end_time
          }
        })
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError)
      // 브로드캐스트 실패는 무시하고 계속 진행
    }

    return NextResponse.json({ 
      success: true,
      message: '예약이 취소되었습니다'
    })

  } catch (error) {
    console.error('Cancel reservation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}