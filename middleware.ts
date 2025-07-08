import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  async function middleware(req) {
    // 관리자 페이지 접근 제어
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const token = req.nextauth.token
      
      if (!token?.email) {
        return NextResponse.redirect(new URL("/login", req.url))
      }
      
      // 관리자 권한은 API를 통해 확인 (보안 강화)
      // 하드코딩 제거
      // TODO: 성능을 위해 캠시 고려
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

// 보호할 경로 설정
export const config = {
  matcher: [
    "/mypage/:path*",
    "/reservations/new",
    "/reservations",
    // 예약 완료 페이지는 제외
    // "/reservations/complete",
    "/admin/:path*"
  ]
}