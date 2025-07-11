import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: '전화번호와 인증 코드를 입력해주세요' },
        { status: 400 }
      );
    }

    // 현재는 Firebase 클라이언트에서 인증을 처리하므로
    // 여기서는 성공 응답만 반환
    // TODO: 실제 Firebase Admin SDK를 사용한 서버 사이드 검증 구현
    
    try {
      // 전화번호 형식 표준화 (하이픈 제거)
      // const phoneNumber = phone.replace(/[\+\-]/g, '');
      
      // 임시로 성공 응답 반환
      // 실제로는 Firebase Admin SDK를 사용하여 검증해야 함

      return NextResponse.json({ 
        success: true,
        message: '전화번호 인증이 완료되었습니다'
      });
    } catch (error: any) {
      console.error('인증 처리 오류:', error);
      return NextResponse.json(
        { error: '인증 처리 중 오류가 발생했습니다' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}