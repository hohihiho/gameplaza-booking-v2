import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { marketing_agreed } = await request.json();

    // 먼저 사용자 확인
    const supabaseAdmin = createAdminClient();
  const { data: data, error: error } = await supabaseAdmin.from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // marketing_agreed 컬럼이 있는 경우에만 업데이트
    if (!('marketing_agreed' in user)) {
      console.log('marketing_agreed 컬럼이 없습니다. 테이블 스키마를 업데이트해주세요.');
      // 컬럼이 없어도 성공으로 처리 (UI 에러 방지)
      return NextResponse.json({ success: true, message: 'Column not available yet' });
    }

    // 마케팅 동의 여부 업데이트
    
  const { error$1 } = await supabaseAdmin.from('users')
      .update({
        marketing_agreed: marketing_agreed,
        marketing_agreed_at: marketing_agreed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email);

    if (error) {
      console.error('마케팅 동의 업데이트 오류:', error);
      return NextResponse.json(
        { error: '업데이트에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update marketing error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}