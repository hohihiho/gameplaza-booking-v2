import { createClient } from '@supabase/supabase-js'
import { SupabaseReservationRepositoryV2 } from '../supabase-reservation.repository.v2'
import { Reservation } from '../../../domain/entities/reservation'
import { KSTDateTime } from '../../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../../domain/value-objects/time-slot'
import { ReservationStatus } from '../../../domain/value-objects/reservation-status'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  channel: jest.fn().mockReturnThis(),
  send: jest.fn()
}

describe('SupabaseReservationRepositoryV2', () => {
  let repository: SupabaseReservationRepositoryV2

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new SupabaseReservationRepositoryV2(mockSupabase as any)
  })

  describe('findById', () => {
    it('예약을 ID로 조회할 수 있다', async () => {
      const mockReservationData = {
        id: 'test-id',
        user_id: 'user-123',
        device_id: 'device-456',
        date: '2025-07-01',
        start_time: '14:00',
        end_time: '16:00',
        status: 'pending',
        reservation_number: '250701-001',
        player_count: 1,
        total_amount: 20000,
        user_notes: '테스트 예약',
        credit_type: 'freeplay',
        created_at: '2025-07-01T12:00:00Z',
        updated_at: '2025-07-01T12:00:00Z'
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReservationData,
        error: null
      })

      const result = await repository.findById('test-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('reservations')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-id')
      expect(result).toBeTruthy()
      expect(result?.id).toBe('test-id')
      expect(result?.userId).toBe('user-123')
    })

    it('존재하지 않는 예약은 null을 반환한다', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      const result = await repository.findById('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('save', () => {
    it('새 예약을 저장할 수 있다', async () => {
      const reservation = Reservation.create({
        userId: 'user-123',
        deviceId: 'device-456',
        date: KSTDateTime.fromString('2025-07-01'),
        timeSlot: TimeSlot.create('14:00', '16:00'),
        status: ReservationStatus.create('pending'),
        reservationNumber: 'TEMP-001'
      })

      const mockSavedData = {
        id: 'generated-id',
        user_id: 'user-123',
        device_id: 'device-456',
        date: '2025-07-01',
        start_time: '14:00',
        end_time: '16:00',
        status: 'pending',
        reservation_number: '250701-001',
        player_count: 1,
        total_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSavedData,
        error: null
      })

      // count 모킹
      repository.countByDate = jest.fn().mockResolvedValueOnce(0)

      const result = await repository.save(reservation)

      expect(mockSupabase.from).toHaveBeenCalledWith('reservations')
      expect(mockSupabase.insert).toHaveBeenCalled()
      expect(result.id).toBe('generated-id')
      expect(result.reservationNumber).toBe('250701-001')
    })
  })

  describe('update', () => {
    it('예약 상태를 업데이트할 수 있다', async () => {
      const reservation = Reservation.create({
        id: 'test-id',
        userId: 'user-123',
        deviceId: 'device-456',
        date: KSTDateTime.fromString('2025-07-01'),
        timeSlot: TimeSlot.create('14:00', '16:00'),
        status: ReservationStatus.create('approved'),
        reservationNumber: '250701-001'
      })

      const mockUpdatedData = {
        ...reservation,
        status: 'approved',
        updated_at: new Date().toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUpdatedData,
        error: null
      })

      const result = await repository.update(reservation)

      expect(mockSupabase.from).toHaveBeenCalledWith('reservations')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'approved',
        updated_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-id')
    })
  })
})