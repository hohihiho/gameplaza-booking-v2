import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Cloudflare D1 환경 체크
    const db = getDB(process.env);

    // Mock 데이터 반환 (개발 환경)
    const devices = [
      { id: 1, name: 'PS5 #1', type: 'PS5', status: 'available' },
      { id: 2, name: 'PS5 #2', type: 'PS5', status: 'in_use' },
      { id: 3, name: 'Switch #1', type: 'SWITCH', status: 'available' },
      { id: 4, name: 'PC #1', type: 'PC', status: 'maintenance' },
      { id: 5, name: 'Racing Sim', type: 'RACING', status: 'available' }
    ];

    return NextResponse.json({ data: devices, error: null });
  } catch (error) {
    console.error('기기 목록 조회 오류:', error);
    return NextResponse.json(
      { data: null, error: '기기 목록을 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDB(process.env);

    // Mock 응답
    return NextResponse.json({
      data: { id: Date.now(), ...body },
      error: null
    });
  } catch (error) {
    console.error('기기 생성 오류:', error);
    return NextResponse.json(
      { data: null, error: '기기를 생성할 수 없습니다' },
      { status: 500 }
    );
  }
}
