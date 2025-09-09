import { NextRequest, NextResponse } from 'next/server';
import { D1RepositoryFactory, getD1Database } from '@/lib/repositories/d1';
import { z } from 'zod';

// 요청 스키마 정의
const createReservationSchema = z.object({
  user_id: z.string().uuid('올바른 사용자 ID 형식이 아닙니다'),
  device_id: z.string().uuid('올바른 기기 ID 형식이 아닙니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, '올바른 시간 형식(HH:MM)을 입력해주세요'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, '올바른 시간 형식(HH:MM)을 입력해주세요'),
  units: z.number().int().min(1).max(4).optional(),
  amount: z.number().min(0).optional(),
  notes: z.string().optional()
});

// GET /api/v2/reservations - 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    const searchParams = request.nextUrl.searchParams;
    
    const userId = searchParams.get('user_id');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    let reservations;
    
    if (userId) {
      // 사용자별 예약 조회
      reservations = await repos.reservations.findByUser(userId, limit);
    } else if (date) {
      // 날짜별 예약 조회
      reservations = await repos.reservations.findByDate(date);
    } else if (status) {
      // 상태별 예약 조회
      reservations = await repos.reservations.findByStatus(status, limit);
    } else {
      // 최근 예약 조회
      reservations = await repos.reservations.findAll(limit);
    }

    // 상세 정보 포함 옵션
    if (searchParams.get('include_details') === 'true') {
      const detailedReservations = await Promise.all(
        reservations.map(async (reservation) => {
          const details = await repos.reservations.findWithDetails(reservation.id);
          return details || reservation;
        })
      );
      reservations = detailedReservations;
    }

    return NextResponse.json({
      success: true,
      data: reservations,
      count: reservations.length
    });

  } catch (error) {
    console.error('예약 조회 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reservations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/v2/reservations - 새 예약 생성
export async function POST(request: NextRequest) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // 요청 데이터 검증
    const validationResult = createReservationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const repos = new D1RepositoryFactory(db);
    
    // 사용자 존재 확인
    const user = await repos.users.findById(data.user_id);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 블랙리스트 사용자 확인
    if (user.is_blacklisted) {
      return NextResponse.json(
        { error: '예약이 제한된 사용자입니다.' },
        { status: 403 }
      );
    }

    // 시간 충돌 확인
    const hasConflict = await repos.reservations.checkTimeConflict(
      data.device_id,
      data.date,
      data.start_time,
      data.end_time
    );

    if (hasConflict) {
      return NextResponse.json(
        { error: '해당 시간에 이미 예약이 있습니다.' },
        { status: 409 }
      );
    }

    // 사용자 활성 예약 수 확인 (최대 3개)
    const activeReservations = await repos.reservations.countActiveReservations(data.user_id);
    if (activeReservations >= 3) {
      return NextResponse.json(
        { error: '활성 예약은 최대 3개까지만 가능합니다.' },
        { status: 400 }
      );
    }

    // 기기 존재 및 상태 확인
    const device = await repos.devices.findById(data.device_id);
    if (!device) {
      return NextResponse.json(
        { error: '기기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (device.status === 'maintenance') {
      return NextResponse.json(
        { error: '점검 중인 기기는 예약할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 예약 생성
    const reservation = await repos.reservations.createReservation({
      user_id: data.user_id,
      device_id: data.device_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      units: data.units || 1,
      amount: data.amount || 0,
      notes: data.notes
    });

    // 예약 상세 정보 조회
    const reservationWithDetails = await repos.reservations.findWithDetails(reservation.id);

    return NextResponse.json({
      success: true,
      data: reservationWithDetails || reservation,
      message: '예약이 성공적으로 생성되었습니다.'
    }, { status: 201 });

  } catch (error) {
    console.error('예약 생성 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create reservation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/reservations - 예약 일괄 업데이트 (관리자용)
export async function PATCH(request: NextRequest) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, reservation_ids } = body;

    if (!action || !reservation_ids || !Array.isArray(reservation_ids)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    const results = [];

    for (const id of reservation_ids) {
      try {
        switch (action) {
          case 'confirm':
            await repos.reservations.updateStatus(id, 'confirmed');
            break;
          case 'cancel':
            await repos.reservations.cancel(id, '관리자 일괄 취소');
            break;
          case 'complete':
            await repos.reservations.updateStatus(id, 'completed');
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push({ id, success: true });
      } catch (error) {
        results.push({ 
          id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `${results.filter(r => r.success).length}개 예약이 업데이트되었습니다.`
    });

  } catch (error) {
    console.error('예약 일괄 업데이트 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update reservations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}