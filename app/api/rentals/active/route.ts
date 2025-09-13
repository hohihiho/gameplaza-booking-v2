import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDB(process.env);

    // Mock 데이터
    const rentals = [
      {
        id: 1,
        device_id: 2,
        user_name: '테스트 사용자',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        status: 'active'
      }
    ];

    return NextResponse.json({ data: rentals, error: null });
  } catch (error) {
    console.error('대여 목록 조회 오류:', error);
    return NextResponse.json(
      { data: null, error: '대여 목록을 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}
