import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { authMiddleware as v2AuthMiddleware } from '@/src/infrastructure/middleware/auth.middleware';

/**
 * 통합 미들웨어
 * - 인증 처리
 * - v2 API canary 배포 라우팅
 * - v2 API 인증 처리
 */

interface CanaryConfig {
  enabled: boolean;
  percentage: number;
  deploymentUrl?: string;
  excludePatterns?: string[];
}

// 트래픽 라우팅 결정을 위한 쿠키/헤더
const CANARY_COOKIE = 'x-api-version';
const CANARY_HEADER = 'x-api-version';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // v2 API 인증 처리
  if (pathname.startsWith('/api/v2/auth/')) {
    // Google 로그인과 토큰 갱신은 인증 불필요
    if (pathname === '/api/v2/auth/google' || pathname === '/api/v2/auth/refresh') {
      return NextResponse.next();
    }
    
    // 프로필 조회와 로그아웃은 인증 필요
    if (pathname === '/api/v2/auth/profile' || pathname === '/api/v2/auth/logout') {
      const authMiddlewareInstance = v2AuthMiddleware.middleware({ requireAuth: true });
      return authMiddlewareInstance(request);
    }
  }
  
  // v2 예약 관리 API 인증 처리
  if (pathname.startsWith('/api/v2/reservations/')) {
    // 예약 승인/거절/노쇼는 관리자 권한 필요
    if (pathname.endsWith('/approve') || pathname.endsWith('/reject') || pathname.endsWith('/no-show')) {
      const authMiddlewareInstance = v2AuthMiddleware.middleware({ 
        requireAuth: true,
        requireRoles: ['admin'] 
      });
      return authMiddlewareInstance(request);
    }
  }
  
  // v2 체크인 API 인증 처리
  if (pathname.startsWith('/api/v2/check-ins/')) {
    // 모든 체크인 관련 작업은 관리자 권한 필요
    const authMiddlewareInstance = v2AuthMiddleware.middleware({ 
      requireAuth: true,
      requireRoles: ['admin'] 
    });
    return authMiddlewareInstance(request);
  }
  
  // v2 기기 관리 API 인증 처리
  if (pathname.startsWith('/api/v2/devices/')) {
    // GET 요청은 인증 불필요, 나머지는 관리자 권한 필요
    if (request.method !== 'GET') {
      const authMiddlewareInstance = v2AuthMiddleware.middleware({ 
        requireAuth: true,
        requireRoles: ['admin'] 
      });
      return authMiddlewareInstance(request);
    }
  }
  
  // API v2 canary 라우팅 처리
  if (pathname.startsWith('/api/') && !pathname.includes('/api/v2/')) {
    const canaryResponse = await handleCanaryRouting(request);
    if (canaryResponse) return canaryResponse;
  }
  
  // 기존 인증 미들웨어 실행
  return authMiddleware(request);
}

/**
 * Canary 배포 라우팅 처리
 */
async function handleCanaryRouting(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // 헬스체크는 항상 패스
  if (pathname.match(/\/api\/.*\/health/)) {
    return null;
  }

  try {
    // 임시로 canary 설정을 환경 변수로 처리
    const canaryEnabled = process.env.NEXT_PUBLIC_CANARY_ENABLED === 'true';
    const canaryPercentage = parseInt(process.env.NEXT_PUBLIC_CANARY_PERCENTAGE || '0', 10);
    
    if (!canaryEnabled || canaryPercentage === 0) {
      return null; // Canary 비활성화 시 기본 라우팅
    }
    
    const canaryConfig: CanaryConfig = {
      enabled: canaryEnabled,
      percentage: canaryPercentage
    };

    // 사용자가 특정 버전을 강제로 선택한 경우
    const forcedVersion = request.cookies.get(CANARY_COOKIE)?.value || 
                         request.headers.get(CANARY_HEADER);
    
    if (forcedVersion === 'v2') {
      return routeToV2(request);
    } else if (forcedVersion === 'v1') {
      return null; // v1 강제 시 기본 라우팅
    }

    // Canary 트래픽 결정
    if (shouldRouteToCanary(request, canaryConfig)) {
      return routeToV2(request);
    }
  } catch (error) {
    console.error('Canary routing error:', error);
  }

  return null; // 기본 라우팅
}

/**
 * Canary 라우팅 여부 결정
 */
function shouldRouteToCanary(request: NextRequest, config: CanaryConfig): boolean {
  // 제외 패턴 확인
  if (config.excludePatterns) {
    const pathname = request.nextUrl.pathname;
    for (const pattern of config.excludePatterns) {
      if (pathname.match(new RegExp(pattern))) {
        return false;
      }
    }
  }

  // 사용자 식별자 기반 일관된 라우팅
  const userId = request.cookies.get('user_id')?.value || 
                 request.headers.get('x-user-id') ||
                 request.ip || 
                 'anonymous';
  
  // 해시 기반 결정 (일관성 보장)
  const hash = hashString(userId + request.nextUrl.pathname);
  const threshold = config.percentage / 100;
  
  return (hash % 100) / 100 < threshold;
}

/**
 * v2 API로 라우팅
 */
function routeToV2(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  
  // /api/* -> /api/v2/* 변환
  url.pathname = url.pathname.replace(/^\/api\//, '/api/v2/');

  const response = NextResponse.rewrite(url);
  
  // 메트릭 헤더 추가
  response.headers.set('x-api-version', 'v2');
  response.headers.set('x-canary', 'true');
  response.headers.set('x-request-id', crypto.randomUUID());
  response.headers.set('x-request-time', new Date().toISOString());
  
  // 쿠키 설정 (향후 요청에서 동일한 버전 사용)
  response.cookies.set(CANARY_COOKIE, 'v2', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1시간
  });
  
  return response;
}

/**
 * 문자열 해시 함수 (일관된 라우팅을 위함)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// 보호할 경로 설정
export const config = {
  matcher: [
    // 인증이 필요한 경로
    "/mypage/:path*",
    "/reservations/new",
    "/reservations",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/reservations/:path*",
    
    // API 라우트 (canary 라우팅용)
    "/api/:path*"
  ]
}