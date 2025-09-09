import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

// Better Auth 설정
export const auth = betterAuth({
  // 데이터베이스 설정 - D1은 Workers 환경에서만 사용 가능
  // 개발 환경에서는 메모리 DB 사용
  database: process.env.NODE_ENV === 'production' 
    ? undefined // Workers에서 직접 설정
    : {
        type: "sqlite",
        url: ":memory:",
      },

  // 세션 설정
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7일
    updateAge: 60 * 60 * 24, // 1일마다 갱신
    cookieName: "gameplaza-session",
  },

  // 쿠키 설정 (Next.js 통합)
  cookies: nextCookies(),

  // 인증 제공자
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`,
    },
  },

  // 이메일/비밀번호 인증
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 이메일 인증 비활성화 (개발 단계)
  },

  // 사용자 필드 확장
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
      name: {
        type: "string",
        required: false,
      },
      avatar: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },

  // 권한 설정
  account: {
    accountLinking: {
      enabled: true, // 소셜 계정 연동 허용
    },
  },

  // 보안 설정
  rateLimit: {
    enabled: true,
    window: 60, // 1분
    max: 10, // 최대 10회 시도
  },

  // 리다이렉트 URL
  redirects: {
    afterSignIn: "/",
    afterSignOut: "/",
    afterSignUp: "/auth/welcome",
    afterVerifyEmail: "/",
    afterResetPassword: "/auth/signin",
  },

  // 기본 URL
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // 시크릿 키
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
});

// 타입 export
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;