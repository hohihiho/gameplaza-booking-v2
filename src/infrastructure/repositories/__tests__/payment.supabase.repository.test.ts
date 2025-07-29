import { PaymentSupabaseRepository } from '../payment.supabase.repository'
import { Payment, PaymentStatus, PaymentMethod } from '@/src/domain/entities/payment'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
} as any

describe('PaymentSupabaseRepository', () => {
  let repository: PaymentSupabaseRepository
  
  beforeEach(() => {
    repository = new PaymentSupabaseRepository(mockSupabase)
    jest.clearAllMocks()
  })

  const createMockPaymentData = () => ({
    id: 'payment-123',
    reservation_id: 'res-456',
    user_id: 'user-789',
    amount: 30000,
    method: 'cash' as PaymentMethod,
    status: 'completed' as PaymentStatus,
    transaction_id: 'ONSITE-1234567890',
    receipt_number: 'REC-001',
    paid_at: '2025-01-24T10:00:00Z',
    cancelled_at: null,
    cancelled_reason: null,
    refunded_at: null,
    refunded_amount: null,
    refund_reason: null,
    metadata: { location: 'onsite' },
    created_at: '2025-01-24T09:00:00Z',
    updated_at: '2025-01-24T10:00:00Z'
  })

  describe('findById', () => {
    it('should find payment by id', async () => {
      const mockData = createMockPaymentData()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.findById('payment-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'payment-123')
      expect(result).toBeInstanceOf(Payment)
      expect(result?.id).toBe('payment-123')
    })

    it('should return null when payment not found', async () => {
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByReservationId', () => {
    it('should find payment by reservation id', async () => {
      const mockData = createMockPaymentData()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.findByReservationId('res-456')

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.eq).toHaveBeenCalledWith('reservation_id', 'res-456')
      expect(result).toBeInstanceOf(Payment)
      expect(result?.reservationId).toBe('res-456')
    })
  })

  describe('findByUserId', () => {
    it('should find payments by user id with filters', async () => {
      const mockData = [createMockPaymentData()]
      mockSupabase.range = jest.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })

      const result = await repository.findByUserId('user-789', {
        status: ['completed'],
        method: ['cash'],
        page: 1,
        pageSize: 20
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' })
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-789')
      expect(result.payments).toHaveLength(1)
      expect(result.totalCount).toBe(1)
    })
  })

  describe('findByTransactionId', () => {
    it('should find payment by transaction id', async () => {
      const mockData = createMockPaymentData()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.findByTransactionId('ONSITE-1234567890')

      expect(mockSupabase.eq).toHaveBeenCalledWith('transaction_id', 'ONSITE-1234567890')
      expect(result).toBeInstanceOf(Payment)
      expect(result?.transactionId).toBe('ONSITE-1234567890')
    })
  })

  describe('findByDateRange', () => {
    it('should find payments by date range', async () => {
      const mockData = [createMockPaymentData()]
      const startDate = KSTDateTime.create(new Date('2025-01-01'))
      const endDate = KSTDateTime.create(new Date('2025-01-31'))
      
      mockSupabase.range = jest.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })

      const result = await repository.findByDateRange(startDate, endDate)

      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', startDate.toISOString())
      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', endDate.toISOString())
      expect(result.payments).toHaveLength(1)
    })
  })

  describe('getSummaryByUserId', () => {
    it('should calculate payment summary for user', async () => {
      const mockData = [
        { status: 'completed', amount: 30000 },
        { status: 'refunded', amount: 20000, refunded_amount: 20000 }
      ]
      // getSummaryByUserId 체인의 끝: select().eq()
      mockSupabase.eq = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.getSummaryByUserId('user-789')

      expect(mockSupabase.select).toHaveBeenCalledWith('status, amount')
      expect(result.totalAmount).toBe(50000)
      expect(result.completedAmount).toBe(50000)
      expect(result.refundedAmount).toBe(20000)
      expect(result.count).toBe(2)
    })
  })

  describe('getSummaryByDateRange', () => {
    it('should calculate payment summary for date range', async () => {
      const mockData = [
        { status: 'completed', amount: 30000, refunded_amount: 0 },
        { status: 'partial_refunded', amount: 20000, refunded_amount: 5000 }
      ]
      const startDate = KSTDateTime.create(new Date('2025-01-01'))
      const endDate = KSTDateTime.create(new Date('2025-01-31'))
      
      // getSummaryByDateRange 체인의 끝: select().gte().lte()
      mockSupabase.lte = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.getSummaryByDateRange(startDate, endDate)

      expect(mockSupabase.select).toHaveBeenCalledWith('status, amount, refunded_amount')
      expect(result.totalAmount).toBe(50000)
      expect(result.completedAmount).toBe(50000)
      expect(result.refundedAmount).toBe(5000)
      expect(result.count).toBe(2)
    })
  })

  describe('save', () => {
    it('should save a new payment', async () => {
      const payment = Payment.create({
        id: 'payment-123',
        reservationId: 'res-456',
        userId: 'user-789',
        amount: 30000,
        method: 'cash',
        createdAt: KSTDateTime.now(),
        updatedAt: KSTDateTime.now()
      })

      const mockData = createMockPaymentData()
      // save 체인의 끝: insert().select().single()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.save(payment)

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.insert).toHaveBeenCalled()
      expect(mockSupabase.select).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Payment)
    })

    it('should throw error when save fails', async () => {
      const payment = Payment.create({
        id: 'payment-123',
        reservationId: 'res-456',
        userId: 'user-789',
        amount: 30000,
        method: 'cash',
        createdAt: KSTDateTime.now(),
        updatedAt: KSTDateTime.now()
      })

      const mockError = new Error('Database error')
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: null, error: mockError })

      await expect(repository.save(payment)).rejects.toThrow('Database error')
    })
  })

  describe('update', () => {
    it('should update an existing payment', async () => {
      const payment = Payment.create({
        id: 'payment-123',
        reservationId: 'res-456',
        userId: 'user-789',
        amount: 30000,
        method: 'cash',
        createdAt: KSTDateTime.now(),
        updatedAt: KSTDateTime.now()
      })

      // Complete the payment
      payment.completeOnSite('REC-001')

      const mockData = createMockPaymentData()
      // update 체인을 완전히 재설정
      mockSupabase.update = jest.fn().mockReturnThis()
      mockSupabase.eq = jest.fn().mockReturnThis()
      mockSupabase.select = jest.fn().mockReturnThis()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.update(payment)

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'payment-123')
      expect(result).toBeInstanceOf(Payment)
    })
  })

  describe('delete', () => {
    it('should delete a payment', async () => {
      // delete 체인의 끝: delete().eq()
      mockSupabase.eq = jest.fn().mockResolvedValueOnce({ error: null })

      await repository.delete('payment-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'payment-123')
    })

    it('should throw error when delete fails', async () => {
      const mockError = new Error('Delete failed')
      mockSupabase.eq = jest.fn().mockResolvedValueOnce({ error: mockError })

      await expect(repository.delete('payment-123')).rejects.toThrow('Delete failed')
    })
  })

  describe('domain entity mapping', () => {
    it('should correctly map DB data to domain entity', async () => {
      const mockData = createMockPaymentData()
      // findById 체인을 완전히 재설정
      mockSupabase.select = jest.fn().mockReturnThis()
      mockSupabase.eq = jest.fn().mockReturnThis()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.findById('payment-123')

      expect(result).toBeInstanceOf(Payment)
      expect(result!.id).toBe('payment-123')
      expect(result!.reservationId).toBe('res-456')
      expect(result!.userId).toBe('user-789')
      expect(result!.amount).toBe(30000)
      expect(result!.method).toBe('cash')
      expect(result!.status).toBe('completed')
      expect(result!.transactionId).toBe('ONSITE-1234567890')
      expect(result!.receiptNumber).toBe('REC-001')
    })

    it('should correctly map domain entity to DB DTO', async () => {
      const payment = Payment.create({
        id: 'payment-123',
        reservationId: 'res-456',
        userId: 'user-789',
        amount: 30000,
        method: 'cash',
        createdAt: KSTDateTime.now(),
        updatedAt: KSTDateTime.now()
      })

      const mockData = createMockPaymentData()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      await repository.save(payment)

      // Check that insert was called with correct DTO structure
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall).toMatchObject({
        id: 'payment-123',
        reservation_id: 'res-456',
        user_id: 'user-789',
        amount: 30000,
        method: 'cash',
        status: 'pending'
      })
    })
  })

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Connection timeout')
      // findByUserId 체인을 완전히 재설정
      mockSupabase.select = jest.fn().mockReturnThis()
      mockSupabase.eq = jest.fn().mockReturnThis()
      mockSupabase.order = jest.fn().mockReturnThis()
      mockSupabase.range = jest.fn().mockResolvedValueOnce({ data: null, error: mockError })

      await expect(
        repository.findByUserId('user-123')
      ).rejects.toThrow('Connection timeout')
    })
  })
})