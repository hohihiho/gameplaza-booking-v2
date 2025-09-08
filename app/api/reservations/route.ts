import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/reservations - 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // userId가 있으면 특정 사용자의 예약만, 없으면 모든 예약 조회
    const reservations = query.getReservations(userId || undefined);
    
    return NextResponse.json({
      success: true,
      reservations,
      count: reservations.length
    });
    
  } catch (error) {
    console.error('Reservations GET API error:', error);
    return NextResponse.json({ 
      success: false,
      error: '예약 목록 조회에 실패했습니다',
      reservations: []
    }, { status: 500 });
  }
}

// POST /api/reservations - 새 예약 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    const requiredFields = ['user_id', 'device_type_id', 'start_time', 'end_time', 'duration_hours', 'total_price'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // 시간대 겹침 검사 (선택사항 - 프론트엔드에서도 처리할 수 있음)
    const date = new Date(body.start_time).toISOString().split('T')[0];
    const startTime = new Date(body.start_time).toTimeString().split(' ')[0];
    const endTime = new Date(body.end_time).toTimeString().split(' ')[0];
    
    const isAvailable = query.checkSlotAvailability(
      body.device_type_id,
      date,
      startTime,
      endTime
    );

    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        error: '선택한 시간대에 이미 예약이 있습니다'
      }, { status: 409 });
    }

    // 예약 생성
    const result = query.createReservation({
      user_id: body.user_id,
      device_type_id: body.device_type_id,
      device_id: body.device_id || null,
      start_time: body.start_time,
      end_time: body.end_time,
      duration_hours: body.duration_hours,
      total_price: body.total_price,
      credit_type: body.credit_type || 'hours',
      credit_amount: body.credit_amount || body.duration_hours,
      is_2p: body.is_2p || 0,
      status: body.status || 'pending',
      notes: body.notes || null
    });

    // 생성된 예약 조회
    const newReservation = query.getReservationById(result.lastInsertRowid.toString());

    return NextResponse.json({
      success: true,
      message: '예약이 성공적으로 생성되었습니다',
      reservation: newReservation
    }, { status: 201 });
    
  } catch (error) {
    console.error('Reservations POST API error:', error);
    return NextResponse.json({
      success: false,
      error: '예약 생성에 실패했습니다'
    }, { status: 500 });
  }
}