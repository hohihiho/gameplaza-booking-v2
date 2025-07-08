import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname, phone } = body;

    if (!nickname || !phone) {
      return NextResponse.json(
        { error: '닉네임과 전화번호를 모두 입력해주세요' },
        { status: 400 }
      );
    }

    // 프로필 업데이트
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        nickname,
        phone: phone.replace(/-/g, ''), // 하이픈 제거
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select()
      .single();

    if (error) {
      console.error('프로필 업데이트 오류:', error);
      return NextResponse.json(
        { error: '프로필 수정에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      user: data,
      message: '프로필이 수정되었습니다'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}