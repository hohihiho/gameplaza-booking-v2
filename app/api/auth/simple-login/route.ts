import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 임시 로그인 솔루션 - 개발용
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // 개발용 테스트 계정
    const testAccounts = [
      { email: 'admin@gameplaza.kr', password: 'admin123', role: 'admin', name: '관리자' },
      { email: 'user@gameplaza.kr', password: 'user123', role: 'user', name: '일반사용자' },
      { email: 'test@test.com', password: 'test123', role: 'user', name: '테스트' }
    ]
    
    const user = testAccounts.find(acc => acc.email === email && acc.password === password)
    
    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }
    
    // 간단한 세션 토큰 생성
    const sessionToken = Buffer.from(JSON.stringify({
      email: user.email,
      role: user.role,
      name: user.name,
      timestamp: Date.now()
    })).toString('base64')
    
    // 쿠키에 세션 저장
    const cookieStore = await cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7일
    })
    
    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: '로그인 성공'
    })
  } catch (error) {
    console.error('Simple login error:', error)
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 로그아웃
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  
  return NextResponse.json({ message: '로그아웃 완료' })
}