import { NextRequest, NextResponse } from 'next/server';

// TODO: D1 데이터베이스로 마이그레이션 필요
// 임시로 비활성화 - Supabase 의존성 제거 중

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: '이 기능은 현재 데이터베이스 마이그레이션 중입니다.',
      message: 'Cloudflare D1으로 전환 작업 진행 중'
    },
    { status: 503 }
  );
}

/* 원본 코드 - D1 마이그레이션 후 수정 필요
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { marketing_agreed } = body;

    if (typeof marketing_agreed !== 'boolean') {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    // users 테이블의 marketing_agreed 필드 업데이트
    const { data, error } = await supabase
      .from('users')
      .update({ 
        marketing_agreed,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select('marketing_agreed')
      .single();

    if (error) {
      console.error('마케팅 동의 업데이트 오류:', error);
      return NextResponse.json(
        { error: '설정 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      marketing_agreed: data.marketing_agreed,
      message: marketing_agreed 
        ? '이벤트 및 혜택 정보 수신에 동의하였습니다.' 
        : '이벤트 및 혜택 정보 수신을 거절하였습니다.'
    });

  } catch (error) {
    console.error('마케팅 동의 업데이트 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
*/