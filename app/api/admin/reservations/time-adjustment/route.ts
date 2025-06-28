import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다' }, { status: 401 });
    }

    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin@gameplaza.kr', 'ndz5496@gmail.com'].includes(userData.email)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const body = await request.json();
    const { reservationId, startTime, endTime, reason } = body;

    if (!reservationId || !startTime || !endTime) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다' }, { status: 400 });
    }

    // 현재 예약 정보 가져오기
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
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

    // 새로운 시작/종료 시간 생성
    const newStartTime = new Date(`${reservation.rental_time_slots.date}T${startTime}:00`);
    const newEndTime = new Date(`${reservation.rental_time_slots.date}T${endTime}:00`);
    
    // 기존 시작/종료 시간
    const oldStartTime = reservation.actual_start_time || 
      new Date(`${reservation.rental_time_slots.date}T${reservation.rental_time_slots.start_time}`);
    const oldEndTime = reservation.actual_end_time || 
      new Date(`${reservation.rental_time_slots.date}T${reservation.rental_time_slots.end_time}`);

    // 트랜잭션으로 처리
    const { error: adjustmentError } = await supabase.rpc('create_time_adjustment', {
      p_reservation_id: reservationId,
      p_adjusted_by: user.id,
      p_new_start_time: newStartTime.toISOString(),
      p_new_end_time: newEndTime.toISOString(),
      p_reason: reason || '관리자 수동 조정'
    });

    if (adjustmentError) {
      // RPC 함수가 없으면 직접 처리
      // 1. time_adjustments 테이블에 기록 추가
      const { error: historyError } = await supabase
        .from('time_adjustments')
        .insert({
          reservation_id: reservationId,
          adjusted_by: user.id,
          adjustment_type: 'both',
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
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          actual_start_time: newStartTime,
          actual_end_time: newEndTime,
          time_adjustment_reason: reason || '관리자 수동 조정'
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
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    if (!reservationId) {
      return NextResponse.json({ error: '예약 ID가 필요합니다' }, { status: 400 });
    }

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다' }, { status: 401 });
    }

    // 시간 조정 이력 조회
    const { data: adjustments, error } = await supabase
      .from('time_adjustments')
      .select(`
        *,
        adjusted_by_user:users!adjusted_by (
          name,
          email
        )
      `)
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '이력 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({ adjustments });

  } catch (error) {
    console.error('이력 조회 오류:', error);
    return NextResponse.json({ error: '이력 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}