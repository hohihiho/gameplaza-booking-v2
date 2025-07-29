/**
 * 실제 Supabase 데이터베이스를 사용하는 예약 API 통합 테스트
 * Mock 대신 실제 DB에 직접 데이터를 삽입/조회/수정/삭제하여 테스트
 */

import { NextRequest } from 'next/server'
import { POST as createReservation } from '../../reservations/create/route'
import { GET as getReservations } from '../../reservations/list/route'

// 실제 DB 테스트 유틸리티 import
import { 
  testSupabase, 
  cleanupTestData, 
  seedTestData, 
  createTestReservation,
  testDatabaseConnection,
  authenticateAsTestUser
} from '@/lib/test-utils/real-supabase'

// 인증 미들웨어 Mock (실제 사용자 인증은 유지)
jest.mock('@/src/infrastructure/middleware/auth.middleware', () => ({
  getAuthenticatedUser: jest.fn()
}))

const { getAuthenticatedUser } = require('@/src/infrastructure/middleware/auth.middleware')

describe('실제 DB - 예약 API 통합 테스트', () => {
  let testData: any
  let performanceStart: number

  beforeAll(async () => {
    // 데이터베이스 연결 테스트
    await testDatabaseConnection()
    console.log('🔗 테스트 데이터베이스 연결 확인 완료')
  })

  beforeEach(async () => {
    // 기존 테스트 데이터 정리 후 새 데이터 시드
    await cleanupTestData()
    testData = await seedTestData()
    
    // 기본 인증 설정
    getAuthenticatedUser.mockReturnValue(authenticateAsTestUser(testData.testUserId))
    
    performanceStart = Date.now()
    console.log('🌱 테스트 데이터 준비 완료:', {
      userId: testData.testUserId,
      deviceId: testData.testDeviceId
    })
  })

  afterEach(async () => {
    // 테스트 후 데이터 정리
    await cleanupTestData()
    
    // 성능 검증 - 실제 DB 연결로 인해 시간 여유 추가
    const duration = Date.now() - performanceStart
    expect(duration).toBeLessThan(5000) // 5초 이내
    console.log(`⏱️  테스트 실행 시간: ${duration}ms`)
  })

  describe('POST /api/v2/reservations/create - 실제 예약 생성', () => {
    it('유효한 예약을 실제 DB에 생성해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: testData.testDeviceId,
          date: testData.tomorrowStr,
          startHour: 14,
          endHour: 16,
          userNotes: '실제 DB 테스트 예약'
        })
      })

      const response = await createReservation(request)
      const data = await response.json()

      // 에러 디버깅을 위한 로그
      if (response.status !== 201) {
        console.log('❌ API 응답 에러:', {
          status: response.status,
          data: data
        })
      }

      // 응답 검증
      expect(response.status).toBe(201)
      expect(data.id).toBeDefined()
      expect(data.reservationNumber).toMatch(/^GP-\d{8}-\d{4}$/)
      expect(data.status).toBe('pending')

      // 실제 DB에서 데이터 확인
      const { data: dbReservation, error } = await testSupabase
        .from('reservations')
        .select('*')
        .eq('id', data.id)
        .single()

      expect(error).toBeNull()
      expect(dbReservation).toBeTruthy()
      if (dbReservation && typeof dbReservation === 'object' && 'user_id' in dbReservation) {
        const reservation = dbReservation as any
        expect(reservation.user_id).toBe(testData.testUserId)
        expect(reservation.device_id).toBe(testData.testDeviceId)
        expect(reservation.date).toBe(testData.tomorrowStr)
        expect(reservation.start_time).toBe('14:00')
        expect(reservation.end_time).toBe('16:00')
        expect(reservation.user_notes).toBe('실제 DB 테스트 예약')
        console.log('✅ 실제 DB에 예약 생성 및 검증 완료:', reservation.id)
      }
    })

    it('시간대 충돌 시 실제 제약조건으로 인한 에러', async () => {
      // 1. 먼저 예약 생성
      await createTestReservation({
        userId: testData.testUserId,
        deviceId: testData.testDeviceId,
        date: testData.tomorrowStr,
        startTime: '14:00',
        endTime: '16:00',
        status: 'approved'
      })

      // 2. 겹치는 시간대로 예약 시도
      const request = new NextRequest('http://localhost:3000/api/v2/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: testData.testDeviceId,
          date: testData.tomorrowStr,
          startHour: 15, // 15:00-17:00 (14:00-16:00과 겹침)
          endHour: 17,
        })
      })

      const response = await createReservation(request)
      const data = await response.json()

      // 충돌 에러 검증
      expect(response.status).toBe(400)
      expect(data.message).toContain('시간대')
      
      console.log('✅ 실제 DB 제약조건으로 시간대 충돌 방지 확인')
    })

    it('존재하지 않는 기기 ID로 예약 시도 시 실제 외래키 제약조건 에러', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'non-existent-device-id',
          date: testData.tomorrowStr,
          startHour: 14,
          endHour: 16,
        })
      })

      const response = await createReservation(request)
      
      // 외래키 제약조건 위반으로 인한 에러
      expect(response.status).toBe(400)
      
      console.log('✅ 실제 DB 외래키 제약조건 확인')
    })

    it('미인증 사용자 접근 차단', async () => {
      // 인증 해제
      getAuthenticatedUser.mockReturnValue(null)

      const request = new NextRequest('http://localhost:3000/api/v2/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: testData.testDeviceId,
          date: testData.tomorrowStr,
          startHour: 14,
          endHour: 16,
        })
      })

      const response = await createReservation(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toContain('인증이 필요합니다')
    })
  })

  describe('GET /api/v2/reservations/list - 실제 예약 목록 조회', () => {
    beforeEach(async () => {
      // 테스트용 예약 데이터 여러 개 생성
      await Promise.all([
        createTestReservation({
          userId: testData.testUserId,
          deviceId: testData.testDeviceId,
          date: testData.tomorrowStr,
          startTime: '14:00',
          endTime: '16:00',
          status: 'pending'
        }),
        createTestReservation({
          userId: testData.testUserId,
          deviceId: testData.testDeviceId,
          date: testData.tomorrowStr,
          startTime: '18:00',
          endTime: '20:00',
          status: 'approved'
        })
      ])
    })

    it('실제 DB에서 사용자 예약 목록을 정확히 조회해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations/list?page=1&pageSize=10')
      
      const response = await getReservations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.reservations).toBeDefined()
      expect(Array.isArray(data.reservations)).toBe(true)
      expect(data.reservations.length).toBe(2) // 위에서 생성한 2개 예약

      // 실제 DB 데이터와 일치 확인
      const reservation1 = data.reservations.find((r: any) => r.start_time === '14:00')
      const reservation2 = data.reservations.find((r: any) => r.start_time === '18:00')
      
      expect(reservation1.status).toBe('pending')
      expect(reservation2.status).toBe('approved')
      
      console.log('✅ 실제 DB에서 예약 목록 조회 확인:', data.reservations.length + '건')
    })

    it('상태별 필터링이 실제 DB에서 정확히 작동해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations/list?status=approved')
      
      const response = await getReservations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.reservations.length).toBe(1) // approved 상태만 1건
      expect(data.reservations[0].status).toBe('approved')
      
      console.log('✅ 실제 DB 상태별 필터링 확인')
    })
  })

  describe('데이터 무결성 테스트 - 실제 DB 제약조건', () => {
    it('예약번호 유일성 제약조건 검증', async () => {
      // 동일한 예약번호로 2번 삽입 시도
      const reservationNumber = `GP-TEST-${Date.now()}`

      const { error: firstError } = await testSupabase
        .from('reservations')
        .insert({
          user_id: testData.testUserId,
          device_id: testData.testDeviceId,
          date: testData.tomorrowStr,
          start_time: '14:00',
          end_time: '16:00',
          status: 'pending',
          reservation_number: reservationNumber
        } as any)

      expect(firstError).toBeNull() // 첫 번째는 성공

      const { error: secondError } = await testSupabase
        .from('reservations')
        .insert({
          user_id: testData.testUserId,
          device_id: testData.testDeviceId,
          date: testData.tomorrowStr,
          start_time: '18:00',
          end_time: '20:00',
          status: 'pending',
          reservation_number: reservationNumber // 동일한 예약번호
        } as any)

      expect(secondError).toBeTruthy() // 두 번째는 유일성 제약조건 위반으로 실패
      expect(secondError?.message).toContain('duplicate key')
      
      console.log('✅ 실제 DB 예약번호 유일성 제약조건 확인')
    })

    it('외래키 제약조건 검증 - 존재하지 않는 사용자', async () => {
      const { error } = await testSupabase
        .from('reservations')
        .insert({
          user_id: 'non-existent-user-id',
          device_id: testData.testDeviceId,
          date: testData.tomorrowStr,
          start_time: '14:00',
          end_time: '16:00',
          status: 'pending',
          reservation_number: `GP-TEST-${Date.now()}`
        } as any)

      expect(error).toBeTruthy()
      expect(error?.message).toContain('foreign key')
      
      console.log('✅ 실제 DB 외래키 제약조건 확인')
    })
  })

  describe('성능 테스트 - 실제 DB 연결', () => {
    it('대량 예약 조회 성능 테스트', async () => {
      // 10개의 테스트 예약 생성
      const promises = Array.from({ length: 10 }, (_, i) => 
        createTestReservation({
          userId: testData.testUserId,
          deviceId: testData.testDeviceId,
          date: testData.tomorrowStr,
          startTime: `${10 + i}:00`,
          endTime: `${11 + i}:00`,
          status: 'pending'
        })
      )
      
      await Promise.all(promises)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/v2/reservations/list?page=1&pageSize=20')
      const response = await getReservations(request)
      const data = await response.json()
      const duration = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(data.reservations.length).toBe(10)
      expect(duration).toBeLessThan(2000) // 2초 이내
      
      console.log(`✅ 대량 조회 성능 테스트: ${duration}ms (10건 조회)`)
    })
  })
})