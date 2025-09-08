import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { scheduleEvents } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// 메모리 캐시 (10분 캐시)
let scheduleCache: {
  data: any;
  timestamp: number;
  dateStr: string;
} | null = null;

const CACHE_DURATION = 10 * 60 * 1000; // 10분

export async function GET() {
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // 캐시 확인 (같은 날짜이고 10분 이내)
    if (scheduleCache && 
        scheduleCache.dateStr === dateStr && 
        Date.now() - scheduleCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(scheduleCache.data);
    }
    
    // 특별 영업시간 조회
    let scheduleEventsList: any[] = [];
    try {
      scheduleEventsList = await db
        .select({
          title: scheduleEvents.title,
          eventType: scheduleEvents.eventType,
          description: scheduleEvents.description
        })
        .from(scheduleEvents)
        .where(
          and(
            eq(scheduleEvents.date, dateStr),
            inArray(scheduleEvents.eventType, ['early_open', 'all_night', 'early_close'])
          )
        );
      
    } catch (error: any) {
      console.error('일정 조회 오류:', error);
      // 테이블이 없거나 오류가 발생해도 기본 스케줄을 반환하도록 함
      scheduleEventsList = [];
    }
    
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
    
    // 특별 일정이 있으면 반영
    if (scheduleEventsList.length > 0) {
      const floor1Events = scheduleEventsList.filter((e: any) => e.title?.includes('1층'));
      const floor2Events = scheduleEventsList.filter((e: any) => e.title?.includes('2층') || !e.title?.includes('층'));
      
      const floor1Event = floor1Events.find((e: any) => e.eventType === 'early_open') || 
                         floor1Events.find((e: any) => e.eventType === 'early_close' || e.eventType === 'all_night');
      
      const floor2EventOpen = floor2Events.find((e: any) => e.eventType === 'early_open');
      const floor2EventClose = floor2Events.find((e: any) => e.eventType === 'early_close' || e.eventType === 'all_night');
      
      const result = {
        ...defaultSchedule,
        floor1EventType: floor1Event?.eventType || null,
        floor2EventType: floor2EventOpen?.eventType || floor2EventClose?.eventType || null,
        date: dateStr,
        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek],
        isWeekend,
        hasSpecialEvents: true,
        events: scheduleEventsList
      };
      
      // 결과를 캐시에 저장
      scheduleCache = {
        data: result,
        timestamp: Date.now(),
        dateStr
      };
      
      return NextResponse.json(result);
    }
    
    const result = {
      ...defaultSchedule,
      date: dateStr,
      dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek],
      isWeekend
    };
    
    // 결과를 캐시에 저장
    scheduleCache = {
      data: result,
      timestamp: Date.now(),
      dateStr
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}