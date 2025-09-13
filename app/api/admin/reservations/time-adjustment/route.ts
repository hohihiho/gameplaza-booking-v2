import { getDB, supabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { createAdminClient } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
  const { data: userData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

  const { data: adminData } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const body = await request.json();
    const { reservationId, endTime, reason } = body;

    if (!reservationId || !endTime) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다' }, { status: 400 });
    }

    // 현재 예약 정보 가져오기
    
  const { data: reservation, error: reservationError } = await supabaseAdmin.from('reservations')
      .select(`
        *,
        rental_time_slots (
          date,
          start_time,
          end_time
        )
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 });
    }

    // 새로운 종료 시간 생성
    const reservationDate = reservation.date;
    const [hours, minutes] = endTime.split(':');
    const newEndTime = new Date(
      parseInt(reservationDate.split('-')[0]), // 년
      parseInt(reservationDate.split('-')[1]) - 1, // 월 (0-based)
      parseInt(reservationDate.split('-')[2]), // 일
      parseInt(hours), // 시
      parseInt(minutes), // 분
      0 // 초
    );
    
    // 기존 종료 시간
    const oldEndTime = reservation.actual_end_time || reservation.end_time;
    
    // 시작 시간은 변경하지 않음
    const oldStartTime = reservation.actual_start_time || reservation.start_time;
    const newStartTime = oldStartTime;

    // 트랜잭션으로 처리
    
  const { error: adjustmentError } = await supabaseAdmin.rpc('create_time_adjustment', {
      p_reservation_id: reservationId,
      p_adjusted_by: userData.id,
      p_new_start_time: newStartTime.toISOString(),
      p_new_end_time: newEndTime.toISOString(),
      p_reason: reason || '관리자 수동 조정'
    });

    if (adjustmentError) {
      // RPC 함수가 없으면 직접 처리
      // 1. time_adjustments 테이블에 기록 추가
      
  const { error: historyError } = await supabaseAdmin.from('time_adjustments')
        .insert({
          reservation_id: reservationId,
          adjusted_by: userData.id,
          adjustment_type: 'end_time',
          old_start_time: oldStartTime,
          new_start_time: newStartTime,
          old_end_time: oldEndTime,
          new_end_time: newEndTime,
          reason: reason || '관리자 수동 조정',
          old_amount: reservation.total_price,
          new_amount: reservation.total_price // 금액 조정은 별도로 처리
        });

      if (historyError) {
        console.error('시간 조정 이력 저장 실패:', historyError);
      }

      // 2. reservations 테이블 업데이트
      
  const { error: updateError } = await supabaseAdmin.from('reservations')
        .update({
          actual_end_time: newEndTime,
          time_adjustment_reason: reason || '관리자 수동 조정',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);

      if (updateError) {
        return NextResponse.json({ error: '시간 조정 실패' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: '시간이 성공적으로 조정되었습니다',
      data: {
        reservationId,
        newStartTime: newStartTime.toISOString(),
        newEndTime: newEndTime.toISOString(),
        reason
      }
    });

  } catch (error) {
    console.error('시간 조정 오류:', error);
    return NextResponse.json({ error: '시간 조정 중 오류가 발생했습니다' }, { status: 500 });
  }
}

// 시간 조정 이력 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    if (!reservationId) {
      return NextResponse.json({ error: '예약 ID가 필요합니다' }, { status: 400 });
    }

    // 세션 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다' }, { status: 401 });
    }

    // 시간 조정 이력 조회
    const supabaseAdmin = createAdminClient();
  const { data: adjustments, error } = await supabaseAdmin.from('time_adjustments')
      .select(`
        *,
        users!adjusted_by (
          name,
          email
        )
      `)
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '이력 조회 실패' }, { status: 500 });
    }

    // 조회 결과에 adjusted_by_user 필드 추가
    const formattedAdjustments = adjustments?.map((adj: any) => ({
      ...adj,
      adjusted_by_user: adj.users || null
    })) || [];

    return NextResponse.json({ adjustments: formattedAdjustments });

  } catch (error) {
    console.error('이력 조회 오류:', error);
    return NextResponse.json({ error: '이력 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}