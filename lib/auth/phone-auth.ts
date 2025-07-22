import { createClient } from '@/lib/supabase'
import { validatePhoneNumber } from './utils-new'

export interface PhoneAuthResult {
  success: boolean
  message?: string
  error?: string
}

/**
 * 전화번호를 국제 형식으로 변환
 */
export function formatPhoneForSupabase(phone: string): string {
  // 하이픈 제거
  const cleaned = phone.replace(/-/g, '')
  // 한국 국가 코드 추가
  return `+82${cleaned.substring(1)}`
}

/**
 * 전화번호로 OTP를 전송합니다
 */
export async function sendPhoneOTP(phone: string): Promise<PhoneAuthResult> {
  // 전화번호 유효성 검사
  if (!phone) {
    return {
      success: false,
      error: '전화번호를 입력해주세요',
    }
  }

  if (!validatePhoneNumber(phone)) {
    return {
      success: false,
      error: '올바른 전화번호 형식이 아닙니다',
    }
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = createClient()

    // OTP 전송
    const formattedPhone = formatPhoneForSupabase(phone)
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'sms',
      },
    })

    if (error) {
      console.error('OTP 전송 실패:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: '인증 코드가 전송되었습니다',
    }
  } catch (error) {
    console.error('인증 요청 처리 중 오류:', error)
    return {
      success: false,
      error: '인증 요청 처리 중 오류가 발생했습니다',
    }
  }
}

/**
 * OTP 코드를 검증합니다
 */
export async function verifyPhoneOTP(phone: string, code: string): Promise<PhoneAuthResult> {
  if (!phone || !code) {
    return {
      success: false,
      error: '전화번호와 인증 코드를 입력해주세요',
    }
  }

  if (!validatePhoneNumber(phone)) {
    return {
      success: false,
      error: '올바른 전화번호 형식이 아닙니다',
    }
  }

  try {
    const supabase = createClient()
    const formattedPhone = formatPhoneForSupabase(phone)

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: code,
      type: 'sms',
    })

    if (error) {
      console.error('OTP 검증 실패:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: '인증이 완료되었습니다',
    }
  } catch (error) {
    console.error('인증 코드 검증 중 오류:', error)
    return {
      success: false,
      error: '인증 코드 검증 중 오류가 발생했습니다',
    }
  }
}