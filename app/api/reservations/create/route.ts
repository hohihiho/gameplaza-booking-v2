// 예약 생성 API - Cloudflare D1 사용
import { NextRequest, NextResponse } from 'next/server';
import { getD1Database } from '@/lib/db/d1';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      device_type_id,
      device_id,
      date,
      start_time,
      end_time,
      rental_duration,
      total_amount
    } = body;

    // 필수 필드 검증
    if (!device_type_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const db = getD1Database();

    // 사용자 ID 조회
    const userResult = await db.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(session.user.email).first();

    if (!userResult) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userId = userResult.id;

    // 기기 가용성 확인 (device_id가 있는 경우)
    if (device_id) {
      const deviceCheck = await db.prepare(`
        SELECT id, status FROM devices 
        WHERE id = ? AND device_type_id = ?
      `).bind(device_id, device_type_id).first();

      if (!deviceCheck) {
        return NextResponse.json(
          { error: '해당 기기를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      if (deviceCheck.status !== 'available') {
        return NextResponse.json(
          { error: '해당 기기는 현재 사용할 수 없습니다.' },
          { status: 400 }
        );
      }
    } else {
      // device_id가 없으면 사용 가능한 기기 자동 할당
      const availableDevice = await db.prepare(`
        SELECT id FROM devices 
        WHERE device_type_id = ? AND status = 'available'
        ORDER BY device_number ASC
        LIMIT 1
      `).bind(device_type_id).first();

      if (!availableDevice) {
        return NextResponse.json(
          { error: '사용 가능한 기기가 없습니다.' },
          { status: 400 }
        );
      }

      body.device_id = availableDevice.id;
    }

    // 시간 충돌 검사
    const conflictCheck = await db.prepare(`
      SELECT id FROM reservations 
      WHERE device_id = ? 
      AND date = ? 
      AND status IN ('approved', 'checked_in')
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND start_time < ?)
      )
    `).bind(
      body.device_id, 
      date, 
      start_time, start_time,  // 시작 시간 겹침 확인
      end_time, end_time,      // 종료 시간 겹침 확인
      start_time, end_time     // 완전 포함 확인
    ).first();

    if (conflictCheck) {
      return NextResponse.json(
        { error: '해당 시간대에 이미 예약이 있습니다.' },
        { status: 409 }
      );
    }

    // 예약 생성
    const reservationId = crypto.randomUUID();
    const now = new Date().toISOString();

    const reservationData = {
      id: reservationId,
      user_id: userId,
      device_type_id,
      device_id: body.device_id,
      date,
      start_time,
      end_time,
      rental_duration: rental_duration || null,
      total_amount: total_amount || null,
      status: 'approved', // 기본 상태
      created_at: now,
      updated_at: now
    };

    await db.prepare(`
      INSERT INTO reservations (
        id, user_id, device_type_id, device_id, date, 
        start_time, end_time, rental_duration, total_amount, 
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      reservationId,
      userId,
      device_type_id,
      body.device_id,
      date,
      start_time,
      end_time,
      rental_duration || null,
      total_amount || null,
      'approved',
      now,
      now
    ).run();

    // 기기 상태 업데이트 (예약됨으로 변경)
    await db.prepare(`
      UPDATE devices 
      SET status = 'reserved', updated_at = ?
      WHERE id = ?
    `).bind(now, body.device_id).run();

    // 생성된 예약 정보 조회
    const newReservation = await db.prepare(`
      SELECT 
        r.*,
        u.name as user_name,
        dt.name as device_type_name,
        d.device_number
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN device_types dt ON r.device_type_id = dt.id
      LEFT JOIN devices d ON r.device_id = d.id
      WHERE r.id = ?
    `).bind(reservationId).first();

    return NextResponse.json({
      success: true,
      reservation: newReservation
    });

  } catch (error) {
    console.error('예약 생성 오류:', error);
    return NextResponse.json(
      { error: '예약을 생성할 수 없습니다.' },
      { status: 500 }
    );
  }
}