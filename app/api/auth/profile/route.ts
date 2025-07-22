import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }


    // 사용자 프로필 조회
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();
    

    // PGRST116: 행이 없음 (프로필이 없는 경우)
    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { 
          exists: false,
          incomplete: true,
          profile: null,
          isAdmin: false
        },
        { status: 200 }
      );
    }

    if (error) {
      console.error('프로필 조회 오류:', error);
      return NextResponse.json(
        { error: '프로필 조회 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 관리자 권한 확인
    let isAdmin = false;
    if (profile?.id) {
      const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('admins')
        .select('is_super_admin')
        .eq('user_id', profile.id)
        .single();
      
      isAdmin = !!adminData?.is_super_admin;
    }

    // 프로필이 불완전한 경우
    if (!profile.nickname || !profile.phone) {
      return NextResponse.json(
        { 
          exists: true,
          incomplete: true,
          profile: profile,
          isAdmin
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ 
      exists: true,
      incomplete: false,
      profile,
      isAdmin
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}