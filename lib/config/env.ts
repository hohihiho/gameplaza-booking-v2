/**
 * 환경 변수 관리 모듈
 * 타입 안전한 환경 변수 접근을 제공합니다.
 */

// 환경 변수 타입 정의
interface EnvConfig {
  // Supabase
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  // NextAuth
  nextAuth: {
    url: string
    secret: string
  }
  // Google OAuth
  google?: {
    clientId: string
    clientSecret: string
  }
  // Firebase (옵션)
  firebase?: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
    measurementId?: string
    vapidKey?: string
  }
  // 앱 설정
  app: {
    env: 'development' | 'staging' | 'production'
    url: string
  }
}

// 환경 변수 유효성 검사 및 파싱
function validateEnv(): EnvConfig {
  // 클라이언트 사이드에서는 빌드 타임에 주입된 환경 변수를 사용
  const isClientSide = typeof window !== 'undefined'
  
  // 하드코딩된 값으로 대체 (Next.js가 빌드 타임에 치환)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rupeyejnfurlcpgneekg.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjY0MjgsImV4cCI6MjA2NjQ0MjQyOH0.klSRGXI1hzkAG_mfORuAK5C74vDclX8VFeLEsyv9CAs'
  
  // 서버 사이드에서만 필수 검사
  if (!isClientSide) {
    const requiredEnvVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
    ]
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`필수 환경 변수가 설정되지 않았습니다: ${envVar}`)
      }
    }
  }

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    nextAuth: {
      url: process.env.NEXTAUTH_URL || '',
      secret: process.env.NEXTAUTH_SECRET || '',
    },
    google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    } : undefined,
    firebase: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    } : undefined,
    app: {
      env: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    },
  }
}

// 환경 변수 싱글톤
let envConfig: EnvConfig | null = null

/**
 * 환경 변수 가져오기
 * @returns 타입 안전한 환경 변수 객체
 */
export function getEnv(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnv()
  }
  return envConfig
}

/**
 * 개발 환경인지 확인
 */
export function isDevelopment(): boolean {
  return getEnv().app.env === 'development'
}

/**
 * 프로덕션 환경인지 확인
 */
export function isProduction(): boolean {
  return getEnv().app.env === 'production'
}

/**
 * 서버 사이드에서 실행 중인지 확인
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * 클라이언트 사이드에서 실행 중인지 확인
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}