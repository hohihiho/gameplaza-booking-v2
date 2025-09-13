import { NextRequest, NextResponse } from 'next/server'

// V3 API 디버깅용 엔드포인트
export async function GET(req: NextRequest) {
  try {
    // 환경 변수 확인
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      D1_ENABLED: process.env.D1_ENABLED,
      D1_BINDING_NAME: process.env.D1_BINDING_NAME,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    // 기본 모듈 import 테스트
    const { requireAuth } = await import('@/lib/auth/utils')
    const { listReservations } = await import('@/lib/db/adapter')

    return NextResponse.json({
      success: true,
      message: 'V3 API 디버깅 정보',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      modules: {
        authUtils: typeof requireAuth,
        dbAdapter: typeof listReservations,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'DEBUG_ERROR',
      message: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}