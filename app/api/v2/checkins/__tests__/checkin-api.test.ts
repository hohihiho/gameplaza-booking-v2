import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { GET as getDetail } from '../[id]/route'
import { PATCH as confirmPayment } from '../[id]/payment/route'
import { PATCH as adjustTimeAmount } from '../[id]/adjust/route'
import { PATCH as checkout } from '../[id]/checkout/route'
import { GET as getHistory } from '../history/route'

// Mock 설정
jest.mock('@/src/infrastructure/middleware/auth.middleware', () => ({
  getAuthenticatedUser: jest.fn(() => ({
    id: 'admin-123',
    email: 'admin@test.com',
    role: 'admin',
    sessionId: 'session-123'
  }))
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({}))
}))

// Repository mocks
const mockCheckInRepo = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findActiveCheckIns: jest.fn(),
  findByDateRange: jest.fn()
}

const mockReservationRepo = {
  findById: jest.fn(),
  update: jest.fn()
}

const mockDeviceRepo = {
  findById: jest.fn()
}

const mockUserRepo = {
  findById: jest.fn()
}

// UseCase mocks
jest.mock('@/src/infrastructure/repositories/checkin.supabase.repository', () => ({
  CheckInSupabaseRepository: jest.fn(() => mockCheckInRepo)
}))

jest.mock('@/src/infrastructure/repositories/supabase-reservation.repository.v2', () => ({
  ReservationSupabaseRepository: jest.fn(() => mockReservationRepo)
}))

jest.mock('@/src/infrastructure/repositories/device.supabase.repository', () => ({
  DeviceSupabaseRepository: jest.fn(() => mockDeviceRepo)
}))

jest.mock('@/src/infrastructure/repositories/user.supabase.repository', () => ({
  UserSupabaseRepository: jest.fn(() => mockUserRepo)
}))

describe('CheckIn API', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    
    // 환경 변수 설정
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  describe('POST /api/v2/checkins', () => {
    it('체크인을 성공적으로 생성한다', async () => {
      const body = {
        reservationId: 'reservation-123',
        deviceId: 'device-456'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/v2/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(body)
      })

      // Mock 응답 설정
      const mockCheckIn = {
        id: 'checkin-789',
        status: '체크인됨',
        paymentStatus: '대기중'
      }

      // ProcessCheckInUseCase의 execute 메서드 모킹
      const ProcessCheckInUseCase = require('@/src/application/use-cases/checkin/process-checkin.use-case').ProcessCheckInUseCase
      ProcessCheckInUseCase.prototype.execute = jest.fn().mockResolvedValue({
        checkIn: mockCheckIn,
        message: '체크인이 성공적으로 생성되었습니다'
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.checkIn).toEqual(mockCheckIn)
      expect(data.message).toContain('성공적으로 생성되었습니다')
    })

    it('필수 필드가 없으면 400 에러를 반환한다', async () => {
      const body = {
        reservationId: 'reservation-123'
        // deviceId 누락
      }

      mockRequest = new NextRequest('http://localhost:3000/api/v2/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(body)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('필수입니다')
    })
  })

  describe('GET /api/v2/checkins', () => {
    it('활성 체크인 목록을 조회한다', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/v2/checkins', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })

      // Mock 응답 설정
      const mockCheckIns = [
        {
          id: 'checkin-1',
          userName: '홍길동',
          deviceNumber: 'PC-01',
          status: 'IN_USE'
        }
      ]

      // GetActiveCheckInsUseCase의 execute 메서드 모킹
      const GetActiveCheckInsUseCase = require('@/src/application/use-cases/checkin/get-active-checkins.use-case').GetActiveCheckInsUseCase
      GetActiveCheckInsUseCase.prototype.execute = jest.fn().mockResolvedValue({
        data: {
          checkIns: mockCheckIns,
          totalCount: 1
        }
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkIns).toHaveLength(1)
      expect(data.totalCount).toBe(1)
    })
  })

  describe('PATCH /api/v2/checkins/{id}/payment', () => {
    it('결제를 확인한다', async () => {
      const body = {
        paymentMethod: 'CASH'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/v2/checkins/checkin-123/payment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(body)
      })

      // Mock 응답 설정
      const mockCheckIn = {
        id: 'checkin-123',
        status: '사용중',
        paymentStatus: '완료',
        paymentMethod: '현금'
      }

      // ConfirmPaymentUseCase의 execute 메서드 모킹
      const ConfirmPaymentUseCase = require('@/src/application/use-cases/checkin/confirm-payment.use-case').ConfirmPaymentUseCase
      ConfirmPaymentUseCase.prototype.execute = jest.fn().mockResolvedValue({
        checkIn: mockCheckIn,
        message: '결제가 확인되었습니다. 이용을 시작할 수 있습니다.'
      })

      const response = await confirmPayment(mockRequest, { params: { id: 'checkin-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkIn.paymentStatus).toBe('완료')
      expect(data.message).toContain('결제가 확인되었습니다')
    })
  })

  describe('PATCH /api/v2/checkins/{id}/checkout', () => {
    it('체크아웃을 처리한다', async () => {
      const body = {
        notes: '정상 이용 완료'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/v2/checkins/checkin-123/checkout', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(body)
      })

      // Mock 응답 설정
      const mockResult = {
        checkIn: {
          id: 'checkin-123',
          status: '완료'
        },
        summary: {
          totalTime: 90,
          totalTimeDisplay: '1시간 30분',
          finalAmount: 30000,
          paymentMethod: '현금'
        },
        message: '체크아웃이 완료되었습니다. 총 이용시간: 1시간 30분'
      }

      // ProcessCheckOutUseCase의 execute 메서드 모킹
      const ProcessCheckOutUseCase = require('@/src/application/use-cases/checkin/process-checkout.use-case').ProcessCheckOutUseCase
      ProcessCheckOutUseCase.prototype.execute = jest.fn().mockResolvedValue(mockResult)

      const response = await checkout(mockRequest, { params: { id: 'checkin-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkIn.status).toBe('완료')
      expect(data.summary.totalTime).toBe(90)
      expect(data.message).toContain('체크아웃이 완료되었습니다')
    })
  })
})