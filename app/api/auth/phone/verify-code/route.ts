import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { idToken, phone } = await request.json();

    if (!idToken || !phone) {
      return NextResponse.json(
        { error: '인증 토큰과 전화번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // Firebase ID 토큰 검증
    const verifyResult = await verifyIdToken(idToken);
    
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || '인증에 실패했습니다' },
        { status: 400 }
      );
    }

    // 전화번호 일치 확인
    const phoneNumber = phone.replace(/-/g, '');
    const expectedPhone = '+82' + phoneNumber.substring(1);
    
    if (verifyResult.phoneNumber !== expectedPhone) {
      return NextResponse.json(
        { error: '전화번호가 일치하지 않습니다' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: '전화번호 인증이 완료되었습니다',
      firebaseUid: verifyResult.uid
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}