import { createAuthClient } from "better-auth/react";
// import { passkeyClient } from "better-auth/client/plugins"; // TODO: 패스키 플러그인 추후 구현

// Cloudflare Better Auth 클라이언트 생성 및 익스포트
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  fetchOptions: {
    credentials: 'include',
  },
  // plugins: [
  //   passkeyClient(), // TODO: 패스키 플러그인 추후 구현
  // ],
});

// Better Auth 함수들을 authClient에서 가져오기
export const { signIn, signOut, useSession } = authClient;

// Google 로그인 함수
export const signInWithGoogle = async (redirectTo?: string) => {
  try {
    console.log('🔄 Google 로그인 시작...');
    
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: redirectTo || window.location.origin,
    });
    
    console.log('✅ Google 로그인 요청 완료');
  } catch (error) {
    console.error('❌ Google 로그인 실패:', error);
    throw error;
  }
};

// 세션 확인 함수 (서버용)
export const checkSession = async () => {
  try {
    const response = await fetch('/api/auth/get-session');
    const sessionData = await response.json();
    return {
      isAuthenticated: !!sessionData?.user,
      user: sessionData?.user || null,
      session: sessionData || null,
    };
  } catch (error) {
    console.error('❌ 세션 확인 실패:', error);
    return {
      isAuthenticated: false,
      user: null,
      session: null,
    };
  }
};

// 로그아웃 함수
export const handleSignOut = async () => {
  try {
    console.log('🔄 로그아웃 중...');
    await authClient.signOut();
    console.log('✅ 로그아웃 완료');
    
    // 페이지 새로고침으로 상태 초기화
    window.location.reload();
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error);
    throw error;
  }
};