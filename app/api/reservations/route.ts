// 예약 조회 API - Cloudflare D1 사용
import { NextRequest, NextResponse } from 'next/server';
import { getD1Database } from '@/lib/db/d1';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
        { status: 401 }
      );
    }

    const db = getD1Database();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    // 기본 쿼리
    let query = `
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email,
        dt.name as device_type_name,
        d.device_number,
        dc.name as category_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN device_types dt ON r.device_type_id = dt.id
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN device_categories dc ON dt.category_id = dc.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // 필터 조건 추가
    if (userId) {
      query += ` AND r.user_id = ?${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      query += ` AND r.status = ?${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (date) {
      query += ` AND r.date = ?${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    // 최신순 정렬
    query += ` ORDER BY r.created_at DESC LIMIT 100`;

    const statement = db.prepare(query);
    const result = await statement.bind(...params).all();

    return NextResponse.json({
      reservations: result.results || []
    });

  } catch (error) {
    console.error('예약 조회 오류:', error);
    return NextResponse.json(
      { error: '예약 정보를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}