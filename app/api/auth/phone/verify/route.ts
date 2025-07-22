import { NextRequest, NextResponse } from 'next/server'
import { verifyPhoneOTP } from '@/lib/auth/phone-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = body

    // 필수 값 검증
    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요' },
        { status: 400 }
      )
    }

    if (!code) {
      return NextResponse.json(
        { error: '인증 코드를 입력해주세요' },
        { status: 400 }
      )
    }

    // 비즈니스 로직 호출
    const result = await verifyPhoneOTP(phone, code)

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
    console.error('인증 코드 검증 중 오류:', error)
    return NextResponse.json(
      { error: '인증 코드 검증 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}