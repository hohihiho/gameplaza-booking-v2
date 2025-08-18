// 수동 Supabase 연결 유지 API
// 비전공자 설명: GitHub Actions 결제 문제로 자동 실행이 안 될 때
// 관리자가 수동으로 Supabase 연결을 유지하기 위한 API입니다

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // 관리자 인증 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
    const { data: adminUserData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!adminUserData) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    const { data: adminData } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', adminUserData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: '관리자 권한이 없습니다' }, { status: 403 });
    }

    // Supabase 연결 유지를 위한 간단한 쿼리 실행
    const { data: devices, error } = await supabaseAdmin
      .from('devices')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase keepalive 쿼리 실패:', error);
      return NextResponse.json({ 
        error: 'Supabase 연결 실패', 
        details: error.message 
      }, { status: 500 });
    }

    // 현재 시간 기록
    const currentTime = new Date().toISOString();
    
    console.log(`✅ Supabase keepalive 성공 - ${currentTime}`);
    console.log(`📊 데이터베이스 응답: ${devices?.length || 0}개 기기 확인`);

    return NextResponse.json({
      success: true,
      message: 'Supabase 연결이 성공적으로 유지되었습니다',
      timestamp: currentTime,
      queryResult: `${devices?.length || 0}개 기기 확인됨`
    });

  } catch (error) {
    console.error('Supabase keepalive API 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET 요청도 지원 (브라우저에서 직접 접근 가능)
export async function GET(req: NextRequest) {
  return POST(req);
}