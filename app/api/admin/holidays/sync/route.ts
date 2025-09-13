import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { HolidayService } from '@/lib/services/holiday.service';
import { createAdminClient } from '@/lib/db';

// POST /api/admin/holidays/sync - 공휴일 동기화
export async function POST(request: NextRequest) {
  console.log('=== 공휴일 동기화 API 호출됨 ===');
  
  try {
    // NextAuth 세션 확인
    const session = await auth();
    console.log('세션 확인:', session?.user?.email);
    
    if (!session?.user?.email) {
      console.log('세션 없음 - 401 반환');
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // Supabase Admin Client 사용
    const supabase = createAdminClient();
    
    // 사용자 ID 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();
    
    console.log('사용자 조회:', userData, userError);
    
    if (!userData) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 관리자인지 확인
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userData.id)
      .single();

    console.log('관리자 확인:', admin, adminError);

    if (!admin) {
      console.log('관리자 아님 - 403 반환');
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const year = body.year || new Date().getFullYear();

    console.log(`${year}년 공휴일 동기화 시작...`);
    const result = await HolidayService.syncHolidays(year);
    console.log('동기화 결과:', result);

    return NextResponse.json({
      message: '공휴일 동기화가 완료되었습니다',
      result,
      year
    });
  } catch (error) {
    console.error('공휴일 동기화 오류 상세:', error);
    return NextResponse.json(
      { error: '공휴일 동기화에 실패했습니다', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}