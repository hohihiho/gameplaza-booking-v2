import { NextRequest, NextResponse } from 'next/server';
import { HolidayService } from '@/lib/services/holiday.service';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/holidays - 공휴일 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year) {
      return NextResponse.json(
        { error: '연도가 필요합니다' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    
    let holidays;
    if (month) {
      const monthNum = parseInt(month);
      holidays = await HolidayService.getHolidaysForMonth(yearNum, monthNum);
    } else {
      holidays = await HolidayService.getHolidaysForYear(yearNum);
    }

    // 마지막 동기화 시간도 함께 반환
    const lastSyncTime = await HolidayService.getLastSyncTime();

    return NextResponse.json({
      holidays,
      lastSyncTime,
      count: holidays.length
    });
  } catch (error) {
    console.error('공휴일 조회 오류:', error);
    return NextResponse.json(
      { error: '공휴일 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}


// DELETE /api/admin/holidays/[id] - 공휴일 삭제 (별도 파일로 분리 필요)