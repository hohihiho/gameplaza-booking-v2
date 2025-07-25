import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getToken } from 'next-auth/jwt';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 현재 세션 가져오기
    const session = await auth();
    const token = await getToken({ req: request });
    
    console.log('Current session:', session);
    console.log('Current token:', token);
    
    if (!session?.user) {
      return NextResponse.json({
        error: '로그인이 필요합니다',
        session: null,
        token: null
      }, { status: 401 });
    }
    
    // Supabase에서 사용자 정보 조회
    const supabaseAdmin = createAdminClient();
  const { data: userData, error: _userError } = await supabaseAdmin.from('users')
      .select('id, email, nickname')
      .eq('email', session.user.email)
      .single();
    
    console.log('User data from Supabase:', userData);
    
    // 관리자 권한 확인
    let adminData = null;
    if (userData) {
      
  const { data: adminResult, error: _adminError } = await supabaseAdmin.from('admins')
        .select('is_super_admin')
        .eq('user_id', userData.id)
        .single();
      
      adminData = adminResult;
      console.log('Admin data from Supabase:', adminData);
    }
    
    return NextResponse.json({
      session,
      token,
      userData,
      adminData,
      isAdmin: !!adminData?.is_super_admin,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({
      error: '세션 새로고침 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}