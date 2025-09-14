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

    // Return session with JWT data
    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0], // Use name from JWT or extract from email
        role: payload.role,
        image: payload.image || null, // Google profile image from JWT
        status: 'active'
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