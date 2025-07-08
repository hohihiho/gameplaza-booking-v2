import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

// 관리자 권한 확인 API
export async function GET() {
  try {
    // NextAuth 세션 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        isAdmin: false, 
        role: null,
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Supabase에서 사용자 찾기
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
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
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin, permissions')
      .eq('user_id', userData.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ 
        isAdmin: false, 
        role: null 
      });
    }

    return NextResponse.json({ 
      isAdmin: true, 
      role: adminData.is_super_admin ? 'super_admin' : 'admin',
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