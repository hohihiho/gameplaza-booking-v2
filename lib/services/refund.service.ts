/**
 * 환불 서비스
 * 환불 생성, 처리, 조회 등 비즈니스 로직
 */

import { RefundRepository } from '@/lib/repositories/refund.repository'
import { PaymentRepository } from '@/lib/repositories/payment.repository'
import { AppError, ErrorCodes } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

export interface Refund {
  id: string
  payment_id: string
  reservation_id: string
  user_id: string
  amount: number
  reason: string
  status: string
  admin_id?: string
  admin_notes?: string
  requested_at: string
  processed_at?: string
  created_at: string
  updated_at?: string
}

export class RefundService {
  constructor(
    private refundRepository: RefundRepository,
    private paymentRepository: PaymentRepository
  ) {}

  /**
   * 환불 요청 생성
   */
  async createRefundRequest(
    paymentId: string,
    userId: string,
    reason: string,
    amount?: number
  ): Promise<{
    success: boolean
    refund?: Refund
    error?: string
  }> {
    try {
      // 결제 확인
      const payment = await this.paymentRepository.findById(paymentId)
      if (!payment) {
        return { success: false, error: '결제를 찾을 수 없습니다.' }
      }

      // 권한 확인
      if (payment.user_id !== userId) {
        return { success: false, error: '본인의 결제만 환불 요청할 수 있습니다.' }
      }

      // 결제 상태 확인
      if (payment.payment_status !== 'completed') {
        return { success: false, error: '완료된 결제만 환불 요청할 수 있습니다.' }
      }

      // 이미 환불된 결제인지 확인
      const existingRefunds = await this.refundRepository.findByPaymentId(paymentId)
      const completedRefund = existingRefunds.find(r => r.status === 'completed')
      if (completedRefund) {
        return { success: false, error: '이미 환불된 결제입니다.' }
      }

      // 환불 금액 설정 (미지정시 전액)
      const refundAmount = amount || payment.amount

      // 부분 환불 확인
      if (refundAmount > payment.amount) {
        return { success: false, error: '결제 금액보다 큰 금액은 환불할 수 없습니다.' }
      }

      // 환불 요청 생성
      const refund = await this.refundRepository.create({
        payment_id: paymentId,
        reservation_id: payment.reservation_id,
        user_id: userId,
        amount: refundAmount,
        reason: reason,
        status: 'requested',
        requested_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

      logger.info('Refund request created', { refundId: refund.id, paymentId })

      return { success: true, refund }
    } catch (error) {
      logger.error('Failed to create refund request', error)
      return { success: false, error: '환불 요청 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 환불 처리 (관리자)
   */
  async processRefund(
    refundId: string,
    adminId: string,
    action: 'approve' | 'reject',
    adminNotes?: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // 환불 요청 확인
      const refund = await this.refundRepository.findById(refundId)
      if (!refund) {
        return { success: false, error: '환불 요청을 찾을 수 없습니다.' }
      }

      // 상태 확인
      if (refund.status !== 'requested') {
        return { success: false, error: '처리 대기 중인 환불 요청만 처리할 수 있습니다.' }
      }

      const newStatus = action === 'approve' ? 'completed' : 'rejected'

      // 환불 상태 업데이트
      await this.refundRepository.updateStatus(refundId, newStatus, {
        admin_id: adminId,
        admin_notes: adminNotes,
        processed_at: new Date().toISOString()
      })

      // 승인된 경우 결제 상태 업데이트
      if (action === 'approve') {
        await this.paymentRepository.updateStatus(refund.payment_id, 'refunded', {
          refund_amount: refund.amount,
          refund_reason: refund.reason
        })
      }

      logger.info('Refund processed', { refundId, action, adminId })

      return { success: true }
    } catch (error) {
      logger.error('Failed to process refund', error)
      return { success: false, error: '환불 처리 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 24시간 내 취소 시 전체 환불 처리
   */
  async processFullRefundWithin24Hours(
    paymentId: string,
    userId: string
  ): Promise<{
    success: boolean
    refund?: Refund
    error?: string
  }> {
    try {
      // 결제 확인
      const payment = await this.paymentRepository.findById(paymentId)
      if (!payment) {
        return { success: false, error: '결제를 찾을 수 없습니다.' }
      }

      // 24시간 내 확인
      const paymentTime = new Date(payment.created_at).getTime()
      const currentTime = Date.now()
      const hoursSincePay = (currentTime - paymentTime) / (1000 * 60 * 60)

      if (hoursSincePay > 24) {
        return { success: false, error: '24시간이 지난 결제는 전액 환불이 불가능합니다.' }
      }

      // 환불 요청 생성 및 자동 승인
      const refund = await this.refundRepository.create({
        payment_id: paymentId,
        reservation_id: payment.reservation_id,
        user_id: userId,
        amount: payment.amount,
        reason: '24시간 내 취소 - 전액 환불',
        status: 'completed',
        requested_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        admin_notes: '시스템 자동 승인',
        created_at: new Date().toISOString()
      })

      // 결제 상태 업데이트
      await this.paymentRepository.updateStatus(paymentId, 'refunded', {
        refund_amount: payment.amount,
        refund_reason: '24시간 내 취소'
      })

      logger.info('Full refund within 24 hours processed', { refundId: refund.id, paymentId })

      return { success: true, refund }
    } catch (error) {
      logger.error('Failed to process full refund within 24 hours', error)
      return { success: false, error: '전액 환불 처리 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 패널티 적용 부분 환불 처리 (24시간 후)
   */
  async processPartialRefundWithPenalty(
    paymentId: string,
    userId: string,
    penaltyRate: number = 0.1 // 10% 패널티
  ): Promise<{
    success: boolean
    refund?: Refund
    penaltyAmount?: number
    refundAmount?: number
    error?: string
  }> {
    try {
      // 결제 확인
      const payment = await this.paymentRepository.findById(paymentId)
      if (!payment) {
        return { success: false, error: '결제를 찾을 수 없습니다.' }
      }

      // 패널티 계산
      const penaltyAmount = Math.floor(payment.amount * penaltyRate)
      const refundAmount = payment.amount - penaltyAmount

      // 환불 요청 생성
      const refund = await this.refundRepository.create({
        payment_id: paymentId,
        reservation_id: payment.reservation_id,
        user_id: userId,
        amount: refundAmount,
        reason: `24시간 후 취소 - ${penaltyRate * 100}% 패널티 적용`,
        status: 'requested',
        requested_at: new Date().toISOString(),
        admin_notes: `패널티: ${penaltyAmount}원`,
        created_at: new Date().toISOString()
      })

      logger.info('Partial refund with penalty created', {
        refundId: refund.id,
        paymentId,
        penaltyAmount,
        refundAmount
      })

      return {
        success: true,
        refund,
        penaltyAmount,
        refundAmount
      }
    } catch (error) {
      logger.error('Failed to process partial refund with penalty', error)
      return { success: false, error: '부분 환불 처리 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 노쇼 결제는 환불 불가
   */
  async checkNoShowRefundEligibility(
    paymentId: string
  ): Promise<{
    eligible: boolean
    reason?: string
  }> {
    try {
      // 여기서는 예약 상태를 확인해야 하지만,
      // 현재 구조상 payment와 reservation을 직접 연결하는 것이 어려우므로
      // 환불 사유를 확인하는 방식으로 처리

      const refunds = await this.refundRepository.findByPaymentId(paymentId)
      const noShowRefund = refunds.find(r => r.reason.includes('노쇼'))

      if (noShowRefund) {
        return { eligible: false, reason: '노쇼 예약은 환불이 불가능합니다.' }
      }

      return { eligible: true }
    } catch (error) {
      logger.error('Failed to check no-show refund eligibility', error)
      return { eligible: false, reason: '환불 자격 확인 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 사용자별 환불 내역 조회
   */
  async getUserRefunds(userId: string): Promise<Refund[]> {
    try {
      return await this.refundRepository.findByUserId(userId)
    } catch (error) {
      logger.error('Failed to get user refunds', error)
      return []
    }
  }

  /**
   * 관리자용 전체 환불 목록 조회
   */
  async getAllRefunds(
    status?: string,
    limit: number = 50
  ): Promise<Refund[]> {
    try {
      const allRefunds = await this.refundRepository.findAll()

      let filteredRefunds = allRefunds
      if (status) {
        filteredRefunds = allRefunds.filter(r => r.status === status)
      }

      // 최근 순으로 정렬하고 제한
      return filteredRefunds
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
    } catch (error) {
      logger.error('Failed to get all refunds', error)
      return []
    }
  }

  /**
   * 환불 통계 조회
   */
  async getRefundStats(): Promise<{
    totalCount: number
    totalAmount: number
    byStatus: Record<string, { count: number; amount: number }>
    averageProcessingTime: number
  }> {
    try {
      const allRefunds = await this.refundRepository.findAll()

      const stats = {
        totalCount: allRefunds.length,
        totalAmount: 0,
        byStatus: {} as Record<string, { count: number; amount: number }>,
        averageProcessingTime: 0
      }

      let totalProcessingTime = 0
      let processedCount = 0

      allRefunds.forEach(refund => {
        stats.totalAmount += refund.amount

        if (!stats.byStatus[refund.status]) {
          stats.byStatus[refund.status] = { count: 0, amount: 0 }
        }

        stats.byStatus[refund.status].count++
        stats.byStatus[refund.status].amount += refund.amount

        // 처리 시간 계산
        if (refund.processed_at && refund.requested_at) {
          const processingTime =
            new Date(refund.processed_at).getTime() - new Date(refund.requested_at).getTime()
          totalProcessingTime += processingTime
          processedCount++
        }
      })

      // 평균 처리 시간 (밀리초 -> 시간)
      if (processedCount > 0) {
        stats.averageProcessingTime = totalProcessingTime / processedCount / (1000 * 60 * 60)
      }

      return stats
    } catch (error) {
      logger.error('Failed to get refund stats', error)
      throw error
    }
  }
}