import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { ApiError, ErrorCode } from '@/lib/api/response'
import { useRouter } from 'next/navigation'

/**
 * API 에러 처리 훅
 */
export function useApiError() {
  const router = useRouter()

  const handleError = useCallback((error: ApiError | Error | unknown) => {
    console.error('API Error:', error)

    // ApiError 타입인 경우
    if (isApiError(error)) {
      handleApiError(error, router)
      return
    }

    // 일반 Error 타입인 경우
    if (error instanceof Error) {
      toast.error(error.message || '오류가 발생했습니다')
      return
    }

    // 알 수 없는 에러
    toast.error('알 수 없는 오류가 발생했습니다')
  }, [router])

  return { handleError }
}

/**
 * ApiError 타입 가드
 */
function isApiError(error: any): error is ApiError {
  return error && typeof error.code === 'string' && typeof error.message === 'string'
}

/**
 * API 에러 처리
 */
function handleApiError(error: ApiError, router: any) {
  switch (error.code) {
    // 인증 관련 에러
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.TOKEN_EXPIRED:
      toast.error('로그인이 필요합니다')
      router.push('/login')
      break

    case ErrorCode.FORBIDDEN:
      toast.error('접근 권한이 없습니다')
      break

    // 유효성 검사 에러
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_REQUEST:
      toast.error(error.message || '입력값을 확인해주세요')
      break

    case ErrorCode.MISSING_REQUIRED_FIELD:
      const field = error.details?.field
      toast.error(`${field ? `${field} 필드가` : '필수 정보가'} 누락되었습니다`)
      break

    // 리소스 관련 에러
    case ErrorCode.NOT_FOUND:
      toast.error(error.message || '요청한 정보를 찾을 수 없습니다')
      break

    case ErrorCode.ALREADY_EXISTS:
      toast.error(error.message || '이미 존재하는 항목입니다')
      break

    case ErrorCode.CONFLICT:
      toast.error(error.message || '충돌이 발생했습니다')
      break

    // 비즈니스 로직 에러
    case ErrorCode.RESERVATION_NOT_AVAILABLE:
      toast.error('해당 시간대는 예약할 수 없습니다')
      break

    case ErrorCode.INVALID_TIME_SLOT:
      toast.error('유효하지 않은 시간대입니다')
      break

    case ErrorCode.DEVICE_NOT_AVAILABLE:
      toast.error('선택한 기기를 사용할 수 없습니다')
      break

    case ErrorCode.INSUFFICIENT_CREDITS:
      toast.error('보유 크레딧이 부족합니다')
      break

    case ErrorCode.INVALID_STATUS_TRANSITION:
      toast.error('현재 상태에서는 해당 작업을 수행할 수 없습니다')
      break

    // 시스템 에러
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      toast.error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요')
      break

    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
      toast.error('시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요')
      break

    case ErrorCode.INTERNAL_ERROR:
    default:
      toast.error(error.message || '서버 오류가 발생했습니다')
      break
  }
}

/**
 * HTTP 상태 코드에 따른 에러 메시지
 */
export function getErrorMessageByStatus(status: number): string {
  switch (status) {
    case 400:
      return '잘못된 요청입니다'
    case 401:
      return '인증이 필요합니다'
    case 403:
      return '권한이 없습니다'
    case 404:
      return '요청한 정보를 찾을 수 없습니다'
    case 409:
      return '충돌이 발생했습니다'
    case 429:
      return '요청이 너무 많습니다'
    case 500:
      return '서버 오류가 발생했습니다'
    case 502:
      return '게이트웨이 오류가 발생했습니다'
    case 503:
      return '서비스를 일시적으로 사용할 수 없습니다'
    default:
      return '알 수 없는 오류가 발생했습니다'
  }
}