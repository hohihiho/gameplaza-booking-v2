import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { isSuperAdminOnlyPath } from './superadmin';

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
    const { data: { user }, error } = await supabase.auth.getUser();
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
    '/mypage',
    '/reservations/new',
    '/reservations'
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
  '/signup'
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
  // 캐시 확인
  const cached = adminCheckCache.get(email);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { isAdmin: cached.isAdmin, isSuperAdmin: cached.isSuperAdmin };
  }
  
  try {
    const supabaseAdmin = createAdminClient();
    
    // 사용자 조회
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single();
    
    if (!userData) {
      adminCheckCache.set(email, { isAdmin: false, isSuperAdmin: false, timestamp: Date.now() });
      return { isAdmin: false, isSuperAdmin: false };
    }
    
    // 역할로 먼저 확인
    if (userData.role === 'superadmin') {
      adminCheckCache.set(email, { isAdmin: true, isSuperAdmin: true, timestamp: Date.now() });
      return { isAdmin: true, isSuperAdmin: true };
    }
    
    if (userData.role === 'admin') {
      // admins 테이블에서 추가 정보 확인
      const { data: adminData } = await supabaseAdmin
        .from('admins')
        .select('isSuperAdmin')
        .eq('userId', userData.id)
        .single();
      
      const isSuperAdmin = adminData?.isSuperAdmin || false;
      adminCheckCache.set(email, { isAdmin: true, isSuperAdmin, timestamp: Date.now() });
      return { isAdmin: true, isSuperAdmin };
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