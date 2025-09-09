import { betterAuth } from "better-auth"
import Database from "better-sqlite3"
import { googleProvider } from "better-auth/providers/google"

// 환경 변수 검증
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Missing required environment variables: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
}

// SQLite 데이터베이스 설정
const db = new Database("./auth.db")

// 관리자 이메일 목록 (하드코딩)
const ADMIN_EMAILS = [
  'ndz5496@gmail.com',
  'admin@gameplaza.kr',
  // 추가 관리자 이메일을 여기에 추가
]

export const auth = betterAuth({
  database: db,
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: false, // 이메일/패스워드 로그인 비활성화
  },
  socialProviders: {
    google: googleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7일
    },
  },
  callbacks: {
    async onSignIn(data) {
      console.log('User signed in:', data.user.email)
      return true
    },
    async onSignUp(data) {
      console.log('New user signed up:', data.user.email)
      return true
    },
  },
  trustedOrigins: [
    process.env.NODE_ENV === 'production' 
      ? 'https://gameplaza.kr' 
      : 'http://localhost:3000'
  ],
})

// 관리자 권한 확인 유틸리티 함수
export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// 세션 및 사용자 정보를 위한 타입 확장
export type Session = typeof auth.$Infer.Session & {
  user: {
    isAdmin?: boolean
  }
}

export type User = typeof auth.$Infer.User & {
  isAdmin?: boolean
}