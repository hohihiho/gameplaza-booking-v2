import { auth } from '@/auth';

import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return Response.json({ error: 'No session' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    
    // 사용자 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)  
      .single();
    
    if (!userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // 관리자 정보 조회
    const { data: adminData } = await supabase
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();
    
    const isAdmin = !!adminData || userData.role === 'admin';
    
    // 세션 업데이트를 위한 정보 반환
    return Response.json({ 
      success: true,
      isAdmin,
      userData,
      adminData,
      message: '로그아웃 후 다시 로그인하면 관리자 권한이 적용됩니다.'
    });
  } catch (error) {
    console.error('Fix session error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}