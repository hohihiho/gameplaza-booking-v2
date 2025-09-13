import { createAdminClient } from '@/lib/db';
import { NextResponse } from 'next/server';

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
    
    const supabase = createAdminClient();
    
    // 특별 영업시간 조회
    let scheduleEvents: any[] = [];
    try {
      const { data, error } = await supabase
        .from('schedule_events')
        .select('title, start_time, end_time, type')
        .eq('date', dateStr)
        .in('type', ['early_open', 'overnight', 'early_close']);
      
      if (error && error.code !== '42P01') { // 42P01: table does not exist
        throw error;
      }
      
      scheduleEvents = data || [];
    } catch (error: any) {
      if (error?.code !== '42P01') {
        console.error('일정 조회 오류:', error);
        return NextResponse.json({ error: '일정 조회에 실패했습니다' }, { status: 500 });
      }
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
    if (scheduleEvents.length > 0) {
      const floor1Events = scheduleEvents.filter((e: any) => e.title?.includes('1층'));
      const floor2Events = scheduleEvents.filter((e: any) => e.title?.includes('2층') || !e.title?.includes('층'));
      
      const floor1Event = floor1Events.find((e: any) => e.type === 'early_open') || 
                         floor1Events.find((e: any) => e.type === 'early_close' || e.type === 'overnight');
      
      const floor2EventOpen = floor2Events.find((e: any) => e.type === 'early_open');
      const floor2EventClose = floor2Events.find((e: any) => e.type === 'early_close' || e.type === 'overnight');
      
      const floor1Start = floor1Event?.type === 'early_open' 
        ? floor1Event?.start_time?.substring(0, 5) || defaultSchedule.floor1Start
        : defaultSchedule.floor1Start;
      const floor1End = floor1Event?.type === 'early_close' || floor1Event?.type === 'overnight'
        ? floor1Event?.end_time?.substring(0, 5) || defaultSchedule.floor1End
        : defaultSchedule.floor1End;
      
      const floor2Start = floor2EventOpen
        ? floor2EventOpen?.start_time?.substring(0, 5) || defaultSchedule.floor2Start
        : defaultSchedule.floor2Start;
      const floor2End = floor2EventClose
        ? floor2EventClose?.end_time?.substring(0, 5) || defaultSchedule.floor2End
        : defaultSchedule.floor2End;
      
      const result = {
        floor1Start,
        floor1End,
        floor2Start,
        floor2End,
        floor1EventType: floor1Event?.type || null,
        floor2EventType: floor2EventOpen?.type || floor2EventClose?.type || null,
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