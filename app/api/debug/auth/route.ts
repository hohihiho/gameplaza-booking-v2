import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH DEBUG START ===')
    
    // NextAuth 세션 확인
    const nextAuthSession = await auth()
    console.log('NextAuth 세션:', nextAuthSession)
    
    // Supabase 클라이언트 생성
    const supabase = await createClient()
    
    // Supabase 세션 확인
    let supabaseUser = null
    let supabaseError = null
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      supabaseUser = user
      supabaseError = error
    } catch (error) {
      supabaseError = error
    }
    
    console.log('Supabase 사용자:', supabaseUser)
    console.log('Supabase 에러:', supabaseError)
    
    // 쿠키 정보 확인
    const cookies = request.headers.get('cookie')
    console.log('요청 쿠키:', cookies)
    
    console.log('=== AUTH DEBUG END ===')
    
    return NextResponse.json({
      nextAuth: {
        hasSession: !!nextAuthSession,
        user: nextAuthSession?.user || null
      },
      supabase: {
        hasUser: !!supabaseUser,
        user: supabaseUser,
        error: supabaseError && typeof supabaseError === 'object' && 'message' in supabaseError ? (supabaseError as any).message : null
      },
      cookies: cookies || null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('AUTH DEBUG 에러:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}