import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * NextAuth 미들웨어를 확장하여 관리자 권한 정보를 헤더에 추가
 */
export async function withAuthHeaders(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  try {
    // JWT 토큰에서 사용자 정보 가져오기
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token || !token.email) {
      return response;
    }

    // 슈퍼관리자 권한 확인
    const supabaseAdmin = createAdminClient();
    
    // 사용자 ID 가져오기
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', token.email as string)
      .single();

    if (!userData) {
      return response;
    }

    // 관리자 정보 확인
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    // 헤더 설정
    const headers = new Headers(response.headers);
    headers.set('x-user-id', userData.id);
    headers.set('x-user-email', token.email as string);
    
    if (adminData) {
      headers.set('x-is-admin', 'true');
      headers.set('x-is-superadmin', adminData.is_super_admin ? 'true' : 'false');
    } else {
      headers.set('x-is-admin', 'false');
      headers.set('x-is-superadmin', 'false');
    }

    // 새로운 응답 객체 생성
    const newResponse = NextResponse.next({
      request: {
        headers: headers,
      },
    });

    // 기존 응답의 쿠키 복사
    response.cookies.getAll().forEach((cookie) => {
      newResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return newResponse;

  } catch (error) {
    console.error('Auth headers error:', error);
    return response;
  }
}