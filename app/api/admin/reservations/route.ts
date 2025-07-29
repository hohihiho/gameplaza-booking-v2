import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ScheduleService } from '@/lib/services/schedule.service'
import { withAuth } from '@/lib/auth'
import { sendReservationApprovedNotification, sendReservationCancelledNotification } from '@/lib/server/push-notifications'

// 관리자용 예약 목록 조회
export const GET = withAuth(
  async (request: NextRequest, { user: _user }) => {
    try {
    const supabaseAdmin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const limit = searchParams.get('limit');
    
    let query = supabaseAdmin
      .from('reservations')
      .select(`
        *,
        users:user_id (
          id,
          name,
          phone,
          email,
          nickname
        ),
        devices:device_id (
          device_number,
          device_types (
            name,
            model_name,
            version_name,
            category_id,
            device_categories (
              name
            )
          )
        )
      `);
    
    // 연도 필터링 (기본값은 전체)
    if (year && year !== 'all') {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }
    
    // 제한 개수 적용 (기본값은 1000개)
    if (limit) {
      query = query.limit(parseInt(limit));
    } else {
      query = query.limit(1000);
    }
    
    // 최신 순으로 정렬
    query = query.order('created_at', { ascending: false });

    const { data: reservationsData, error } = await query;

    if (error) {
      console.error('예약 데이터 조회 에러:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: reservationsData || [] });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
  },
  { requireAdmin: true }
);

// 예약 상태 업데이트
export const PATCH = withAuth(
  async (request: NextRequest, { user: _user }) => {
    try {
    const body = await request.json();
    const { id, status, notes } = body;

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      // approved_by는 UUID 타입이므로 제외 (향후 실제 관리자 ID 사용)
    }
    
    if (status === 'rejected' && notes) {
      updateData.admin_notes = notes;
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('예약 상태 업데이트 에러:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 예약 승인 시 자동 스케줄 업데이트 및 푸시 알림
    if (status === 'approved') {
      await ScheduleService.handleReservationApproved(id);
      
      // 예약 정보 가져오기
      const { data: reservationData } = await supabaseAdmin.from('reservations')
        .select('user_id, reservation_number')
        .eq('id', id)
        .single();
        
      if (reservationData?.user_id && reservationData?.reservation_number) {
        // 푸시 알림 전송 (비동기로 처리하여 응답 지연 방지)
        sendReservationApprovedNotification(
          reservationData.user_id, 
          reservationData.reservation_number
        ).catch(err => console.error('푸시 알림 전송 실패:', err));
      }
    }
    
    // 예약 거절/취소 시 자동 스케줄 삭제 검사 및 조기개장 스케줄 조정
    if (status === 'rejected' || status === 'cancelled') {
      try {
        // 예약 정보를 조회해서 날짜 가져오기
        const supabaseAdmin2 = createAdminClient();
        const { data: reservationData } = await supabaseAdmin2.from('reservations')
          .select('date, user_id, reservation_number')
          .eq('id', id)
          .single();
          
        if (reservationData?.date) {
          await ScheduleService.checkAndDeleteAutoSchedules(reservationData.date);
          
          // 조기개장 스케줄 자동 조정
          try {
            const adjustResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/schedule/adjust-early-opening`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ date: reservationData.date })
            });
            
            if (adjustResponse.ok) {
              const adjustResult = await adjustResponse.json();
              console.log('조기개장 스케줄 조정 결과:', adjustResult);
            }
          } catch (adjustError) {
            console.error('Early opening schedule adjustment error:', adjustError);
            // 스케줄 조정 실패는 무시하고 계속 진행
          }
        }
        
        // 예약 취소 푸시 알림 전송
        if (status === 'cancelled' && reservationData?.user_id && reservationData?.reservation_number) {
          sendReservationCancelledNotification(
            reservationData.user_id,
            reservationData.reservation_number
          ).catch(err => console.error('취소 알림 전송 실패:', err));
        }
      } catch (scheduleError) {
        console.error('Auto schedule deletion check error:', scheduleError);
        // 스케줄 삭제 실패는 무시하고 계속 진행
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
  },
  { requireAdmin: true }
);