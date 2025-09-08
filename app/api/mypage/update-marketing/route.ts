import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

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
    try {
      query.updateUserMarketingAgreement(session.user.email, marketing_agreed);
    } catch (error) {
      console.error('마케팅 동의 업데이트 오류:', error);
      return NextResponse.json(
        { error: '설정 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      marketing_agreed,
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