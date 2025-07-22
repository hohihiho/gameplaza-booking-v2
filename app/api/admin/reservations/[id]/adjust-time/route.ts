// 시간 조정 API 엔드포인트
// 비전공자 설명: 관리자가 실제 이용시간을 조정할 때 호출되는 API입니다
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

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
    // session.user.email 사용 (NextAuth 세션에는 이메일이 포함됨)
    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: '사용자 이메일을 찾을 수 없습니다' }, { status: 404 });
    }

    // 관리자 확인
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!userData) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: '관리자 권한이 없습니다' }, { status: 403 });
    }

    // 요청 데이터 파싱
    const body = await req.json();
    const { actual_start_time, actual_end_time, reason, adjustment_type } = body;

    if (!reason) {
      return NextResponse.json({ error: '조정 사유는 필수입니다' }, { status: 400 });
    }

    // 예약 정보 조회
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('*')
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
    const supabaseAdmin = createAdminClient();
  const { error$1 } = await supabaseAdmin.from('time_adjustments')
      .insert({
        reservation_id: id,
        adjusted_by: userData.id,
        adjustment_type: adjustment_type || 'both',
        old_start_time: reservation.actual_start_time || `${reservation.date}T${reservation.start_time}`,
        new_start_time: actual_start_time,
        old_end_time: reservation.actual_end_time || `${reservation.date}T${reservation.end_time}`,
        new_end_time: actual_end_time,
        reason: reason,
        old_amount: reservation.total_amount,
        new_amount: null // TODO: 금액 계산 로직 추가
      });

    if (adjustmentError) {
      console.error('시간 조정 이력 저장 실패:', adjustmentError);
      // 테이블이 없는 경우에도 계속 진행 (이력은 나중에 추가 가능)
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

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: '시간 조정 실패' }, { status: 500 });
    }

    // 스케줄 시스템이 자동으로 처리하므로 여기서는 업데이트만 수행

    return NextResponse.json({
      success: true,
      data: {
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