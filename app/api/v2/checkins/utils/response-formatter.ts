import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    version: string
    [key: string]: any
  }
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  meta?: Record<string, any>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v2',
        ...meta
      }
    },
    { status }
  )
}

/**
 * 페이징된 목록 응답 생성
 */
export function createPaginatedResponse<T>(
  items: T[],
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  },
  status: number = 200
): NextResponse<ApiResponse<{ items: T[]; pagination: typeof pagination }>> {
  return createSuccessResponse(
    {
      items,
      pagination
    },
    status,
    { type: 'paginated' }
  )
}

/**
 * 생성 응답 (201 Created)
 */
export function createCreatedResponse<T>(
  data: T,
  location?: string
): NextResponse<ApiResponse<T>> {
  const response = createSuccessResponse(data, 201)
  
  if (location) {
    response.headers.set('Location', location)
  }
  
  return response
}

/**
 * 업데이트 응답 (200 OK)
 */
export function createUpdatedResponse<T>(
  data: T
): NextResponse<ApiResponse<T>> {
  return createSuccessResponse(data, 200)
}

/**
 * 삭제 응답 (204 No Content)
 */
export function createDeletedResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/**
 * 체크인 관련 표준 응답 포맷터
 */
export const CheckInResponseFormatter = {
  /**
   * 체크인 생성 응답
   */
  created: (checkIn: any) => createCreatedResponse(
    {
      checkIn,
      message: '체크인이 성공적으로 생성되었습니다'
    },
    `/api/v2/checkins/${checkIn.id}`
  ),

  /**
   * 결제 확인 응답
   */
  paymentConfirmed: (checkIn: any) => createSuccessResponse({
    checkIn,
    message: '결제가 확인되었습니다. 이용을 시작할 수 있습니다.'
  }),

  /**
   * 시간/금액 조정 응답
   */
  adjusted: (checkIn: any, adjustments: { time?: boolean; amount?: boolean }) => {
    const messages = []
    if (adjustments.time) messages.push('시간이 조정되었습니다')
    if (adjustments.amount) messages.push('금액이 조정되었습니다')
    
    return createSuccessResponse({
      checkIn,
      message: messages.join('. ') + '.'
    })
  },

  /**
   * 체크아웃 응답
   */
  checkedOut: (result: any) => createSuccessResponse({
    ...result,
    message: result.message || '체크아웃이 완료되었습니다'
  }),

  /**
   * 활성 체크인 목록 응답
   */
  activeList: (data: any) => createSuccessResponse(data),

  /**
   * 체크인 이력 응답
   */
  history: (data: any) => createSuccessResponse(data)
}