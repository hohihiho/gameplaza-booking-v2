// 금액 조정 API 엔드포인트
// 비전공자 설명: 예약 금액을 수동으로 조정하는 API입니다
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/db';

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
    const { adjustedAmount, reason } = body;

    // 유효성 검사
    if (adjustedAmount === undefined || adjustedAmount === null) {
      return NextResponse.json({ error: '조정 금액이 필요합니다' }, { status: 400 });
    }

    if (adjustedAmount < 0) {
      return NextResponse.json({ error: '금액은 0원 이상이어야 합니다' }, { status: 400 });
    }

    // 예약 정보 조회
    
  const { data: reservation, error: reservationError } = await supabaseAdmin.from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 });
    }

    // 금액 조정 이력 저장 (audit trail)
    
  const { error: historyError } = await supabaseAdmin.from('amount_adjustments')
      .insert({
        reservation_id: id,
        original_amount: reservation.total_amount,
        adjusted_amount: adjustedAmount,
        difference: adjustedAmount - reservation.total_amount,
        reason: reason || '관리자 수동 조정',
        adjusted_by: userData.id,
        created_at: new Date().toISOString()
      });

    // 이력 테이블이 없을 경우에도 계속 진행
    if (historyError) {
      console.log('금액 조정 이력 저장 스킵 (테이블 없음)');
    }

    // 예약 금액 업데이트
    
  const { data: updatedReservation, error: updateError } = await supabaseAdmin.from('reservations')
      .update({
        adjusted_amount: adjustedAmount,
        adjustment_reason: reason || '관리자 수동 조정',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('금액 조정 업데이트 에러:', updateError);
      return NextResponse.json({ error: '금액 조정 실패', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        reservation: updatedReservation,
        message: '금액이 성공적으로 조정되었습니다.'
      }
    });

  } catch (error) {
    console.error('금액 조정 API 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}