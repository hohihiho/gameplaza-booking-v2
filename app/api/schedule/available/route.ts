import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/schedule/available - 사용 가능한 시간대 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const deviceTypeId = searchParams.get('deviceTypeId');

    // 필수 매개변수 검증
    if (!date) {
      return NextResponse.json({
        success: false,
        error: '날짜 매개변수가 필요합니다 (YYYY-MM-DD 형식)'
      }, { status: 400 });
    }

    if (!deviceTypeId) {
      return NextResponse.json({
        success: false,
        error: '기기 타입 ID가 필요합니다'
      }, { status: 400 });
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({
        success: false,
        error: '올바른 날짜 형식이 필요합니다 (YYYY-MM-DD)'
      }, { status: 400 });
    }

    // 기기 타입 존재 확인
    const deviceType = query.getDeviceTypeById(deviceTypeId);
    if (!deviceType) {
      return NextResponse.json({
        success: false,
        error: '해당 기기 타입을 찾을 수 없습니다'
      }, { status: 404 });
    }

    // 기본 시간 슬롯 조회
    const timeSlots = query.getAvailableSlots(date, deviceTypeId);

    // 해당 날짜의 기존 예약 조회
    const existingReservations = query.getScheduleByDate(date, deviceTypeId);

    // 각 시간 슬롯의 가용성 확인
    const availableSlots = timeSlots.map((slot: any) => {
      const startTime = slot.start_time;
      const endTime = slot.end_time;
      
      // 해당 시간대에 충돌하는 예약이 있는지 확인
      const isAvailable = query.checkSlotAvailability(
        deviceTypeId,
        date,
        startTime,
        endTime
      );

      // 해당 시간대의 예약 목록
      const conflictingReservations = existingReservations.filter((reservation: any) => {
        const resStartTime = new Date(reservation.start_time).toTimeString().split(' ')[0];
        const resEndTime = new Date(reservation.end_time).toTimeString().split(' ')[0];
        
        return (
          (resStartTime < endTime && resEndTime > startTime) ||
          (resStartTime < endTime && resEndTime > startTime) ||
          (resStartTime >= startTime && resEndTime <= endTime)
        );
      });

      return {
        ...slot,
        is_available: isAvailable,
        conflicting_reservations: conflictingReservations.length,
        reservations: conflictingReservations.map((res: any) => ({
          id: res.id,
          user_name: res.user_name,
          user_nickname: res.user_nickname,
          status: res.status,
          start_time: res.start_time,
          end_time: res.end_time
        }))
      };
    });

    // 통계 정보
    const totalSlots = availableSlots.length;
    const availableCount = availableSlots.filter((slot: any) => slot.is_available).length;
    const occupiedCount = totalSlots - availableCount;

    return NextResponse.json({
      success: true,
      date,
      deviceType: {
        id: deviceType.id,
        name: deviceType.name,
        display_name: deviceType.display_name,
        color: deviceType.color
      },
      timeSlots: availableSlots,
      statistics: {
        total_slots: totalSlots,
        available_slots: availableCount,
        occupied_slots: occupiedCount,
        availability_rate: totalSlots > 0 ? Math.round((availableCount / totalSlots) * 100) : 0
      }
    });
    
  } catch (error) {
    console.error('Available Slots GET API error:', error);
    return NextResponse.json({
      success: false,
      error: '사용 가능한 시간대 조회에 실패했습니다',
      timeSlots: []
    }, { status: 500 });
  }
}