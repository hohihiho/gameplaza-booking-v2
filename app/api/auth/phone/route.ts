import { NextRequest, NextResponse } from 'next/server'
import { sendPhoneOTP } from '@/lib/auth/phone-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    // 비즈니스 로직 호출
    const result = await sendPhoneOTP(phone)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('인증 요청 처리 중 오류:', error)
    return NextResponse.json(
      { error: '인증 요청 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}