/**
 * 실제 DB를 사용한 예약 생성 유스케이스 테스트
 */

import { CreateReservationV2UseCase } from '../create-reservation.v2.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import {
  testSupabase,
  seedTestData,
  cleanupTestData,
  testDatabaseConnection
} from '@/lib/test-utils/real-supabase'

describe('실제 DB - 예약 생성 유스케이스 테스트', () => {
  let useCase: CreateReservationV2UseCase
  let testData: any

  beforeAll(async () => {
    // DB 연결 확인
    await testDatabaseConnection()
  })

  beforeEach(async () => {
    // 테스트 데이터 정리
    await cleanupTestData()
    
    // 테스트 데이터 시드
    testData = await seedTestData()
    
    // 리포지토리 초기화
    const reservationRepository = new SupabaseReservationRepositoryV2(testSupabase as any)
    const deviceRepository = new SupabaseDeviceRepositoryV2(testSupabase as any)
    const userRepository = new UserSupabaseRepository(testSupabase as any)
    
    // 유스케이스 초기화
    useCase = new CreateReservationV2UseCase(
      reservationRepository,
      deviceRepository,
      userRepository
    )
  })

  afterEach(async () => {
    // 테스트 데이터 정리
    await cleanupTestData()
  })

  test('실제 DB에 예약을 생성할 수 있다', async () => {
    // 예약 생성
    const result = await useCase.execute({
      userId: testData.testUserId,
      deviceId: testData.testDeviceId,
      date: testData.testDateStr,
      startHour: 14,
      endHour: 16,
      userNotes: '실제 DB 테스트 예약'
    })
    
    console.log('✅ 예약 생성 성공:', result)
    
    // 결과 검증
    expect(result).toBeDefined()
    expect(result.reservation).toBeDefined()
    expect(result.reservation.id).toBeDefined()
    expect(result.reservation.reservationNumber).toMatch(/^GP-\d{8}-\d{4}$/)
    expect(result.reservation.status.value).toBe('pending')
    expect(result.reservation.userId).toBe(testData.testUserId)
    expect(result.reservation.deviceId).toBe(testData.testDeviceId)
    
    // DB에서 직접 확인
    const { data, error } = await testSupabase
      .from('reservations')
      .select('*')
      .eq('id', result.reservation.id)
      .single()
    
    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.user_id).toBe(testData.testUserId)
    expect(data.device_id).toBe(testData.testDeviceId)
  })
  
  test('시간대 충돌 시 에러가 발생한다', async () => {
    // 첫 번째 예약 생성
    await useCase.execute({
      userId: testData.testUserId,
      deviceId: testData.testDeviceId,
      date: testData.testDateStr,
      startHour: 14,
      endHour: 16,
      userNotes: '첫 번째 예약'
    })
    
    // 동일한 시간대에 예약 시도
    await expect(
      useCase.execute({
        userId: testData.testUserId,
        deviceId: testData.testDeviceId,
        date: testData.testDateStr,
        startHour: 15,
        endHour: 17,
        userNotes: '충돌 예약'
      })
    ).rejects.toThrow(/시간대/)
  })
  
  test('최대 시간 제한을 초과하면 에러가 발생한다', async () => {
    // 5시간 예약 시도 (최대 4시간)
    await expect(
      useCase.execute({
        userId: testData.testUserId,
        deviceId: testData.testDeviceId,
        date: testData.testDateStr,
        startHour: 10,
        endHour: 15,
        userNotes: '5시간 예약'
      })
    ).rejects.toThrow(/최대 예약 시간/)
  })
  
  test('3주 이후 예약 시도 시 에러가 발생한다', async () => {
    // 22일 후 예약 시도 (최대 21일)
    const now = new Date()
    const futureDate = new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000)
    const futureDateStr = `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, '0')}-${futureDate.getDate().toString().padStart(2, '0')}`
    
    await expect(
      useCase.execute({
        userId: testData.testUserId,
        deviceId: testData.testDeviceId,
        date: futureDateStr,
        startHour: 14,
        endHour: 16,
        userNotes: '22일 후 예약'
      })
    ).rejects.toThrow(/예약은 최대 3주 후까지만 가능합니다/)
  })
  
  test('3주 이내 예약은 성공한다', async () => {
    // 20일 후 예약 시도 (최대 21일 이내)
    const now = new Date()
    const futureDate = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
    const futureDateStr = `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, '0')}-${futureDate.getDate().toString().padStart(2, '0')}`
    
    const result = await useCase.execute({
      userId: testData.testUserId,
      deviceId: testData.testDeviceId,
      date: futureDateStr,
      startHour: 14,
      endHour: 16,
      userNotes: '20일 후 예약'
    })
    
    // 결과 검증
    expect(result).toBeDefined()
    expect(result.reservation).toBeDefined()
    expect(result.reservation.date.dateString).toBe(futureDateStr)
  })
})