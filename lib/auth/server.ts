import { betterAuth } from "better-auth";
import { google } from "better-auth/social-providers";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/lib/db/connection";

// D1 데이터베이스 연결 설정 (Drizzle ORM 사용)
function getDatabase() {
  // 개발 환경에서는 로컬 SQLite 사용, 프로덕션에서는 D1 사용
  const db = getDb();
  
  if (db) {
    // Drizzle 어댑터 사용
    return drizzleAdapter(db, {
      provider: 'sqlite'
    });
  }
  
  // DB 연결이 없으면 메모리 어댑터 사용 (빌드 시점)
  return null;
}

// Better Auth 설정 (완전히 새로 작성)
export const auth = betterAuth({
  // 기본 설정
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  // 데이터베이스 설정 - 개발 환경에서는 메모리 사용
  database: getDatabase(),
  
  // 세션 설정
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7일
    updateAge: 60 * 60 * 24, // 1일
  },
  
  // 이메일/비밀번호 로그인 비활성화 (Google 전용)
  emailAndPassword: {
    enabled: false,
  },
  
  // 사용자 설정 (게임플라자 전용)
  user: {
    additionalFields: {
      nickname: { type: "string", required: false },
      phone: { type: "string", required: false },
      role: { type: "string", defaultValue: "user", required: true },
      isActive: { type: "boolean", defaultValue: true, required: true },
      lastLoginAt: { type: "date", required: false },
    },
  },
  
  // Google 소셜 로그인만 활성화
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["openid", "profile", "email"],
    },
  },
  
  // 고급 설정
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: { 
      enabled: false 
    },
    cookies: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: process.env.NODE_ENV === "production" ? ".gameplaza.kr" : undefined,
    },
    enableCSRFProtection: true,
  },
  
  // 로그인 성공 후 처리 (KST 시간)
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // KST 기준 시간으로 lastLoginAt 업데이트
        const now = new Date();
        const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
        
        // 사용자 정보 업데이트 로직 (향후 DB 연결 시 구현)
        console.log(`User ${user.email} logged in at ${kstTime.toISOString()}`);
      }
      return true;
    },
  },
  
  // 에러 처리
  onError: (error, request) => {
    console.error("Better Auth Error:", {
      error: error.message,
      stack: error.stack,
      url: request?.url,
      method: request?.method,
    });
  },
});

// 타입 내보내기
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;