import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { d1GetUserByEmail, d1ListUserRoles, d1GetReservationById, d1UpdateReservation } from '@/lib/db/d1'

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인 (D1)
    const me = await d1GetUserByEmail(session.user.email)
    if (!me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const roles = await d1ListUserRoles(me.id)
    const isSuperAdmin = Array.isArray(roles) && roles.some((r: any) => r.role_type === 'super_admin')
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { reservationId, paymentMethod } = body;

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    // 먼저 현재 예약 상태 확인
    
    const currentReservation = await d1GetReservationById(reservationId)
    if (!currentReservation) {
      return NextResponse.json({ 
        error: 'Reservation not found',
      }, { status: 404 });
    }

    console.log('현재 예약 상태:', {
      id: currentReservation.id,
      status: currentReservation.status,
      payment_status: currentReservation.payment_status
    });

    // 결제 확인 업데이트
    
    const updatedReservation = await d1UpdateReservation(reservationId, {
      payment_status: 'paid',
      payment_method: paymentMethod || 'cash',
      payment_confirmed_at: new Date().toISOString(),
      payment_confirmed_by: me.id,
      updated_at: new Date().toISOString()
    })

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
