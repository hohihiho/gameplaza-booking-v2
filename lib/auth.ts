import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'

// 현재 사용자 세션 가져오기 (role 정보 포함)
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  
  // Supabase에서 role 정보 가져오기
  try {
    const supabaseAdmin = createAdminClient();
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email!)
      .single();
    
    if (userData) {
      return {
        ...session.user,
        id: userData.id,
        role: userData.role
      };
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
  }
  
  return session.user;
}

// API 라우트용 인증 미들웨어
type AuthHandler = (
  request: NextRequest,
  context: { user: any; [key: string]: any }
) => Promise<NextResponse> | NextResponse;

interface WithAuthOptions {
  requireAdmin?: boolean;
}

export function withAuth(
  handler: AuthHandler,
  options?: WithAuthOptions
): (request: NextRequest, context?: any) => Promise<NextResponse> {
  return async (request: NextRequest, context?: any) => {
    console.log('withAuth: Starting authentication check');
    console.log('withAuth: Options:', options);
    
    const session = await auth();
    console.log('withAuth: Session:', session ? { user: session.user } : null);
    
    if (!session?.user) {
      console.log('withAuth: No session or user found');
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 (옵션에 따라)
    if (options?.requireAdmin) {
      console.log('withAuth: Checking admin permissions');
      try {
        const supabaseAdmin = createAdminClient();
        console.log('withAuth: Looking for user with email:', session.user.email);
        
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', session.user.email!)
          .single();

        console.log('withAuth: User query result:', { userData, userError });

        if (userData?.id) {
          console.log('withAuth: Found user, checking admin status for user_id:', userData.id);
          
          const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('is_super_admin')
            .eq('user_id', userData.id)
            .single();

          console.log('withAuth: Admin query result:', { adminData, adminError });

          if (!adminData?.is_super_admin) {
            console.log('withAuth: Admin access denied - not super admin');
            return NextResponse.json(
              { error: '관리자 권한이 필요합니다' },
              { status: 403 }
            );
          }
          
          console.log('withAuth: Admin access granted');
        } else {
          console.log('withAuth: User not found in database');
          return NextResponse.json(
            { error: '사용자를 찾을 수 없습니다' },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error('withAuth: Error during admin check:', error);
        return NextResponse.json(
          { error: '인증 확인 중 오류가 발생했습니다' },
          { status: 500 }
        );
      }
    }
    
    console.log('withAuth: Authentication successful, calling handler');
    // 사용자 정보를 handler에 전달
    return handler(request, { ...context, user: session.user });
  };
}