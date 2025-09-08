import { auth } from "@/lib/auth/better-auth"
import { NextResponse, NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })
    return NextResponse.json(session)
  } catch (error) {
    console.error('세션 조회 오류:', error)
    return NextResponse.json(null)
  }
}