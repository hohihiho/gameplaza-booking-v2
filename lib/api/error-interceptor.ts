import { ApiError, ErrorCode } from './response'

/**
 * 에러 인터셉터 타입
 */
export type ErrorInterceptor = (error: ApiError) => Promise<boolean> | boolean

/**
 * 글로벌 에러 인터셉터 관리자
 */
class ErrorInterceptorManager {
  private interceptors: ErrorInterceptor[] = []

  /**
   * 에러 인터셉터 추가
   */
  add(interceptor: ErrorInterceptor): () => void {
    this.interceptors.push(interceptor)
    
    // 제거 함수 반환
    return () => {
      const index = this.interceptors.indexOf(interceptor)
      if (index > -1) {
        this.interceptors.splice(index, 1)
      }
    }
  }

  /**
   * 에러 처리
   * @returns true면 에러가 처리됨, false면 계속 전파
   */
  async handleError(error: ApiError): Promise<boolean> {
    for (const interceptor of this.interceptors) {
      try {
        const handled = await interceptor(error)
        if (handled) {
          return true
        }
      } catch (e) {
        console.error('Error in interceptor:', e)
      }
    }
    return false
  }

  /**
   * 모든 인터셉터 제거
   */
  clear() {
    this.interceptors = []
  }
}

// 글로벌 인스턴스
export const errorInterceptorManager = new ErrorInterceptorManager()

/**
 * 기본 인터셉터 설정
 */
export function setupDefaultInterceptors() {
  // 인증 에러 인터셉터
  errorInterceptorManager.add(async (error) => {
    if (error.code === ErrorCode.UNAUTHORIZED || error.code === ErrorCode.TOKEN_EXPIRED) {
      // 로그인 페이지로 리다이렉트
      if (typeof window !== 'undefined') {
        // 현재 경로 저장
        const currentPath = window.location.pathname + window.location.search
        sessionStorage.setItem('redirectUrl', currentPath)
        
        // 토큰 제거
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        
        // 로그인 페이지로 이동
        window.location.href = '/login'
        return true
      }
    }
    return false
  })

  // 권한 에러 인터셉터
  errorInterceptorManager.add(async (error) => {
    if (error.code === ErrorCode.FORBIDDEN) {
      // 관리자 페이지에서 권한이 없는 경우
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.href = '/'
        return true
      }
    }
    return false
  })

  // 유지보수 모드 인터셉터
  errorInterceptorManager.add(async (error) => {
    if (error.code === 'MAINTENANCE_MODE') {
      if (typeof window !== 'undefined') {
        window.location.href = '/maintenance'
        return true
      }
    }
    return false
  })
}

/**
 * 커스텀 에러 핸들러 추가 헬퍼
 */
export function addErrorHandler(
  errorCode: string | string[],
  handler: (error: ApiError) => Promise<void> | void
): () => void {
  const codes = Array.isArray(errorCode) ? errorCode : [errorCode]
  
  return errorInterceptorManager.add(async (error) => {
    if (codes.includes(error.code)) {
      await handler(error)
      return true
    }
    return false
  })
}