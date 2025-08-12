// 노쇼 처리 API 엔드포인트
// 비전공자 설명: 고객이 예약 시간에 방문하지 않았을 때 예약을 취소하는 API입니다
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { createAdminClient } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 세션 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
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
      return NextResponse.json({ error: '관리자 권한이 없습니다' }, { status: 403 });
    }

    // 요청 데이터 파싱
    const body = await req.json();
    const { reason } = body;

    // 예약 정보 조회
    
  const { data: reservation, error: reservationError } = await supabaseAdmin.from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 });
    }

    // 상태 검증 - approved 상태만 노쇼 처리 가능
    if (reservation.status !== 'approved') {
      return NextResponse.json({ error: '승인된 예약만 노쇼 처리가 가능합니다' }, { status: 400 });
    }

    // 예약 상태를 'no_show'로 업데이트
    const updateData: any = {
      status: 'no_show',
      cancelled_at: new Date().toISOString(),
      cancelled_by: userData.id,
      cancellation_reason: reason || '고객 미방문 (노쇼)'
    };

    // payment_status 컬럼이 'cancelled' 값을 지원하는지 확인
    // 지원하지 않으면 생략
    try {
      // 먼저 현재 payment_status 확인
      if (reservation.payment_status === 'pending') {
        // pending 상태면 그대로 유지 (노쇼는 결제와 무관)
      }
    } catch (e) {
      console.log('payment_status 처리 생략');
    }

  const { data: updatedReservation, error: updateError } = await supabaseAdmin.from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('노쇼 처리 업데이트 에러:', updateError);
      return NextResponse.json({ error: '노쇼 처리 실패', details: updateError.message }, { status: 500 });
    }

    // 사용자의 노쇼 횟수 증가
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({ 
        no_show_count: supabaseAdmin.raw('no_show_count + 1')
      })
      .eq('id', reservation.user_id);
    
    if (userUpdateError) {
      console.error('노쇼 카운트 업데이트 에러:', userUpdateError);
      // 에러가 발생해도 노쇼 처리는 계속 진행
    }

    // 배정된 기기가 있다면 상태를 사용가능으로 변경
    if (reservation.device_id) {
      await supabaseAdmin
        .from('devices')
        .update({ status: 'available' })
        .eq('id', reservation.device_id);
    }

    // 대여 시간대도 취소 처리
    if (reservation.rental_time_slot_id) {
      await supabaseAdmin
        .from('rental_time_slots')
        .update({ is_cancelled: true })
        .eq('id', reservation.rental_time_slot_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        reservation: updatedReservation,
        message: '노쇼 처리가 완료되었습니다.'
      }
    });

  } catch (error) {
    console.error('노쇼 처리 API 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}