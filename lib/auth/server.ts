import { betterAuth } from "better-auth";
import { google } from "better-auth/social-providers";

export const export const auth = betterAuth({
  // 기본 설정
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-key",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  
  // 메모리 기반 세션 (개발용)
  // production에서는 D1 어댑터 사용 필요
  
  // 세션 설정
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7일
    updateAge: 60 * 60 * 24, // 1일
  },
  
  // 이메일/비밀번호 로그인 비활성화 (Google + 패스키만 사용)
  emailAndPassword: {
    enabled: false,
  },
  
  // 사용자 설정
  user: {
    additionalFields: {
      nickname: { type: "string", required: false },
      phone: { type: "string", required: false },
      role: { type: "string", defaultValue: "user", required: true },
      isActive: { type: "boolean", defaultValue: true, required: true },
      lastLoginAt: { type: "date", required: false },
    },
  },
  
  // 소셜 로그인 제공자 (패스키는 별도 플러그인 설치 후 추가)
  plugins: [
    google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["openid", "profile", "email"],
    }),
  ],
  
  // 고급 설정
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: { enabled: false },
    cookies: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: process.env.NODE_ENV === "production" ? ".gwangju.kr" : undefined,
    },
    enableCSRFProtection: true,
    
    // KST 시간 처리 훅
    hooks: {
      before: [
        {
          matcher: (context) => {
            return ["sign-in", "sign-up", "update-user"].includes(context.endpoint);
          },
          handler: async (request) => {
            // KST 기준 시간으로 lastLoginAt 업데이트
            if (request.body && typeof request.body === "object") {
              const now = new Date();
              const kstOffset = 9 * 60 * 60 * 1000; // KST는 UTC+9
              const kstTime = new Date(now.getTime() + kstOffset);
              (request.body as any).lastLoginAt = kstTime.toISOString();
            }
            return request;
          },
        },
      ],
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
})

export type Auth = typeof auth