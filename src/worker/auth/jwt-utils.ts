/**
 * JWT 토큰 검증 유틸리티 (Cloudflare Workers용)
 */

interface JWTPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
  iss: string;
  aud: string;
  [key: string]: any;
}

/**
 * JWT 토큰을 디코딩합니다 (검증 없음 - 개발용)
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Authorization 헤더에서 JWT 토큰을 추출합니다
 */
function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * 쿠키에서 JWT 토큰을 추출합니다
 */
function extractTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith('stack-session=')) {
      return cookie.substring('stack-session='.length);
    }
  }
  return null;
}

/**
 * 현재 사용자 인증 정보를 가져옵니다
 */
export function getCurrentUserFromRequest(request: Request): JWTPayload | null {
  // Authorization 헤더에서 토큰 추출 시도
  let token = extractTokenFromRequest(request);
  
  // 헤더에 없으면 쿠키에서 추출 시도
  if (!token) {
    token = extractTokenFromCookies(request);
  }

  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  
  // 토큰 만료 확인
  if (payload && payload.exp < Date.now() / 1000) {
    return null;
  }

  return payload;
}

/**
 * 사용자가 인증되었는지 확인합니다
 */
export function isAuthenticated(request: Request): boolean {
  return getCurrentUserFromRequest(request) !== null;
}

/**
 * 특정 이메일이 슈퍼 관리자인지 확인합니다
 */
export function isSuperAdmin(email: string): boolean {
  const superAdminEmails = ['ndz5496@gmail.com', 'leejinseok94@gmail.com'];
  return superAdminEmails.includes(email);
}

/**
 * 인증 미들웨어 - 인증된 사용자만 접근 허용
 */
export function requireAuth(handler: (request: Request, user: JWTPayload) => Promise<Response>) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    const user = getCurrentUserFromRequest(request);
    
    if (!user) {
      return Response.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

/**
 * 관리자 권한 미들웨어
 */
export function requireAdmin(handler: (request: Request, user: JWTPayload) => Promise<Response>) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    const user = getCurrentUserFromRequest(request);
    
    if (!user) {
      return Response.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    if (!isSuperAdmin(user.email)) {
      return Response.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    return handler(request, user);
  };
}