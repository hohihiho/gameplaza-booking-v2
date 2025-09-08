import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/devices/available - 특정 시간대에 사용 가능한 기기 목록
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceTypeId = searchParams.get('deviceTypeId');
    const date = searchParams.get('date');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    // 필수 매개변수 검증
    if (!deviceTypeId) {
      return NextResponse.json({
        success: false,
        error: '기기 타입 ID가 필요합니다'
      }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({
        success: false,
        error: '날짜 매개변수가 필요합니다 (YYYY-MM-DD 형식)'
      }, { status: 400 });
    }

    if (!startTime) {
      return NextResponse.json({
        success: false,
        error: '시작 시간이 필요합니다 (HH:MM:SS 형식)'
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

    // 시간 형식 검증
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(startTime)) {
      return NextResponse.json({
        success: false,
        error: '올바른 시작 시간 형식이 필요합니다 (HH:MM 또는 HH:MM:SS)'
      }, { status: 400 });
    }

    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json({
        success: false,
        error: '올바른 종료 시간 형식이 필요합니다 (HH:MM 또는 HH:MM:SS)'
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

    // 사용 가능한 기기 조회
    const availableDevices = query.getAvailableDevices(
      deviceTypeId,
      date,
      startTime,
      endTime || undefined
    );

    // 각 기기의 상세 정보와 예약 상태 조회
    const devicesWithDetails = availableDevices.map((device: any) => {
      // 해당 기기의 해당 날짜 예약 조회
      const deviceReservations = query.getDeviceReservations(device.id, date);
      
      // 요청된 시간대와 겹치는 예약이 있는지 확인
      const conflictingReservations = deviceReservations.filter((reservation: any) => {
        const resStartTime = new Date(reservation.start_time).toTimeString().split(' ')[0];
        const resEndTime = new Date(reservation.end_time).toTimeString().split(' ')[0];
        const requestEndTime = endTime || startTime;
        
        return (
          (resStartTime < requestEndTime && resEndTime > startTime) ||
          (resStartTime < requestEndTime && resEndTime > startTime) ||
          (resStartTime >= startTime && resEndTime <= requestEndTime)
        );
      });

      return {
        id: device.id,
        name: device.name,
        status: device.status,
        position: device.position,
        last_used_at: device.last_used_at,
        is_available: conflictingReservations.length === 0,
        conflicting_reservations: conflictingReservations.length,
        next_reservation: deviceReservations.length > 0 ? deviceReservations[0] : null,
        reservations_today: deviceReservations.map((res: any) => ({
          id: res.id,
          user_name: res.user_name,
          user_nickname: res.user_nickname,
          status: res.status,
          start_time: res.start_time,
          end_time: res.end_time
        }))
      };
    });

    // 통계 계산
    const totalDevices = query.getDevicesByType(deviceTypeId).length;
    const availableCount = devicesWithDetails.filter((device: any) => device.is_available).length;
    const occupiedCount = totalDevices - availableCount;

    return NextResponse.json({
      success: true,
      query: {
        deviceTypeId,
        date,
        startTime,
        endTime: endTime || null
      },
      deviceType: {
        id: deviceType.id,
        name: deviceType.name,
        display_name: deviceType.display_name,
        color: deviceType.color
      },
      devices: devicesWithDetails,
      statistics: {
        total_devices: totalDevices,
        available_devices: availableCount,
        occupied_devices: occupiedCount,
        availability_rate: totalDevices > 0 ? Math.round((availableCount / totalDevices) * 100) : 0
      }
    });
    
  } catch (error) {
    console.error('Available Devices GET API error:', error);
    return NextResponse.json({
      success: false,
      error: '사용 가능한 기기 목록 조회에 실패했습니다',
      devices: []
    }, { status: 500 });
  }
}