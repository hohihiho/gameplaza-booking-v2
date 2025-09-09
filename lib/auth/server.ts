import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { passkey } from "better-auth/plugins/passkey"
import { admin } from "better-auth/plugins/admin"
import { organization } from "better-auth/plugins/organization"
import { twoFactor } from "better-auth/plugins/two-factor"
import { getDB } from "@/lib/db/client"
import * as schema from "@/lib/db/schema"

export const auth = betterAuth({
  database: drizzleAdapter(getDB(), {
    provider: "sqlite", // D1 is SQLite-based
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    }
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 일단 이메일 검증 비활성화
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    kakao: {
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30일
    updateAge: 60 * 60 * 24, // 24시간마다 세션 갱신
    cookieName: "better-auth.session",
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],

  advanced: {
    generateId: () => {
      // D1에 친화적인 UUID 생성
      return crypto.randomUUID()
    },
    cookiePrefix: "gameplaza",
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // 플러그인 설정
  plugins: [
    // 패스키 인증
    passkey({
      rpName: "게임플라자",
      rpID: process.env.NODE_ENV === "production" 
        ? "gameplaza.kr" 
        : "localhost",
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    }),
    
    // 관리자 기능
    admin({
      impersonationSessionDuration: 60 * 60 * 24, // 24시간
    }),
    
    // 조직/권한 관리 (관리자, 슈퍼관리자, 회원 구분)
    organization({
      allowUserToCreateOrganization: false, // 관리자만 조직 생성 가능
      organizationLimit: 1, // 하나의 조직 (게임플라자)
    }),
    
    // 2단계 인증 (선택사항)
    twoFactor({
      issuer: "GamePlaza",
      backupCodeCount: 10,
      totpEnabled: true,
    }),
  ],

  // 사용자 역할 정의
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "member",
        // member, admin, super_admin, vip_member, gold_member, silver_member
      },
      nickname: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "active",
        // active, blocked, suspended
      },
      blockReason: {
        type: "string",
        required: false,
      },
      blockedAt: {
        type: "date",
        required: false,
      },
      blockedBy: {
        type: "string",
        required: false,
      },
      blockExpiresAt: {
        type: "date",
        required: false,
      },
    },
  },
})

export type Auth = typeof auth