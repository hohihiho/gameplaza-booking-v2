import { authMiddleware } from '@/lib/auth/middleware';

export default authMiddleware;

// 보호할 경로 설정
export const config = {
  matcher: [
    "/mypage/:path*",
    "/reservations/new",
    "/reservations",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/reservations/:path*"
  ]
}