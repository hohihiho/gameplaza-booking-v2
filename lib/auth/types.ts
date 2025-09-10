import { Session } from 'next-auth';
import { NextRequest } from 'next/server';

// 확장된 사용자 타입
export interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  phone?: string;
  image?: string | null;
  role: 'user' | 'admin';
  isAdmin: boolean;
  isSuperAdmin?: boolean;
}

// 확장된 세션 타입
export interface ExtendedSession extends Session {
  user: ExtendedUser;
}

// API 응답 타입
export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// 인증 미들웨어 옵션
export interface AuthMiddlewareOptions {
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  allowAnonymous?: boolean;
}

// 인증 컨텍스트
export interface AuthContext {
  user: ExtendedUser | null;
  session: ExtendedSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// 인증된 요청 타입
export interface AuthenticatedRequest extends NextRequest {
  user: ExtendedUser;
}