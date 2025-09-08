// TODO: Better Auth 및 D1 데이터베이스 마이그레이션 중으로 임시 하드코딩
// import { createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // TODO: D1 데이터베이스 연결 후 실제 일정 조회로 변경
    const scheduleEvents: any[] = [];
    
    // 오늘의 영업시간 계산
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;
    const isSaturday = dayOfWeek === 6;
    
    // 기본 영업시간
    // 2층: 금요일, 토요일은 밤샘 영업(익일 05:00까지), 그 외는 24:00까지
    const defaultSchedule = {
      floor1Start: isWeekend ? '11:00' : '12:00',
      floor1End: '22:00',
      floor2Start: isWeekend ? '11:00' : '12:00',
      floor2End: (isFriday || isSaturday) ? '05:00' : '24:00',
      floor1EventType: null,
      floor2EventType: (isFriday || isSaturday) ? 'overnight' : null
    };
    
    // TODO: 특별 일정 처리는 추후 D1 데이터베이스 연결 후 구현
    
    const result = {
      ...defaultSchedule,
      date: dateStr,
      dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek],
      isWeekend
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}