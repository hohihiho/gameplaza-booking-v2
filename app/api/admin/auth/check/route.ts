import { NextResponse } from 'next/server';
import { auth } from '@/auth';

import { createAdminClient } from '@/lib/supabase';

// 관리자 권한 확인 API
export async function GET() {
  try {
    // NextAuth 세션 확인
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        isAdmin: false, 
        role: null,
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Supabase에서 사용자 찾기
    const supabaseAdmin = createAdminClient();
    const { data: userData, error: userError } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ 
        isAdmin: false, 
        role: null,
        error: 'User not found' 
      });
    }

    // 관리자 권한 확인
    
    const { data: adminData, error: adminError } = await supabaseAdmin.from('admins')
      .select('is_super_admin, permissions')
      .eq('user_id', userData.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ 
        isAdmin: false, 
        role: null 
      });
    }

    // ndz5496@gmail.com은 항상 슈퍼관리자로 처리
    const isSuperAdmin = session.user.email === 'ndz5496@gmail.com' || adminData.is_super_admin;
    
    return NextResponse.json({ 
      isAdmin: true, 
      role: isSuperAdmin ? 'super_admin' : 'admin',
      email: session.user.email
    });

  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ 
      isAdmin: false, 
      role: null,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}