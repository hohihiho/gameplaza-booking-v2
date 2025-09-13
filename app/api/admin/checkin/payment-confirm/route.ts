import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { createAdminClient } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
    const { data: userData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: adminData } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { reservationId, paymentMethod } = body;

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    // 먼저 현재 예약 상태 확인
    
    const { data: currentReservation, error: fetchError } = await supabaseAdmin.from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !currentReservation) {
      console.error('예약 조회 실패:', fetchError);
      return NextResponse.json({ 
        error: 'Reservation not found',
        details: fetchError?.message 
      }, { status: 404 });
    }

    console.log('현재 예약 상태:', {
      id: currentReservation.id,
      status: currentReservation.status,
      payment_status: currentReservation.payment_status
    });

    // 결제 확인 업데이트
    
    const { data: updatedReservation, error: updateError } = await supabaseAdmin.from('reservations')
      .update({
        payment_status: 'paid',
        payment_method: paymentMethod || 'cash',
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: userData.id
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('Payment confirmation error:', updateError);
      console.error('Update data:', {
        payment_status: 'paid',
        payment_method: paymentMethod || 'cash',
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: userData.id
      });
      console.error('Error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      return NextResponse.json({ 
        error: 'Failed to confirm payment',
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data: updatedReservation 
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}