/**
 * 환불 정보 관리 Repository
 */

import { getDB } from '@/lib/db/server'
import { logger } from '@/lib/utils/logger'
import { v4 as uuidv4 } from 'uuid'

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

export interface CreateRefundData {
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
}

export class RefundRepository {
  private db: any

  constructor(db?: any) {
    this.db = db || getDB()
  }

  /**
   * 환불 요청 생성
   */
  async create(data: CreateRefundData): Promise<Refund> {
    try {
      const id = uuidv4()
      const refund: Refund = {
        id,
        ...data,
        created_at: data.created_at || new Date().toISOString()
      }

      const stmt = this.db.prepare(`
        INSERT INTO refunds (
          id, payment_id, reservation_id, user_id,
          amount, reason, status, admin_id, admin_notes,
          requested_at, processed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      await stmt.bind(
        refund.id,
        refund.payment_id,
        refund.reservation_id,
        refund.user_id,
        refund.amount,
        refund.reason,
        refund.status,
        refund.admin_id || null,
        refund.admin_notes || null,
        refund.requested_at,
        refund.processed_at || null,
        refund.created_at
      ).run()

      logger.info('Refund created', { refundId: refund.id })

      return refund
    } catch (error) {
      logger.error('Failed to create refund', { data, error })
      throw error
    }
  }

  /**
   * ID로 환불 조회
   */
  async findById(id: string): Promise<Refund | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM refunds WHERE id = ?')
      const refund = await stmt.bind(id).first()

      return refund || null
    } catch (error) {
      logger.error('Failed to find refund by id', { id, error })
      return null
    }
  }

  /**
   * 결제 ID로 환불 목록 조회
   */
  async findByPaymentId(paymentId: string): Promise<Refund[]> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM refunds WHERE payment_id = ? ORDER BY created_at DESC'
      )
      const result = await stmt.bind(paymentId).all()

      return result?.results || []
    } catch (error) {
      logger.error('Failed to find refunds by payment id', {
        paymentId,
        error
      })
      return []
    }
  }

  /**
   * 사용자 ID로 환불 목록 조회
   */
  async findByUserId(userId: string): Promise<Refund[]> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM refunds WHERE user_id = ? ORDER BY created_at DESC'
      )
      const result = await stmt.bind(userId).all()

      return result?.results || []
    } catch (error) {
      logger.error('Failed to find refunds by user id', { userId, error })
      return []
    }
  }

  /**
   * 전체 환불 목록 조회
   */
  async findAll(): Promise<Refund[]> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM refunds ORDER BY created_at DESC'
      )
      const result = await stmt.all()

      return result?.results || []
    } catch (error) {
      logger.error('Failed to find all refunds', error)
      return []
    }
  }

  /**
   * 환불 상태 업데이트
   */
  async updateStatus(
    id: string,
    status: string,
    additionalData?: {
      admin_id?: string
      admin_notes?: string
      processed_at?: string
    }
  ): Promise<Refund | null> {
    try {
      const updateFields = ['status = ?', 'updated_at = datetime("now")']
      const values = [status]

      if (additionalData?.admin_id) {
        updateFields.push('admin_id = ?')
        values.push(additionalData.admin_id)
      }

      if (additionalData?.admin_notes) {
        updateFields.push('admin_notes = ?')
        values.push(additionalData.admin_notes)
      }

      if (additionalData?.processed_at) {
        updateFields.push('processed_at = ?')
        values.push(additionalData.processed_at)
      }

      values.push(id) // WHERE clause

      const stmt = this.db.prepare(`
        UPDATE refunds
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `)

      await stmt.bind(...values).run()

      logger.info('Refund status updated', { refundId: id, status })

      return await this.findById(id)
    } catch (error) {
      logger.error('Failed to update refund status', { id, status, error })
      return null
    }
  }

  /**
   * 환불 삭제 (테스트용)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM refunds WHERE id = ?')
      await stmt.bind(id).run()

      logger.info('Refund deleted', { refundId: id })

      return true
    } catch (error) {
      logger.error('Failed to delete refund', { id, error })
      return false
    }
  }
}
