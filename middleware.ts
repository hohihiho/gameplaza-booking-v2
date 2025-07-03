import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // 관리자 페이지 접근 제어
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const token = req.nextauth.token
      const adminEmails = ['admin@gameplaza.kr', 'ndz5496@gmail.com']
      
      if (!token?.email || !adminEmails.includes(token.email)) {
        return NextResponse.redirect(new URL("/", req.url))
      }
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