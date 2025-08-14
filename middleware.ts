import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  // 임시로 모든 미들웨어 로직 비활성화
  return NextResponse.next();
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

/**
 * 의심스러운 요청 차단
 */
function isBlockedRequest(request: NextRequest): boolean {
  const { pathname, searchParams } = request.nextUrl;
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  
  // 악성 봇 차단
  const blockedBots = [
    'sqlmap', 'nikto', 'nessus', 'openvas', 'nmap',
    'masscan', 'zap', 'w3af', 'skipfish', 'gobuster'
  ];
  
  if (blockedBots.some(bot => userAgent.includes(bot))) {
    return true;
  }
  
  // SQL Injection 시도 차단
  const sqlPatterns = [
    'union+select', 'union%20select', 'union+all+select',
    'drop+table', 'delete+from', 'insert+into',
    'script+alert', 'javascript:', 'vbscript:',
    '<script', '</script>', 'onload=', 'onerror='
  ];
  
  const fullUrl = pathname + searchParams.toString();
  if (sqlPatterns.some(pattern => fullUrl.toLowerCase().includes(pattern))) {
    return true;
  }
  
  // 과도한 경로 깊이 차단
  if (pathname.split('/').length > 10) {
    return true;
  }
  
  // 디렉토리 순회 시도 차단
  if (pathname.includes('../') || pathname.includes('..\\')) {
    return true;
  }
  
  return false;
}

/**
 * Rate limiting 적용
 */
function applyRateLimit(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  
  // 테스트 환경에서는 Rate Limiting 완전 비활성화
  if (request.headers.get('X-Test-Environment') === 'true' ||
      process.env.NODE_ENV === 'test' ||
      process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
    return null;
  }
  
  // 인증 관련 API
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/v2/auth')) {
    const authRateLimit = rateLimit(rateLimitConfigs.auth);
    return authRateLimit(request);
  }
  
  // 예약 관련 API
  if (pathname.includes('/reservations') && request.method === 'POST') {
    const reservationRateLimit = rateLimit(rateLimitConfigs.reservation);
    return reservationRateLimit(request);
  }
  
  // 관리자 API
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/v2/admin')) {
    const adminRateLimit = rateLimit(rateLimitConfigs.admin);
    return adminRateLimit(request);
  }
  
  // 일반 API
  if (pathname.startsWith('/api/')) {
    const defaultRateLimit = rateLimit(rateLimitConfigs.default);
    return defaultRateLimit(request);
  }
  
  return null;
}

// 보호할 경로 설정
export const config = {
  matcher: [
    // 인증이 필요한 경로 - 임시로 사용자 페이지들 제외
    // "/mypage/:path*",
    // "/reservations/new",
    // "/reservations",
    "/admin/:path*",
    "/api/admin/:path*",
    // "/api/reservations/:path*", // 임시로 예약 API 보호 해제
    
    // API 라우트 (canary 라우팅용)
    "/api/:path*"
  ]
}