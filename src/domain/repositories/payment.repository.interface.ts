import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment'
import { KSTDateTime } from '../value-objects/kst-datetime'

export interface PaymentFilterOptions {
  status?: PaymentStatus[]
  method?: PaymentMethod[]
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
  page?: number
  pageSize?: number
}

export interface PaymentListResult {
  payments: Payment[]
  totalCount: number
}

export interface PaymentSummary {
  totalAmount: number
  completedAmount: number
  refundedAmount: number
  count: number
}

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>
  findByReservationId(reservationId: string): Promise<Payment | null>
  findByUserId(userId: string, options?: PaymentFilterOptions): Promise<PaymentListResult>
  findByTransactionId(transactionId: string): Promise<Payment | null>
  findByDateRange(
    startDate: KSTDateTime,
    endDate: KSTDateTime,
    options?: PaymentFilterOptions
  ): Promise<PaymentListResult>
  getSummaryByUserId(userId: string, startDate?: KSTDateTime, endDate?: KSTDateTime): Promise<PaymentSummary>
  getSummaryByDateRange(startDate: KSTDateTime, endDate: KSTDateTime): Promise<PaymentSummary>
  save(payment: Payment): Promise<Payment>
  update(payment: Payment): Promise<Payment>
  delete(id: string): Promise<void>
}