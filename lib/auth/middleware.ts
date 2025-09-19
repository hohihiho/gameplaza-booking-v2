import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/db/dummy-client'; // 임시 더미 클라이언트
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { isSuperAdminOnlyPath } from './superadmin';
import { auth } from "@/lib/auth/server";

// Supabase 토큰 확인
async function getSupabaseUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    }
  );

  try {
    // TODO: getDb() 사용 - auth.getUser();
    const { data: { user }, error } = { data: { user: null }, error: new Error('Not implemented') };
    if (error || !user) return null;
    
    return {
      email: user.email,
      id: user.id,
      phone: user.phone,
      metadata: user.user_metadata
    };
  } catch {
    return null;
  }
}

// 보호된 경로 정의
const protectedPaths = {
  user: [
    // 임시로 모든 사용자 페이지 보호 해제
    // '/mypage'
    // '/reservations/new',
    // '/reservations'
  ],
  admin: [
    '/admin',
    '/api/admin'
  ]
};

// 제외할 경로
const excludedPaths = [
  '/reservations/complete',
  '/api/auth',
  '/login',
  '/signup',
  '/api/reservations', // 임시로 예약 API 제외 (하위 경로 포함)
  '/reservations', // 임시로 예약 페이지 제외
  '/reservations/new' // 임시로 예약 생성 페이지 제외
];

/**
 * 경로가 보호되어야 하는지 확인
 */
function isProtectedPath(pathname: string): { protected: boolean; requireAdmin: boolean } {
  // 제외된 경로 확인
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return { protected: false, requireAdmin: false };
  }
  
  // 관리자 경로 확인
  if (protectedPaths.admin.some(path => pathname.startsWith(path))) {
    return { protected: true, requireAdmin: true };
  }
  
  // 일반 사용자 경로 확인
  if (protectedPaths.user.some(path => pathname.startsWith(path))) {
    return { protected: true, requireAdmin: false };
  }
  
  return { protected: false, requireAdmin: false };
}

/**
 * 관리자 권한 확인 (캐시 사용)
 */
interface AdminStatus {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  timestamp: number;
}

const adminCheckCache = new Map<string, AdminStatus>();
const CACHE_TTL = 60 * 1000; // 1분

async function checkAdminStatus(email: string): Promise<{ isAdmin: boolean; isSuperAdmin: boolean }> {
  // 캐시 확인 (일시적으로 비활성화)
  // const cached = adminCheckCache.get(email);
  // if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
  //   return { isAdmin: cached.isAdmin, isSuperAdmin: cached.isSuperAdmin };
  // }
  
  try {
    
    // 사용자 조회
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.log('[checkAdminStatus] User not found:', email, userError);
      adminCheckCache.set(email, { isAdmin: false, isSuperAdmin: false, timestamp: Date.now() });
      return { isAdmin: false, isSuperAdmin: false };
    }
    
    console.log('[checkAdminStatus] User found:', userData);
    
    // admins 테이블에서 관리자 정보 확인 (role에 관계없이)
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();
    
    console.log('[checkAdminStatus] Admin data:', adminData, 'Error:', adminError);
    
    if (adminData) {
      // admins 테이블에 레코드가 있으면 관리자
      const isSuperAdmin = adminData.is_super_admin || false;
      adminCheckCache.set(email, { isAdmin: true, isSuperAdmin, timestamp: Date.now() });
      return { isAdmin: true, isSuperAdmin };
    }
    
    // 역할로도 확인 (하위 호환성)
    if (userData.role === 'superadmin' || userData.role === 'admin') {
      adminCheckCache.set(email, { isAdmin: true, isSuperAdmin: userData.role === 'superadmin', timestamp: Date.now() });
      return { isAdmin: true, isSuperAdmin: userData.role === 'superadmin' };
    }
    
    // 일반 사용자
    adminCheckCache.set(email, { isAdmin: false, isSuperAdmin: false, timestamp: Date.now() });
    return { isAdmin: false, isSuperAdmin: false };
  } catch (error) {
    console.error('Admin check error:', error);
    return { isAdmin: false, isSuperAdmin: false };
  }
}

/**
 * 인증 미들웨어
 */
export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { protected: isProtected, requireAdmin } = isProtectedPath(pathname);
  
  // 보호되지 않은 경로는 통과
  if (!isProtected) {
    return NextResponse.next();
  }
  
  // Supabase 사용자 확인
  const user = await getSupabaseUser(request);
  
  // 인증되지 않은 경우
  if (!user?.email) {
    // API 요청인 경우 401 반환
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    // 페이지 요청인 경우 로그인 페이지로 리다이렉트
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // 관리자 권한이 필요한 경우
  let adminStatus = { isAdmin: false, isSuperAdmin: false };
  
  if (requireAdmin) {
    adminStatus = await checkAdminStatus(user.email);
    
    if (!adminStatus.isAdmin) {
      // API 요청인 경우 403 반환
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      
      // 페이지 요청인 경우 홈으로 리다이렉트
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // 슈퍼관리자 전용 경로 확인
    if (isSuperAdminOnlyPath(pathname) && !adminStatus.isSuperAdmin) {
      // API 요청인 경우 403 반환
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: '슈퍼관리자 권한이 필요합니다', code: 'FORBIDDEN_SUPERADMIN' },
          { status: 403 }
        );
      }
      
      // 페이지 요청인 경우 관리자 홈으로 리다이렉트
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }
  
  // 인증 정보를 헤더에 추가
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-email', user.email);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-phone', user.phone || '');
  requestHeaders.set('x-is-admin', adminStatus.isAdmin.toString());
  requestHeaders.set('x-is-superadmin', adminStatus.isSuperAdmin.toString());
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * 캐시 정리 함수 (주기적으로 호출)
 */
export function clearAdminCache() {
  const now = Date.now();
  for (const [email, data] of adminCheckCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      adminCheckCache.delete(email);
    }
  }
}

/**
 * API 라우트용 인증 래퍼
 */
export function withAuth(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options?: { requireAdmin?: boolean; requireSuperAdmin?: boolean }
) {
  return async (req: NextRequest, context?: any) => {
    console.log('[withAuth] Starting authentication check');
    console.log('[withAuth] Options:', options);
    
    // NextAuth 세션 확인
    const user = await getCurrentUser();
    console.log('[withAuth] Session:', session);
    
    // 인증되지 않은 경우
    if (!session?.user?.email) {
      console.log('[withAuth] No session or email found');
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    console.log('[withAuth] User email:', session.user.email);
    
    // 관리자 권한이 필요한 경우
    if (options?.requireAdmin || options?.requireSuperAdmin) {
      console.log('[withAuth] Checking admin status for:', session.user.email);
      const adminStatus = await checkAdminStatus(session.user.email);
      console.log('[withAuth] Admin status:', adminStatus);
      
      if (!adminStatus.isAdmin) {
        console.log('[withAuth] User is not admin');
        return NextResponse.json(
          { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      
      // 슈퍼관리자 권한이 필요한 경우
      if (options?.requireSuperAdmin && !adminStatus.isSuperAdmin) {
        return NextResponse.json(
          { error: 'Forbidden - Super admin access required', code: 'FORBIDDEN_SUPERADMIN' },
          { status: 403 }
        );
      }
    }
    
    // 인증된 요청 처리
    console.log('[withAuth] Authentication successful, calling handler');
    return handler(req, context);
  };
}