"use client";

import { createAuthClient } from "better-auth/react";
import type { Session, User } from "./server";

// Better Auth 클라이언트 생성
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

// React hooks와 함수들을 내보내기
export const {
  useSession,
  signIn,
  signOut,
  signUp,
  resetPassword,
  forgetPassword,
  getSession,
  updateUser,
} = authClient;

// 소셜 로그인 함수들
export const signInWithGoogle = () => 
  signIn.social({
    provider: "google",
    callbackURL: "/dashboard", // 로그인 후 리디렉션될 페이지
  });

// 커스텀 hooks
export function useAuth() {
  const { data: session, isPending: isLoading, error } = useSession();

  return {
    user: session?.user as User | null,
    session: session as Session | null,
    isLoading,
    isAuthenticated: !!session?.user,
    error,
  };
}

// 유틸리티 함수들
export const authUtils = {
  /**
   * 사용자 역할 확인
   */
  hasRole: (user: User | null, role: string): boolean => {
    return user?.role === role;
  },

  /**
   * 관리자 권한 확인
   */
  isAdmin: (user: User | null): boolean => {
    return user?.role === "admin" || user?.role === "superadmin";
  },

  /**
   * 활성 사용자 확인
   */
  isActiveUser: (user: User | null): boolean => {
    return user?.isActive === true;
  },

  /**
   * 사용자 닉네임 또는 이메일 반환
   */
  getDisplayName: (user: User | null): string => {
    return user?.nickname || user?.name || user?.email || "익명 사용자";
  },

  /**
   * KST 기준 마지막 로그인 시간 포맷
   */
  formatLastLogin: (user: User | null): string => {
    if (!user?.lastLoginAt) return "로그인 기록 없음";
    
    const date = new Date(user.lastLoginAt);
    // KST 시간으로 표시
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstTime = new Date(date.getTime() + kstOffset);
    
    return kstTime.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  /**
   * 프로필 완성도 확인
   */
  getProfileCompleteness: (user: User | null): number => {
    if (!user) return 0;

    let completed = 0;
    const total = 5; // 총 필드 수

    if (user.email) completed++;
    if (user.name) completed++;
    if (user.nickname) completed++;
    if (user.phone) completed++;
    if (user.image) completed++;

    return Math.round((completed / total) * 100);
  },

  /**
   * 인증 필요 여부 확인
   */
  requiresAuth: (user: User | null): boolean => {
    return !user || !user.isActive;
  },

  /**
   * 세션 만료 여부 확인
   */
  isSessionExpired: (session: Session | null): boolean => {
    if (!session?.session?.expiresAt) return true;
    
    const expiryTime = new Date(session.session.expiresAt).getTime();
    const currentTime = Date.now();
    
    return currentTime >= expiryTime;
  },
};

// 타입 내보내기
export type { Session, User };

// 에러 처리 유틸리티
export const AuthError = {
  INVALID_CREDENTIALS: "잘못된 인증 정보입니다.",
  ACCOUNT_NOT_FOUND: "계정을 찾을 수 없습니다.",
  ACCOUNT_DISABLED: "비활성화된 계정입니다.",
  SESSION_EXPIRED: "세션이 만료되었습니다. 다시 로그인해주세요.",
  NETWORK_ERROR: "네트워크 오류가 발생했습니다.",
  UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다.",

  /**
   * 에러 메시지를 한국어로 변환
   */
  getKoreanMessage: (error: string): string => {
    const errorMap: Record<string, string> = {
      "Invalid credentials": AuthError.INVALID_CREDENTIALS,
      "Account not found": AuthError.ACCOUNT_NOT_FOUND,
      "Account disabled": AuthError.ACCOUNT_DISABLED,
      "Session expired": AuthError.SESSION_EXPIRED,
      "Network error": AuthError.NETWORK_ERROR,
    };

    return errorMap[error] || AuthError.UNKNOWN_ERROR;
  },
};

// React Query용 키 팩토리 (나중에 사용할 수 있음)
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  user: (userId?: string) => [...authKeys.all, "user", userId] as const,
} as const;