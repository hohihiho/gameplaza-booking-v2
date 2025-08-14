/**
 * 환경별 설정 관리
 */

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
export const isTest = process.env.NODE_ENV === 'test'

// Vercel 환경 감지
export const isVercel = process.env.VERCEL === '1'
export const isVercelProduction = process.env.VERCEL_ENV === 'production'
export const isVercelPreview = process.env.VERCEL_ENV === 'preview'
export const isVercelDevelopment = process.env.VERCEL_ENV === 'development'

// 환경별 DB 선택
export const getSupabaseUrl = () => {
  // Vercel 운영 환경
  if (isVercelProduction) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL
  }
  
  // Vercel 프리뷰 환경 (개발 DB 사용)
  if (isVercelPreview) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL
  }
  
  // 로컬 개발
  return process.env.NEXT_PUBLIC_SUPABASE_URL
}

export const getSupabaseAnonKey = () => {
  if (isVercelProduction) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
  
  if (isVercelPreview) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
  
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export const getSupabaseServiceRoleKey = () => {
  if (isVercelProduction) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY
  }
  
  if (isVercelPreview) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY_DEV || process.env.SUPABASE_SERVICE_ROLE_KEY
  }
  
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

// 현재 환경 정보
export const getCurrentEnvironment = () => {
  if (isVercelProduction) return 'production'
  if (isVercelPreview) return 'preview'
  if (isVercel) return 'vercel-dev'
  if (isDevelopment) return 'development'
  if (isTest) return 'test'
  return 'unknown'
}

// 환경별 설정 로깅 (개발용)
export const logEnvironment = () => {
  if (isDevelopment) {
    console.log('🔧 Environment Configuration:')
    console.log('- Current Environment:', getCurrentEnvironment())
    console.log('- Supabase URL:', getSupabaseUrl())
    console.log('- Is Vercel:', isVercel)
    console.log('- Vercel Env:', process.env.VERCEL_ENV)
  }
}