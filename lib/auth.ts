// 간단한 JWT 기반 자체 인증 시스템
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// JWT 비밀키 설정 (개발 환경에서는 안전한 기본값 사용)
let JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.BETTER_AUTH_SECRET
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. 서버를 시작할 수 없습니다.')
  } else {
    console.warn('[auth] JWT_SECRET 미설정 - 개발 기본값 사용 (dev-secret-change-me)')
    JWT_SECRET = 'dev-secret-change-me'
  }
}
const JWT_EXPIRES_IN = '24h';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'gp_vip' | 'gp_regular' | 'gp_user' | 'restricted';
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  expires: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  image?: string;
  iat: number;
  exp: number;
}

// JWT 토큰 생성
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// JWT 토큰 검증
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    return null;
  }
}

// 비밀번호 해시
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 쿠키에서 토큰 추출
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies['auth-token'] || cookies.authToken || null;
}

// NextAuth 스타일 auth() 함수 - API들과의 호환성을 위해
export async function auth(): Promise<{ user: User | null } | null> {
  try {
    // 개발 환경에서는 임시로 null 반환
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  auth() called in development - returning null session')
      return null
    }

    // 프로덕션에서는 실제 구현 필요
    return null
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

// Request에서 토큰 추출
export function getTokenFromRequest(request: NextRequest): string | null {
  // Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 쿠키에서 토큰 추출
  const cookieHeader = request.headers.get('cookie');
  return getTokenFromCookies(cookieHeader);
}

// 세션 검증 (서버사이드)
export async function validateSession(token: string): Promise<Session | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  // TODO: 데이터베이스에서 사용자 정보 조회
  // 임시로 토큰 정보만 사용
  const user: User = {
    id: payload.userId,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    role: payload.role as 'super_admin' | 'gp_vip' | 'gp_regular' | 'gp_user' | 'restricted',
    image: payload.image || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    user,
    expires: new Date(payload.exp * 1000).toISOString(),
  };
}

// 현재 사용자 세션 가져오기
export async function getCurrentUser(): Promise<User | null> {
  // TODO: 서버 컴포넌트에서 쿠키를 통해 세션 정보 가져오기
  // 현재는 null 반환
  return null;
}

// 관리자 권한 체크 (기획서 기준)
export function isAdmin(user: User): boolean {
  return user.role === 'super_admin';
}

// 슈퍼관리자 권한 체크 (기획서 기준)
export function isSuperAdmin(user: User): boolean {
  return user.role === 'super_admin';
}

// 직급별 권한 체크 함수들
export function isVIP(user: User): boolean {
  return user.role === 'gp_vip';
}

export function isRegular(user: User): boolean {
  return user.role === 'gp_regular';
}

export function isRestricted(user: User): boolean {
  return user.role === 'restricted';
}

// 직급 표시명 변환
export function getRoleDisplayName(role: string): string {
  const roleMap = {
    'super_admin': '슈퍼관리자',
    'gp_vip': '겜플VIP',
    'gp_regular': '겜플단골',
    'gp_user': '겜플유저',
    'restricted': '제한'
  };
  return roleMap[role as keyof typeof roleMap] || '겜플유저';
}

// 직급별 색상 체계
export function getRoleColor(role: string): { bg: string, text: string, border: string } {
  const colorMap = {
    'super_admin': {
      bg: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      text: 'text-white',
      border: 'border-purple-500'
    },
    'gp_vip': {
      bg: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      text: 'text-white',
      border: 'border-yellow-400'
    },
    'gp_regular': {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      text: 'text-white',
      border: 'border-blue-500'
    },
    'gp_user': {
      bg: 'bg-gradient-to-r from-green-500 to-green-600',
      text: 'text-white',
      border: 'border-green-500'
    },
    'restricted': {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      text: 'text-white',
      border: 'border-red-500'
    }
  };
  return colorMap[role as keyof typeof colorMap] || colorMap['gp_user'];
}

// API 라우트용 인증 미들웨어
type AuthHandler = (
  request: NextRequest,
  context: { user: User; [key: string]: any }
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

    // 토큰 추출
    const token = getTokenFromRequest(request);
    if (!token) {
      console.log('withAuth: No token found');
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 세션 검증
    const session = await validateSession(token);
    if (!session) {
      console.log('withAuth: Invalid session');
      return NextResponse.json(
        { error: '유효하지 않은 인증 정보입니다' },
        { status: 401 }
      );
    }

    console.log('withAuth: Session:', { user: session.user.email, role: session.user.role });

    // 관리자 권한 확인 (옵션에 따라)
    if (options?.requireAdmin) {
      console.log('withAuth: Checking admin permissions');

      if (!isAdmin(session.user)) {
        console.log('withAuth: Admin access denied');
        return NextResponse.json(
          { error: '관리자 권한이 필요합니다' },
          { status: 403 }
        );
      }

      console.log('withAuth: Admin access granted');
    }

    console.log('withAuth: Authentication successful, calling handler');
    // 사용자 정보를 handler에 전달
    return handler(request, { ...context, user: session.user });
  };
}