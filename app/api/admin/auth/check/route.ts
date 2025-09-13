import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, validateSession, isAdmin, isSuperAdmin } from '@/lib/auth';

// 관리자 권한 확인 API
export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 세션 확인
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({
        isAdmin: false,
        role: null,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session?.user) {
      return NextResponse.json({
        isAdmin: false,
        role: null,
        error: 'Invalid session'
      }, { status: 401 });
    }

    const userIsAdmin = isAdmin(session.user);
    const userIsSuperAdmin = isSuperAdmin(session.user);

    // ndz5496@gmail.com은 항상 슈퍼관리자로 처리
    const finalIsSuperAdmin = session.user.email === 'ndz5496@gmail.com' || userIsSuperAdmin;

    return NextResponse.json({
      isAdmin: userIsAdmin || finalIsSuperAdmin,
      role: finalIsSuperAdmin ? 'super_admin' : (userIsAdmin ? 'admin' : 'user'),
      email: session.user.email
    });

  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({
      isAdmin: false,
      role: null,
      error: 'Internal server error'
    }, { status: 500 });
  }
}