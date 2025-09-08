import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    if (!year || !month) {
      return NextResponse.json({ error: '년월 정보가 필요합니다' }, { status: 400 });
    }
    
    // 임시 데이터 - 추후 Cloudflare D1으로 이관 예정
    const scheduleEventsData: any[] = [];
    const reservationsData: any[] = [];
    const devicesData: any[] = [];
    
    return NextResponse.json({
      scheduleEvents: scheduleEventsData,
      reservations: reservationsData,
      devices: devicesData
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}