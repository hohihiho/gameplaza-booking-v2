import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 토큰 가져오기
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json(
        { user: null, expires: null },
        { status: 200 }
      );
    }

    // 토큰 검증
    const payload = verifyToken(token.value);

    if (!payload) {
      return NextResponse.json(
        { user: null, expires: null },
        { status: 200 }
      );
    }

    // 세션 정보 반환
    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      },
      expires: new Date(payload.exp * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}