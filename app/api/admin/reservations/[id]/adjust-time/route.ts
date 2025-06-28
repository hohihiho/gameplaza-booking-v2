// 시간 조정 API 엔드포인트
// 비전공자 설명: 관리자가 실제 이용시간을 조정할 때 호출되는 API입니다
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    const isAdmin = ['admin@gameplaza.kr', 'ndz5496@gmail.com'].includes(userData.email);
    if (!isAdmin) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // 요청 데이터 파싱
    const body = await req.json();
    const { actual_start_time, actual_end_time, reason, adjustment_type } = body;

    if (!reason) {
      return NextResponse.json({ error: '조정 사유는 필수입니다' }, { status: 400 });
    }

    // 예약 정보 조회
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        rental_time_slots (
          id,
          date,
          start_time,
          end_time,
          price
        )
      `)
      .eq('id', id)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 });
    }

    // 체크인 상태 확인
    if (!['checked_in', 'completed'].includes(reservation.status)) {
      return NextResponse.json({ error: '체크인된 예약만 시간 조정이 가능합니다' }, { status: 400 });
    }

    // 시간 조정 이력 저장
    const { error: adjustmentError } = await supabase
      .from('time_adjustments')
      .insert({
        reservation_id: id,
        adjusted_by: session.user.id,
        adjustment_type: adjustment_type || 'both',
        old_start_time: reservation.actual_start_time || `${reservation.rental_time_slots.date}T${reservation.rental_time_slots.start_time}`,
        new_start_time: actual_start_time,
        old_end_time: reservation.actual_end_time || `${reservation.rental_time_slots.date}T${reservation.rental_time_slots.end_time}`,
        new_end_time: actual_end_time,
        reason: reason,
        old_amount: reservation.total_price,
        new_amount: null // TODO: 금액 계산 로직 추가
      });

    if (adjustmentError) {
      console.error('시간 조정 이력 저장 실패:', adjustmentError);
    }

    // 예약 정보 업데이트
    const updateData: any = {
      time_adjustment_reason: reason
    };

    if (actual_start_time) {
      updateData.actual_start_time = actual_start_time;
    }
    if (actual_end_time) {
      updateData.actual_end_time = actual_end_time;
    }

    const { data: _updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: '시간 조정 실패' }, { status: 500 });
    }

    // 조정된 금액 계산 (실제 이용시간 기준)
    let adjustedAmount = reservation.total_price;
    if (actual_start_time && actual_end_time) {
      const start = new Date(actual_start_time);
      const end = new Date(actual_end_time);
      const actualMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      const actualHours = Math.ceil(actualMinutes / 60); // 시간 올림 처리
      
      // 시간당 요금 계산
      const slotStart = new Date(`1970-01-01T${reservation.rental_time_slots.start_time}`);
      const slotEnd = new Date(`1970-01-01T${reservation.rental_time_slots.end_time}`);
      const slotMinutes = (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60);
      const slotHours = slotMinutes / 60;
      const hourlyRate = reservation.rental_time_slots.price / slotHours;
      
      adjustedAmount = Math.round(hourlyRate * actualHours);
    }

    // 조정된 금액 업데이트
    if (adjustedAmount !== reservation.total_price) {
      await supabase
        .from('reservations')
        .update({ adjusted_amount: adjustedAmount })
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      data: {
        original_amount: reservation.total_price,
        adjusted_amount: adjustedAmount,
        actual_start_time: actual_start_time,
        actual_end_time: actual_end_time,
        adjustment_saved: true
      }
    });

  } catch (error) {
    console.error('시간 조정 API 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}