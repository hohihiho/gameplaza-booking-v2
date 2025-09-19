/**
 * 결제 서비스
 * 결제 생성, 검증, 환불 처리 등 비즈니스 로직
 */

import { PaymentRepository } from '@/lib/repositories/payment.repository'
import { AdminPaymentConfigRepository } from '@/lib/repositories/admin-payment-config.repository'
import { ReservationService } from '@/lib/services/reservation.service'
import { AppError, ErrorCodes } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

export interface Payment {
  id: string
  reservation_id: string
  user_id: string
  amount: number
  payment_method: string
  payment_status: string
  payment_key?: string
  receipt_url?: string
  paid_at?: string
  cancelled_at?: string
  refund_amount?: number
  refund_reason?: string
  received_amount?: number
  change_amount?: number
  admin_notes?: string
  created_at: string
  updated_at?: string
}

export interface AdminPaymentConfig {
  id: string
  admin_id: string
  bank_name: string
  account_number: string
  account_holder: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export class PaymentService {
  constructor(
    private paymentRepository: PaymentRepository,
    private reservationService: ReservationService,
    private adminConfigRepository: AdminPaymentConfigRepository
  ) {}

  /**
   * 현금 결제 처리
   */
  async processCashPayment(
    reservationId: string,
    receivedAmount: number,
    adminId?: string
  ): Promise<{
    success: boolean
    payment?: Payment
    error?: string
    change?: number
  }> {
    try {
      // 예약 확인
      const reservation = await this.reservationService.getReservation(reservationId)
      if (!reservation) {
        return { success: false, error: '예약을 찾을 수 없습니다.' }
      }

      // 결제 금액 확인
      const totalAmount = reservation.total_amount || 0
      if (receivedAmount < totalAmount) {
        return {
          success: false,
          error: `결제 금액이 부족합니다. 필요 금액: ${totalAmount}원, 받은 금액: ${receivedAmount}원`
        }
      }

      // 거스름돈 계산
      const change = receivedAmount - totalAmount

      // 결제 생성
      const payment = await this.paymentRepository.create({
        reservation_id: reservationId,
        user_id: reservation.user_id,
        amount: totalAmount,
        payment_method: 'cash',
        payment_status: 'completed',
        received_amount: receivedAmount,
        change_amount: change,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

      // 예약 상태 업데이트
      await this.reservationService.updateStatus(reservationId, 'confirmed')

      logger.info('Cash payment processed', { paymentId: payment.id, reservationId })

      return {
        success: true,
        payment,
        change
      }
    } catch (error) {
      logger.error('Failed to process cash payment', error)
      return { success: false, error: '현금 결제 처리 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 관리자 결제 설정 가져오기
   */
  private async getAdminPaymentConfig(adminId?: string): Promise<AdminPaymentConfig> {
    // 기본 설정이 없으면 초기화
    if (this.adminConfigRepository) {
      await this.adminConfigRepository.initializeDefaultConfigs()
    }

    // adminId가 지정되면 해당 관리자 설정 반환
    if (adminId) {
      const configs = await this.adminConfigRepository.findByAdminId(adminId)
      const activeConfig = configs.find(c => c.is_active)
      if (activeConfig) {
        return activeConfig
      }
    }

    // 기본 설정 반환
    const allConfigs = await this.adminConfigRepository.findAll()
    const defaultConfig = allConfigs.find(c => c.is_active)

    if (!defaultConfig) {
      throw new AppError(
        ErrorCodes.CONFIG_NOT_FOUND,
        '결제 설정이 없습니다. 관리자에게 문의하세요.',
        500
      )
    }

    return defaultConfig
  }

  /**
   * 계좌이체 결제 생성
   */
  async createTransferPayment(
    reservationId: string,
    userId: string,
    amount: number
  ): Promise<Payment> {
    try {
      // 예약 확인
      const reservation = await this.reservationService.getReservation(reservationId)
      if (!reservation) {
        throw new AppError(ErrorCodes.RESERVATION_NOT_FOUND, '예약을 찾을 수 없습니다.', 404)
      }

      // 관리자 계좌 정보 가져오기
      const adminConfig = await this.getAdminPaymentConfig()

      // QR 코드 데이터 생성 (계좌 정보 포함)
      const qrData = {
        bankName: adminConfig.bank_name,
        accountNumber: adminConfig.account_number,
        accountHolder: adminConfig.account_holder,
        amount: amount,
        reservationId: reservationId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30분 후 만료
      }

      // 결제 생성
      const payment = await this.paymentRepository.create({
        reservation_id: reservationId,
        user_id: userId,
        amount: amount,
        payment_method: 'transfer',
        payment_status: 'pending',
        payment_key: JSON.stringify(qrData),
        created_at: new Date().toISOString()
      })

      logger.info('Transfer payment created', { paymentId: payment.id, reservationId })

      return payment
    } catch (error) {
      logger.error('Failed to create transfer payment', error)
      throw error
    }
  }

  /**
   * 계좌이체 결제 요청 (테스트용)
   */
  async requestTransferPayment(data: {
    reservationId: string
    userId: string
    amount: number
    paymentMethod: string
    bankAccount?: {
      bankName: string
      accountNumber: string
      accountHolder: string
    }
  }): Promise<Payment> {
    return this.createTransferPayment(
      data.reservationId,
      data.userId,
      data.amount
    )
  }

  /**
   * 계좌이체 결제 확인
   */
  async confirmTransferPayment(
    paymentId: string,
    adminId: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // 결제 확인
      const payment = await this.paymentRepository.findById(paymentId)
      if (!payment) {
        return { success: false, error: '결제를 찾을 수 없습니다.' }
      }

      if (payment.payment_status === 'completed') {
        return { success: false, error: '이미 완료된 결제입니다.' }
      }

      // 결제 상태 업데이트
      await this.paymentRepository.updateStatus(paymentId, 'completed', {
        paid_at: new Date().toISOString(),
        admin_notes: `관리자 ${adminId}가 입금 확인`
      })

      // 예약 상태 업데이트
      await this.reservationService.updateStatus(payment.reservation_id, 'confirmed')

      logger.info('Transfer payment confirmed', { paymentId, adminId })

      return { success: true }
    } catch (error) {
      logger.error('Failed to confirm transfer payment', error)
      return { success: false, error: '계좌이체 확인 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 결제 취소 (환불 전 단계)
   */
  async cancelPayment(
    paymentId: string,
    reason: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // 결제 확인
      const payment = await this.paymentRepository.findById(paymentId)
      if (!payment) {
        return { success: false, error: '결제를 찾을 수 없습니다.' }
      }

      if (payment.payment_status === 'cancelled') {
        return { success: false, error: '이미 취소된 결제입니다.' }
      }

      // 결제 취소
      await this.paymentRepository.updateStatus(paymentId, 'cancelled', {
        cancelled_at: new Date().toISOString(),
        refund_reason: reason
      })

      // 예약 취소
      await this.reservationService.updateStatus(payment.reservation_id, 'cancelled')

      logger.info('Payment cancelled', { paymentId, reason })

      return { success: true }
    } catch (error) {
      logger.error('Failed to cancel payment', error)
      return { success: false, error: '결제 취소 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 사용자별 결제 내역 조회
   */
  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      return await this.paymentRepository.findByUserId(userId)
    } catch (error) {
      logger.error('Failed to get user payments', error)
      return []
    }
  }

  /**
   * 일별 매출 통계 조회
   */
  async getDailySalesStats(date: string): Promise<{
    totalAmount: number
    totalCount: number
    byPaymentMethod: Record<string, { amount: number; count: number }>
  }> {
    try {
      const payments = await this.paymentRepository.findByDate(date)

      const stats = {
        totalAmount: 0,
        totalCount: payments.length,
        byPaymentMethod: {} as Record<string, { amount: number; count: number }>
      }

      payments.forEach(payment => {
        if (payment.payment_status === 'completed') {
          stats.totalAmount += payment.amount

          if (!stats.byPaymentMethod[payment.payment_method]) {
            stats.byPaymentMethod[payment.payment_method] = { amount: 0, count: 0 }
          }

          stats.byPaymentMethod[payment.payment_method].amount += payment.amount
          stats.byPaymentMethod[payment.payment_method].count++
        }
      })

      return stats
    } catch (error) {
      logger.error('Failed to get daily sales stats', error)
      throw error
    }
  }

  /**
   * 결제 검증
   */
  async verifyPayment(paymentId: string): Promise<{
    valid: boolean
    error?: string
  }> {
    try {
      const payment = await this.paymentRepository.findById(paymentId)

      if (!payment) {
        return { valid: false, error: '결제를 찾을 수 없습니다.' }
      }

      if (payment.payment_status !== 'completed') {
        return { valid: false, error: '완료되지 않은 결제입니다.' }
      }

      // 예약과 금액 일치 확인
      const reservation = await this.reservationService.getReservation(payment.reservation_id)
      if (reservation && reservation.total_amount !== payment.amount) {
        return { valid: false, error: '결제 금액이 예약 금액과 일치하지 않습니다.' }
      }

      return { valid: true }
    } catch (error) {
      logger.error('Failed to verify payment', error)
      return { valid: false, error: '결제 검증 중 오류가 발생했습니다.' }
    }
  }
}