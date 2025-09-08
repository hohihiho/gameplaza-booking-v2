import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/reservations/[id] - 특정 예약 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '예약 ID가 필요합니다'
      }, { status: 400 });
    }

    const reservation = query.getReservationById(id);
    
    if (!reservation) {
      return NextResponse.json({
        success: false,
        error: '해당 예약을 찾을 수 없습니다'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reservation
    });
    
  } catch (error) {
    console.error('Reservation GET API error:', error);
    return NextResponse.json({
      success: false,
      error: '예약 조회에 실패했습니다'
    }, { status: 500 });
  }
}

// PUT /api/reservations/[id] - 예약 상태 업데이트 (체크인/체크아웃)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '예약 ID가 필요합니다'
      }, { status: 400 });
    }

    if (!body.status) {
      return NextResponse.json({
        success: false,
        error: '변경할 상태가 필요합니다'
      }, { status: 400 });
    }

    // 현재 예약 정보 확인
    const currentReservation = query.getReservationById(id);
    if (!currentReservation) {
      return NextResponse.json({
        success: false,
        error: '해당 예약을 찾을 수 없습니다'
      }, { status: 404 });
    }

    // 추가 데이터 준비
    const additionalData: any = {};
    
    if (body.status === 'active' && body.check_in_time) {
      additionalData.check_in_time = body.check_in_time;
    }
    
    if (body.status === 'completed' && body.check_out_time) {
      additionalData.check_out_time = body.check_out_time;
    }

    if (body.device_id) {
      additionalData.device_id = body.device_id;
    }

    // 상태 업데이트
    const result = query.updateReservationStatus(id, body.status, additionalData);

    if (result.changes === 0) {
      return NextResponse.json({
        success: false,
        error: '예약 상태 업데이트에 실패했습니다'
      }, { status: 500 });
    }

    // 업데이트된 예약 정보 조회
    const updatedReservation = query.getReservationById(id);

    return NextResponse.json({
      success: true,
      message: '예약 상태가 성공적으로 업데이트되었습니다',
      reservation: updatedReservation
    });
    
  } catch (error) {
    console.error('Reservation PUT API error:', error);
    return NextResponse.json({
      success: false,
      error: '예약 상태 업데이트에 실패했습니다'
    }, { status: 500 });
  }
}

// DELETE /api/reservations/[id] - 예약 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '예약 ID가 필요합니다'
      }, { status: 400 });
    }

    // 현재 예약 정보 확인
    const currentReservation = query.getReservationById(id);
    if (!currentReservation) {
      return NextResponse.json({
        success: false,
        error: '해당 예약을 찾을 수 없습니다'
      }, { status: 404 });
    }

    // 이미 취소된 예약인지 확인
    if (currentReservation.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        error: '이미 취소된 예약입니다'
      }, { status: 400 });
    }

    // 완료된 예약은 취소할 수 없음
    if (currentReservation.status === 'completed') {
      return NextResponse.json({
        success: false,
        error: '완료된 예약은 취소할 수 없습니다'
      }, { status: 400 });
    }

    // 예약 취소
    const result = query.cancelReservation(id, reason || undefined);

    if (result.changes === 0) {
      return NextResponse.json({
        success: false,
        error: '예약 취소에 실패했습니다'
      }, { status: 500 });
    }

    // 취소된 예약 정보 조회
    const cancelledReservation = query.getReservationById(id);

    return NextResponse.json({
      success: true,
      message: '예약이 성공적으로 취소되었습니다',
      reservation: cancelledReservation
    });
    
  } catch (error) {
    console.error('Reservation DELETE API error:', error);
    return NextResponse.json({
      success: false,
      error: '예약 취소에 실패했습니다'
    }, { status: 500 });
  }
}