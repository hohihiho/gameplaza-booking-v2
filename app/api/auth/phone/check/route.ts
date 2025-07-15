import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // 하이픈 제거
    const phoneNumbers = phone.replace(/-/g, '');

    // 전화번호 중복 체크
    const { data: existingUser, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phoneNumbers)
      .neq('email', session.user.email) // 자기 자신 제외
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 결과 없음
      console.error('전화번호 중복 체크 오류:', error);
      return NextResponse.json(
        { error: '전화번호 확인 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json({ 
        available: false,
        message: '이미 사용 중인 전화번호입니다'
      });
    }

    return NextResponse.json({ 
      available: true,
      message: '사용 가능한 전화번호입니다'
    });
  } catch (error) {
    console.error('Phone check error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}