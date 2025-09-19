/**
 * 결제 정보 관리 Repository
 */

import { getDB } from '@/lib/db/server'
import { logger } from '@/lib/utils/logger'
import { v4 as uuidv4 } from 'uuid'

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

export interface CreatePaymentData {
  reservation_id: string
  user_id: string
  amount: number
  payment_method: string
  payment_status: string
  payment_key?: string
  received_amount?: number
  change_amount?: number
  paid_at?: string
  created_at: string
}

export class PaymentRepository {
  private db: any

  constructor(db?: any) {
    this.db = db || getDB()
  }

  /**
   * 결제 생성
   */
  async create(data: CreatePaymentData): Promise<Payment> {
    try {
      const id = uuidv4()
      const payment: Payment = {
        id,
        ...data,
        created_at: data.created_at || new Date().toISOString()
      }

      const stmt = this.db.prepare(`
        INSERT INTO payments (
          id, reservation_id, user_id, amount,
          payment_method, payment_status, payment_key,
          received_amount, change_amount, paid_at,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      await stmt.bind(
        payment.id,
        payment.reservation_id,
        payment.user_id,
        payment.amount,
        payment.payment_method,
        payment.payment_status,
        payment.payment_key || null,
        payment.received_amount || null,
        payment.change_amount || null,
        payment.paid_at || null,
        payment.created_at
      ).run()

      logger.info('Payment created', { paymentId: payment.id })

      return payment
    } catch (error) {
      logger.error('Failed to create payment', { data, error })
      throw error
    }
  }

  /**
   * ID로 결제 조회
   */
  async findById(id: string): Promise<Payment | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM payments WHERE id = ?')
      const payment = await stmt.bind(id).first()

      return payment || null
    } catch (error) {
      logger.error('Failed to find payment by id', { id, error })
      return null
    }
  }

  /**
   * 예약 ID로 결제 조회
   */
  async findByReservationId(reservationId: string): Promise<Payment | null> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM payments WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1'
      )
      const payment = await stmt.bind(reservationId).first()

      return payment || null
    } catch (error) {
      logger.error('Failed to find payment by reservation id', {
        reservationId,
        error
      })
      return null
    }
  }

  /**
   * 사용자 ID로 결제 목록 조회
   */
  async findByUserId(userId: string): Promise<Payment[]> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC'
      )
      const result = await stmt.bind(userId).all()

      return result?.results || []
    } catch (error) {
      logger.error('Failed to find payments by user id', { userId, error })
      return []
    }
  }

  /**
   * 날짜로 결제 목록 조회
   */
  async findByDate(date: string): Promise<Payment[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM payments
        WHERE date(created_at) = date(?)
        ORDER BY created_at DESC
      `)
      const result = await stmt.bind(date).all()

      return result?.results || []
    } catch (error) {
      logger.error('Failed to find payments by date', { date, error })
      return []
    }
  }

  /**
   * 결제 상태 업데이트
   */
  async updateStatus(
    id: string,
    status: string,
    additionalData?: {
      paid_at?: string
      cancelled_at?: string
      refund_amount?: number
      refund_reason?: string
      admin_notes?: string
    }
  ): Promise<Payment | null> {
    try {
      const updateFields = ['payment_status = ?', 'updated_at = datetime("now")']
      const values = [status]

      if (additionalData?.paid_at) {
        updateFields.push('paid_at = ?')
        values.push(additionalData.paid_at)
      }

      if (additionalData?.cancelled_at) {
        updateFields.push('cancelled_at = ?')
        values.push(additionalData.cancelled_at)
      }

      if (additionalData?.refund_amount !== undefined) {
        updateFields.push('refund_amount = ?')
        values.push(additionalData.refund_amount)
      }

      if (additionalData?.refund_reason) {
        updateFields.push('refund_reason = ?')
        values.push(additionalData.refund_reason)
      }

      if (additionalData?.admin_notes) {
        updateFields.push('admin_notes = ?')
        values.push(additionalData.admin_notes)
      }

      values.push(id) // WHERE clause

      const stmt = this.db.prepare(`
        UPDATE payments
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `)

      await stmt.bind(...values).run()

      logger.info('Payment status updated', { paymentId: id, status })

      return await this.findById(id)
    } catch (error) {
      logger.error('Failed to update payment status', { id, status, error })
      return null
    }
  }

  /**
   * 결제 삭제 (테스트용)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM payments WHERE id = ?')
      await stmt.bind(id).run()

      logger.info('Payment deleted', { paymentId: id })

      return true
    } catch (error) {
      logger.error('Failed to delete payment', { id, error })
      return false
    }
  }
}
