import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
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

    // 사용자 정보 업데이트
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        nickname,
        phone: phone.replace(/-/g, ''), // 하이픈 제거
        phone_verified: true, // 실제로는 인증 후 true로 변경
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email!)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user:', error);
      return NextResponse.json(
        { error: '회원가입 처리 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}