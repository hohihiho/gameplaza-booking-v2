// 간단한 JWT 기반 자체 인증 시스템
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './better-db';
import * as schema from './schema';

// JWT 비밀키는 반드시 환경변수에서 설정되어야 함 (보안상 기본값 제거)
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. 서버를 시작할 수 없습니다.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'superadmin';
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
  role: string;
  iat: number;
  exp: number;
}

// JWT 토큰 생성
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
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

  return cookies.authToken || null;
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
    name: payload.email.split('@')[0],
    role: payload.role as 'user' | 'admin' | 'superadmin',
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

// 관리자 권한 체크
export function isAdmin(user: User): boolean {
  return user.role === 'admin' || user.role === 'superadmin';
}

// 슈퍼관리자 권한 체크
export function isSuperAdmin(user: User): boolean {
  return user.role === 'superadmin';
}

// API 라우트용 인증 미들웨어
type AuthHandler = (
  request: NextRequest,
  context: { user: User; [key: string]: any }
) => Promise<NextResponse> | NextResponse;

interface WithAuthOptions {
  requireAdmin?: boolean;
}

// Better Auth configuration
export const auth = {
  api: {
    getSession: async ({ headers }: { headers: Headers }) => {
      const token = headers.get('authorization')?.replace('Bearer ', '') ||
                   headers.get('cookie')?.match(/authToken=([^;]+)/)?.[1];

      if (!token) return null;

      const session = await validateSession(token);
      return session;
    }
  }
};

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