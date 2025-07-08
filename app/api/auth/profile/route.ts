import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

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
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id, email, nickname, phone, phone_verified, role')
      .eq('email', session.user.email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 행이 없음
      console.error('프로필 조회 오류:', error);
      return NextResponse.json(
        { error: '프로필 조회 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 프로필이 없거나 불완전한 경우
    if (!profile || !profile.nickname || !profile.phone) {
      return NextResponse.json(
        { 
          exists: false,
          incomplete: true,
          profile: profile || null 
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ 
      exists: true,
      incomplete: false,
      profile 
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}