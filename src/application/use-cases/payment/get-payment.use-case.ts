import { Payment, PaymentStatus, PaymentMethod } from '@/src/domain/entities/payment'
import { PaymentRepository } from '@/src/domain/repositories/payment.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

/**
 * 결제 상세 조회 유스케이스
 */
export interface GetPaymentRequest {
  userId: string
  paymentId: string
}

export interface GetPaymentResponse {
  payment: Payment
}

export class GetPaymentUseCase {
  constructor(
    private paymentRepository: PaymentRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: GetPaymentRequest): Promise<GetPaymentResponse> {
    // 1. 사용자 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 결제 정보 조회
    const payment = await this.paymentRepository.findById(request.paymentId)
    if (!payment) {
      throw new Error('결제 정보를 찾을 수 없습니다')
    }

    // 3. 권한 확인
    const isOwner = payment.userId === request.userId
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      throw new Error('결제 정보를 조회할 권한이 없습니다')
    }

    return {
      payment
    }
  }
}

/**
 * 사용자 결제 목록 조회 유스케이스
 */
export interface ListUserPaymentsRequest {
  userId: string
  targetUserId?: string // 관리자가 다른 사용자의 결제 조회 시
  status?: PaymentStatus[]
  method?: PaymentMethod[]
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface ListUserPaymentsResponse {
  payments: Payment[]
  totalCount: number
  totalAmount: number
  page: number
  pageSize: number
  totalPages: number
}

export class ListUserPaymentsUseCase {
  constructor(
    private paymentRepository: PaymentRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: ListUserPaymentsRequest): Promise<ListUserPaymentsResponse> {
    // 1. 기본값 설정
    const page = request.page || 1
    const pageSize = request.pageSize || 20

    // 2. 요청 사용자 확인
    const requestingUser = await this.userRepository.findById(request.userId)
    if (!requestingUser) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 3. 조회 대상 사용자 결정
    let targetUserId = request.userId
    if (request.targetUserId && request.targetUserId !== request.userId) {
      if (requestingUser.role !== 'admin') {
        throw new Error('다른 사용자의 결제 내역을 조회할 권한이 없습니다')
      }
      targetUserId = request.targetUserId
    }

    // 4. 날짜 범위 처리
    let dateFrom: Date | undefined
    let dateTo: Date | undefined

    if (request.dateFrom) {
      dateFrom = KSTDateTime.fromString(request.dateFrom).toDate()
    }
    if (request.dateTo) {
      dateTo = KSTDateTime.fromString(request.dateTo).toDate()
    }

    // 5. 결제 목록 조회
    const result = await this.paymentRepository.findByUserId(
      targetUserId,
      {
        status: request.status,
        method: request.method,
        dateFrom,
        dateTo,
        page,
        pageSize
      }
    )

    // 6. 총 결제 금액 계산
    const totalAmount = result.payments
      .filter(p => p.isCompleted())
      .reduce((sum, p) => sum + p.amount, 0)

    // 7. 페이지 정보 계산
    const totalPages = Math.ceil(result.totalCount / pageSize)

    return {
      payments: result.payments,
      totalCount: result.totalCount,
      totalAmount,
      page,
      pageSize,
      totalPages
    }
  }
}

/**
 * 결제 요약 정보 조회 유스케이스
 */
export interface GetPaymentSummaryRequest {
  userId: string
  targetUserId?: string
  dateFrom?: string
  dateTo?: string
}

export interface GetPaymentSummaryResponse {
  totalAmount: number
  completedAmount: number
  refundedAmount: number
  count: number
  averageAmount: number
  methodBreakdown: Record<PaymentMethod, {
    count: number
    amount: number
  }>
}

export class GetPaymentSummaryUseCase {
  constructor(
    private paymentRepository: PaymentRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: GetPaymentSummaryRequest): Promise<GetPaymentSummaryResponse> {
    // 1. 요청 사용자 확인
    const requestingUser = await this.userRepository.findById(request.userId)
    if (!requestingUser) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 조회 대상 사용자 결정
    let targetUserId = request.userId
    if (request.targetUserId && request.targetUserId !== request.userId) {
      if (requestingUser.role !== 'admin') {
        throw new Error('다른 사용자의 결제 요약을 조회할 권한이 없습니다')
      }
      targetUserId = request.targetUserId
    }

    // 3. 날짜 범위 처리
    let startDate: KSTDateTime | undefined
    let endDate: KSTDateTime | undefined

    if (request.dateFrom) {
      startDate = KSTDateTime.fromString(request.dateFrom)
    }
    if (request.dateTo) {
      endDate = KSTDateTime.fromString(request.dateTo)
    }

    // 4. 결제 요약 정보 조회
    const summary = await this.paymentRepository.getSummaryByUserId(
      targetUserId,
      startDate,
      endDate
    )

    // 5. 결제 수단별 분석을 위한 전체 결제 조회
    const allPayments = await this.paymentRepository.findByUserId(
      targetUserId,
      {
        dateFrom: startDate?.toDate(),
        dateTo: endDate?.toDate(),
        pageSize: 1000 // 모든 결제 조회
      }
    )

    // 6. 결제 수단별 분석
    const methodBreakdown: Record<string, { count: number; amount: number }> = {}
    
    allPayments.payments.forEach(payment => {
      if (payment.isCompleted()) {
        if (!methodBreakdown[payment.method]) {
          methodBreakdown[payment.method] = { count: 0, amount: 0 }
        }
        methodBreakdown[payment.method].count++
        methodBreakdown[payment.method].amount += payment.amount
      }
    })

    // 7. 평균 금액 계산
    const averageAmount = summary.count > 0 
      ? Math.round(summary.completedAmount / summary.count)
      : 0

    return {
      totalAmount: summary.totalAmount,
      completedAmount: summary.completedAmount,
      refundedAmount: summary.refundedAmount,
      count: summary.count,
      averageAmount,
      methodBreakdown: methodBreakdown as any
    }
  }
}