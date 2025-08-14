import { NextRequest, NextResponse } from 'next/server';
import { HolidayService } from '@/lib/services/holiday.service';

// GET /api/admin/holidays/check-new - 새로운 공휴일 확인
export async function GET(request: NextRequest) {
  try {
    const newHolidays = await HolidayService.checkNewHolidays();

    return NextResponse.json({
      newHolidays,
      count: newHolidays.length,
      hasNew: newHolidays.length > 0
    });
  } catch (error) {
    console.error('새 공휴일 확인 오류:', error);
    return NextResponse.json(
      { error: '새 공휴일 확인에 실패했습니다' },
      { status: 500 }
    );
  }
}