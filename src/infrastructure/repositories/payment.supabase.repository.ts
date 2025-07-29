import { Payment, PaymentStatus, PaymentMethod } from '@/src/domain/entities/payment'
import { PaymentRepository, PaymentFilterOptions, PaymentListResult, PaymentSummary } from '@/src/domain/repositories/payment.repository.interface'
import { SupabaseClient } from '@supabase/supabase-js'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

/**
 * Payment Supabase Repository 구현
 */
export class PaymentSupabaseRepository implements PaymentRepository {
  constructor(
    private readonly supabase: SupabaseClient<any, 'public', any>
  ) {}

  async findById(id: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomainEntity(data)
  }

  async findByReservationId(reservationId: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomainEntity(data)
  }

  async findByUserId(userId: string, options?: PaymentFilterOptions): Promise<PaymentListResult> {
    let query = this.supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // 필터 적용
    if (options?.status) {
      query = query.in('status', options.status)
    }

    if (options?.method) {
      query = query.in('method', options.method)
    }

    if (options?.dateFrom) {
      query = query.gte('created_at', options.dateFrom.toISOString())
    }

    if (options?.dateTo) {
      query = query.lte('created_at', options.dateTo.toISOString())
    }

    if (options?.minAmount !== undefined) {
      query = query.gte('amount', options.minAmount)
    }

    if (options?.maxAmount !== undefined) {
      query = query.lte('amount', options.maxAmount)
    }

    // 정렬
    query = query.order('created_at', { ascending: false })

    // 페이지네이션
    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const payments = (data || []).map(item => this.toDomainEntity(item))

    return {
      payments,
      totalCount: count || 0
    }
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomainEntity(data)
  }

  async findByDateRange(
    startDate: KSTDateTime,
    endDate: KSTDateTime,
    options?: PaymentFilterOptions
  ): Promise<PaymentListResult> {
    let query = this.supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // 필터 적용
    if (options?.status) {
      query = query.in('status', options.status)
    }

    if (options?.method) {
      query = query.in('method', options.method)
    }

    if (options?.minAmount !== undefined) {
      query = query.gte('amount', options.minAmount)
    }

    if (options?.maxAmount !== undefined) {
      query = query.lte('amount', options.maxAmount)
    }

    // 정렬
    query = query.order('created_at', { ascending: false })

    // 페이지네이션
    const page = options?.page || 1
    const pageSize = options?.pageSize || 50
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const payments = (data || []).map(item => this.toDomainEntity(item))

    return {
      payments,
      totalCount: count || 0
    }
  }

  async getSummaryByUserId(userId: string, startDate?: KSTDateTime, endDate?: KSTDateTime): Promise<PaymentSummary> {
    let query = this.supabase
      .from('payments')
      .select('status, amount')
      .eq('user_id', userId)

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return this.calculateSummary(data || [])
  }

  async getSummaryByDateRange(startDate: KSTDateTime, endDate: KSTDateTime): Promise<PaymentSummary> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('status, amount, refunded_amount')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) {
      throw error
    }

    return this.calculateSummary(data || [])
  }

  async save(payment: Payment): Promise<Payment> {
    const dto = this.toDTO(payment)
    
    const { data, error } = await this.supabase
      .from('payments')
      .insert(dto)
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.toDomainEntity(data)
  }

  async update(payment: Payment): Promise<Payment> {
    const dto = this.toDTO(payment)
    const { id, ...updateData } = dto
    
    const { data, error } = await this.supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.toDomainEntity(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  }

  /**
   * DB 데이터를 도메인 엔티티로 변환
   */
  private toDomainEntity(data: any): Payment {
    return new Payment({
      id: data.id,
      reservationId: data.reservation_id,
      userId: data.user_id,
      amount: data.amount,
      method: data.method as PaymentMethod,
      status: data.status as PaymentStatus,
      transactionId: data.transaction_id,
      receiptNumber: data.receipt_number,
      paidAt: data.paid_at ? KSTDateTime.create(new Date(data.paid_at)) : undefined,
      cancelledAt: data.cancelled_at ? KSTDateTime.create(new Date(data.cancelled_at)) : undefined,
      cancelledReason: data.cancelled_reason,
      refundedAt: data.refunded_at ? KSTDateTime.create(new Date(data.refunded_at)) : undefined,
      refundedAmount: data.refunded_amount,
      refundReason: data.refund_reason,
      metadata: data.metadata,
      createdAt: KSTDateTime.create(new Date(data.created_at)),
      updatedAt: KSTDateTime.create(new Date(data.updated_at))
    })
  }

  /**
   * 도메인 엔티티를 DB DTO로 변환
   */
  private toDTO(payment: Payment): any {
    return {
      id: payment.id,
      reservation_id: payment.reservationId,
      user_id: payment.userId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      transaction_id: payment.transactionId,
      receipt_number: payment.receiptNumber,
      paid_at: payment.paidAt?.toISOString(),
      cancelled_at: payment.cancelledAt?.toISOString(),
      cancelled_reason: payment.cancelledReason,
      refunded_at: payment.refundedAt?.toISOString(),
      refunded_amount: payment.refundedAmount,
      refund_reason: payment.refundReason,
      metadata: payment.metadata,
      created_at: payment.createdAt.toISOString(),
      updated_at: payment.updatedAt.toISOString()
    }
  }

  /**
   * 요약 정보 계산
   */
  private calculateSummary(data: any[]): PaymentSummary {
    let totalAmount = 0
    let completedAmount = 0
    let refundedAmount = 0
    let count = 0

    data.forEach(item => {
      count++
      totalAmount += item.amount || 0
      
      if (item.status === 'completed' || item.status === 'partial_refunded' || item.status === 'refunded') {
        completedAmount += item.amount || 0
      }
      
      if (item.status === 'refunded' || item.status === 'partial_refunded') {
        refundedAmount += item.refunded_amount || 0
      }
    })

    return {
      totalAmount,
      completedAmount,
      refundedAmount,
      count
    }
  }
}