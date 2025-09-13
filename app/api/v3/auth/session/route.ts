import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, validateSession, isAdmin, isSuperAdmin } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  // E2E 테스트 모드: 비프로덕션 + 헤더로 가장 세션 제공
  if (process.env.NODE_ENV !== 'production') {
    const h = await headers()
    const imp = h.get('x-e2e-impersonate')
    if (imp === 'admin') {
      return NextResponse.json({ user: { id: 'e2e-admin', email: 'e2e-admin@example.com', isAdmin: true, isSuperAdmin: true } })
    }
    if (imp === 'user') {
      return NextResponse.json({ user: { id: 'e2e-user', email: 'e2e-user@example.com', isAdmin: false, isSuperAdmin: false } })
    }
  }

  // JWT 토큰에서 세션 확인
  const token = getTokenFromRequest(request)
  if (!token) {
    return NextResponse.json({ user: null })
  }

  const session = await validateSession(token)
  if (!session?.user) {
    return NextResponse.json({ user: null })
  }

  // 사용자 정보와 권한 정보 반환
  return NextResponse.json({
    user: {
      ...session.user,
      isAdmin: isAdmin(session.user),
      isSuperAdmin: isSuperAdmin(session.user)
    }
  })
}
