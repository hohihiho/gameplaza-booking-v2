import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

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
    const { nickname, phone, agreeMarketing } = body;

    console.log('회원가입 요청:', { nickname, phone, agreeMarketing });

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임을 입력해주세요' },
        { status: 400 }
      );
    }

    // 전화번호가 입력된 경우에만 형식 검증
    if (phone && phone.length > 0 && phone.replace(/-/g, '').length < 10) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식을 입력해주세요' },
        { status: 400 }
      );
    }

    // 먼저 기본 정보만 업데이트
    const updateData: any = {
      nickname,
      phone: phone ? phone.replace(/-/g, '') : null, // 전화번호가 있으면 하이픈 제거, 없으면 null
      updated_at: new Date().toISOString()
    };

    // marketing_agreed 컬럼이 있으면 추가 (없을 수도 있음)
    try {
      // 컬럼 존재 여부 확인을 위해 먼저 조회
      const supabaseAdmin = createAdminClient();
  const { data: data, error: error } = await supabaseAdmin.from('users')
        .select('*')
        .eq('email', session.user.email!)
        .single();
      
      if (userCheck && 'marketing_agreed' in userCheck) {
        updateData.marketing_agreed = agreeMarketing || false;
        updateData.marketing_agreed_at = agreeMarketing ? new Date().toISOString() : null;
      }
    } catch (e) {
      // 컬럼이 없어도 계속 진행
      console.log('marketing_agreed 컬럼이 없습니다. 기본 정보만 업데이트합니다.');
    }

    // 사용자 정보 업데이트
    
  const { data: data, error: error } = await supabaseAdmin.from('users')
      .update(updateData)
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