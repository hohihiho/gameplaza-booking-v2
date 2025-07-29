import { auth } from '@/auth';

import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const session = await auth();
  
  console.log('[check-admin] Session:', session);
  
  if (!session?.user?.email) {
    console.log('[check-admin] No session email');
    return Response.json({ isAdmin: false });
  }

  try {
    const supabase = createAdminClient();
    
    // 사용자 ID 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();
    
    console.log('[check-admin] User data:', userData, 'Error:', userError);
    
    if (!userData) {
      return Response.json({ isAdmin: false });
    }

    // 관리자 권한 확인
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();
    
    console.log('[check-admin] Admin data:', adminData, 'Error:', adminError);
    
    // 관리자 권한 확인 - admins 테이블에 있으면 관리자
    const isAdmin = !!adminData || userData.role === 'admin';
    
    console.log('[check-admin] Final result:', { isAdmin, role: userData.role, isSuperAdmin: adminData?.is_super_admin });
    
    return Response.json({ 
      isAdmin,
      userId: userData.id,
      role: userData.role,
      isSuperAdmin: adminData?.is_super_admin || false
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return Response.json({ isAdmin: false });
  }
}