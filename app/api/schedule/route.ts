import { NextRequest, NextResponse } from 'next/server';
import { query, db } from '@/lib/db';

// GET /api/schedule - 날짜별 또는 월별 스케줄 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const deviceTypeId = searchParams.get('deviceTypeId');

    // 월별 조회 모드 (스케줄 페이지용)
    if (year && month) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json({
          success: false,
          error: '올바른 년도와 월이 필요합니다'
        }, { status: 400 });
      }

      // 해당 월의 시작일과 마지막일 계산
      const startDate = `${yearNum}-${monthNum.toString().padStart(2, '0')}-01`;
      const endDate = new Date(yearNum, monthNum, 0).toISOString().split('T')[0]; // 해당 월의 마지막 날

      try {
        // 1. 운영 일정 이벤트 조회 (schedule_events 테이블이 있다고 가정)
        let scheduleEvents: any[] = [];
        try {
          const stmt = db.prepare(`
            SELECT * FROM schedule_events 
            WHERE (date >= ? AND date <= ?) OR (date <= ? AND end_date >= ?)
            ORDER BY date
          `);
          scheduleEvents = stmt.all(startDate, endDate, endDate, startDate) as any[];
        } catch (error) {
          console.log('schedule_events 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.');
        }

        // 2. 예약 데이터 조회
        const reservationsStmt = db.prepare(`
          SELECT r.*, 
                 dt.name as device_type_name, dt.display_name as device_type_display_name, dt.color as device_type_color,
                 DATE(r.start_time) as date, TIME(r.start_time) as start_time, TIME(r.end_time) as end_time,
                 r.device_id
          FROM reservations r
          JOIN device_types dt ON r.device_type_id = dt.id
          WHERE DATE(r.start_time) >= ? AND DATE(r.start_time) <= ?
            AND r.status IN ('pending', 'confirmed', 'active', 'completed')
          ORDER BY r.start_time
        `);
        const reservations = reservationsStmt.all(startDate, endDate) as any[];

        // 3. 기기 정보 조회 (device_id가 있는 예약들의 기기 정보)
        const deviceIds = reservations.filter(r => r.device_id).map(r => r.device_id);
        let devices: any[] = [];
        
        if (deviceIds.length > 0) {
          const placeholders = deviceIds.map(() => '?').join(',');
          const devicesStmt = db.prepare(`
            SELECT d.*, dt.name as device_type_name, dt.display_name as device_type_display_name,
                   dt.model_name, dt.version_name
            FROM devices d
            JOIN device_types dt ON d.device_type_id = dt.id
            WHERE d.id IN (${placeholders})
          `);
          devices = devicesStmt.all(...deviceIds) as any[];
        }

        // 기기 정보를 ID로 매핑하여 반환
        const devicesInfo = devices.reduce((acc: any, device: any) => {
          acc[device.id] = {
            id: device.id,
            device_number: device.position || device.name, // position을 device_number로 매핑
            device_types: {
              name: device.device_type_display_name || device.device_type_name,
              model_name: device.model_name,
              version_name: device.version_name
            }
          };
          return acc;
        }, {});

        return NextResponse.json({
          success: true,
          scheduleEvents,
          reservations,
          devices: Object.values(devicesInfo)
        });

      } catch (dbError) {
        console.error('Database query error:', dbError);
        return NextResponse.json({
          success: false,
          error: '데이터베이스 조회 중 오류가 발생했습니다',
          scheduleEvents: [],
          reservations: [],
          devices: []
        }, { status: 500 });
      }
    }

    // 단일 날짜 조회 모드 (기존 로직)
    if (!date) {
      return NextResponse.json({
        success: false,
        error: '날짜 매개변수가 필요합니다 (YYYY-MM-DD 형식) 또는 year, month 매개변수를 사용하세요'
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

    // 기기 타입 검증 (선택사항)
    if (deviceTypeId) {
      const deviceType = query.getDeviceTypeById(deviceTypeId);
      if (!deviceType) {
        return NextResponse.json({
          success: false,
          error: '해당 기기 타입을 찾을 수 없습니다'
        }, { status: 404 });
      }
    }

    // 해당 날짜의 스케줄 조회
    const schedule = query.getScheduleByDate(date, deviceTypeId || undefined);

    // 기기 타입별로 그룹화
    const scheduleByType = schedule.reduce((acc: any, reservation: any) => {
      const typeKey = reservation.device_type_id;
      if (!acc[typeKey]) {
        acc[typeKey] = {
          device_type_id: reservation.device_type_id,
          device_type_name: reservation.device_type_name,
          device_type_color: reservation.device_type_color,
          reservations: []
        };
      }
      acc[typeKey].reservations.push(reservation);
      return acc;
    }, {});

    // 배열로 변환
    const groupedSchedule = Object.values(scheduleByType);

    return NextResponse.json({
      success: true,
      date,
      deviceTypeId: deviceTypeId || null,
      schedule: groupedSchedule,
      totalReservations: schedule.length,
      filters: {
        date,
        deviceTypeId: deviceTypeId || 'all'
      }
    });
    
  } catch (error) {
    console.error('Schedule GET API error:', error);
    return NextResponse.json({
      success: false,
      error: '스케줄 조회에 실패했습니다',
      schedule: []
    }, { status: 500 });
  }
}