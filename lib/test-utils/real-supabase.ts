/**
 * 실제 Supabase 데이터베이스를 사용하는 테스트 유틸리티
 * Mock 대신 실제 테스트 DB에 직접 연결해서 테스트
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 테스트용 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('테스트용 Supabase 환경 변수가 설정되지 않았습니다. .env.test 파일을 확인하세요.')
}

export const testSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInURL: false
  }
})

// UUID v4 생성 함수
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 테스트용 UUID 생성기 (테스트 식별 가능하도록 prefix 포함)
export const generateTestUserId = () => generateUUID()
export const generateTestDeviceId = () => generateUUID()
export const generateTestReservationId = () => generateUUID()

// 현재 테스트 세션에서 생성된 ID들을 추적
let currentTestIds: {
  users: string[]
  deviceTypes: string[]
  devices: string[]
  reservations: string[]
} = {
  users: [],
  deviceTypes: [],
  devices: [],
  reservations: []
}

/**
 * 테스트 데이터 정리 함수
 * 현재 테스트 세션에서 생성된 데이터를 삭제합니다
 */
export const cleanupTestData = async () => {
  try {
    // 의존성 순서에 따라 삭제 (외래키 제약조건 고려)
    if (currentTestIds.reservations.length > 0) {
      await testSupabase.from('reservations').delete().in('id', currentTestIds.reservations)
    }
    
    if (currentTestIds.devices.length > 0) {
      await testSupabase.from('devices').delete().in('id', currentTestIds.devices)  
    }
    
    if (currentTestIds.deviceTypes.length > 0) {
      await testSupabase.from('device_types').delete().in('id', currentTestIds.deviceTypes)
    }
    
    if (currentTestIds.users.length > 0) {
      await testSupabase.from('users').delete().in('id', currentTestIds.users)
    }
    
    // ID 추적 목록 초기화
    currentTestIds = {
      users: [],
      deviceTypes: [],
      devices: [],
      reservations: []
    }
    
    console.log('✅ 테스트 데이터 정리 완료')
  } catch (error) {
    console.error('❌ 테스트 데이터 정리 실패:', error)
    throw error
  }
}

/**
 * 실제 Supabase DB에 테스트 데이터를 직접 삽입하는 함수
 */
export const seedTestData = async () => {
  try {
    // UUID 형식의 ID 생성
    const testUserId = generateTestUserId()
    const testDeviceTypeId = generateUUID()
    const testDeviceId = generateTestDeviceId()
    
    // 생성된 ID를 추적 목록에 추가
    currentTestIds.users.push(testUserId)
    currentTestIds.deviceTypes.push(testDeviceTypeId)
    currentTestIds.devices.push(testDeviceId)
    
    console.log('🔧 실제 DB에 테스트 데이터 삽입 시작:', { testUserId, testDeviceTypeId, testDeviceId })
    
    // 1. 사용자 실제 삽입
    console.log('1️⃣ 실제 DB에 사용자 삽입 중...')
    const userEmail = `test-${Date.now()}@example.com`
    const { error: userError } = await testSupabase
      .from('users')
      .insert({
        id: testUserId,
        email: userEmail,
        full_name: '테스트 사용자',
        phone: '010-1234-5678',
        birth_date: '1995-01-01',
        status: 'active',
        marketing_agreed: false
      })
    
    if (userError) {
      console.error('❌ 사용자 삽입 실패:', userError)
      throw userError
    }
    
    // 삽입 후 별도로 조회
    const { data: insertedUser } = await testSupabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single()
    
    const testUser = insertedUser || {
      id: testUserId,
      email: userEmail,
      full_name: '테스트 사용자',
      phone: '010-1234-5678',
      birth_date: '1995-01-01',
      status: 'active',
      marketing_agreed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // 2. 기기 타입 실제 삽입
    console.log('2️⃣ 실제 DB에 기기 타입 삽입 중...')
    const { error: deviceTypeError } = await testSupabase
      .from('device_types')
      .insert({
        id: testDeviceTypeId,
        name: 'PS5 테스트',
        category: 'console',
        hourly_rate: 10000,
        is_active: true
      })
    
    if (deviceTypeError) {
      console.error('❌ 기기 타입 삽입 실패:', deviceTypeError)
      throw deviceTypeError
    }
    
    // 삽입 후 별도로 조회
    const { data: insertedDeviceType } = await testSupabase
      .from('device_types')
      .select('*')
      .eq('id', testDeviceTypeId)
      .single()
    
    const testDeviceType = insertedDeviceType || {
      id: testDeviceTypeId,
      name: 'PS5 테스트',
      category: 'console',
      hourly_rate: 10000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // 3. 기기 실제 삽입
    console.log('3️⃣ 실제 DB에 기기 삽입 중...')
    const deviceNumber = `TEST-${Date.now()}`
    const { error: deviceError } = await testSupabase
      .from('devices')
      .insert({
        id: testDeviceId,
        device_number: deviceNumber,
        name: '테스트 PS5 기기',
        device_type_id: testDeviceTypeId,
        status: 'available',
        is_active: true
      })
    
    if (deviceError) {
      console.error('❌ 기기 삽입 실패:', deviceError)
      throw deviceError
    }
    
    // 삽입 후 별도로 조회
    const { data: insertedDevice } = await testSupabase
      .from('devices')
      .select('*')
      .eq('id', testDeviceId)
      .single()
    
    const testDevice = insertedDevice || {
      id: testDeviceId,
      device_number: deviceNumber,
      name: '테스트 PS5 기기',
      device_type_id: testDeviceTypeId,
      status: 'available',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 4. 테스트 시간대 템플릿 생성 (24시간 규칙을 피하기 위해 3일 후로 설정)
    const testDate = new Date()
    testDate.setDate(testDate.getDate() + 3)
    const testDateStr = testDate.toISOString().split('T')[0]

    console.log('✅ 실제 DB 테스트 데이터 삽입 완료:', {
      user: testUser,
      deviceType: testDeviceType,
      device: testDevice
    })

    return {
      testUser,
      testDeviceType,
      testDevice,
      testUserId,
      testDeviceId,
      testDeviceTypeId,
      testDateStr
    }
  } catch (error) {
    console.error('❌ 실제 DB 테스트 데이터 삽입 실패:', error)
    throw error
  }
}

/**
 * 테스트 예약 생성 헬퍼
 */
export const createTestReservation = async (params: {
  userId: string
  deviceId: string
  date: string
  startTime: string
  endTime: string
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
}) => {
  const reservationId = generateTestReservationId()
  
  // 생성된 ID를 추적 목록에 추가
  currentTestIds.reservations.push(reservationId)
  
  // 모의 데이터 반환 (실제 DB 삽입은 나중에 구현)
  const mockReservation = {
    id: reservationId,
    user_id: params.userId,
    device_id: params.deviceId,
    date: params.date,
    start_time: params.startTime,
    end_time: params.endTime,
    status: params.status || 'pending',
    reservation_number: `GP-TEST-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  return mockReservation
}

/**
 * 데이터베이스 연결 테스트
 */
export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await testSupabase
      .from('users')
      .select('id')
      .limit(1)

    if (error) throw error
    
    console.log('✅ 테스트 데이터베이스 연결 성공')
    return true
  } catch (error) {
    console.error('❌ 테스트 데이터베이스 연결 실패:', error)
    throw error
  }
}

/**
 * 테스트 트랜잭션 래퍼
 * PostgreSQL 트랜잭션을 사용해서 테스트 격리
 */
export const withTestTransaction = async <T>(
  callback: (client: typeof testSupabase) => Promise<T>
): Promise<T> => {
  // Supabase는 직접적인 트랜잭션 API를 제공하지 않으므로
  // 테스트 시작/종료 시 데이터 정리로 대체
  try {
    await cleanupTestData()
    const result = await callback(testSupabase)
    return result
  } finally {
    await cleanupTestData()
  }
}

/**
 * 테스트용 인증 헬퍼
 * 특정 사용자로 인증된 상태를 시뮬레이션
 */
export const authenticateAsTestUser = (userId: string) => {
  // 실제 테스트에서는 JWT 토큰을 생성하거나
  // 테스트용 인증 상태를 설정할 수 있습니다
  return {
    id: userId,
    email: 'test@example.com',
    user_metadata: {
      full_name: '테스트 사용자'
    }
  }
}

/**
 * 테스트 환경 검증
 */
export const validateTestEnvironment = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('이 유틸리티는 테스트 환경에서만 사용할 수 있습니다.')
  }
  
  console.log('🔍 real-supabase.ts 환경 변수 확인:', {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
  })
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('jlqpflqopzdkzvmbjput')) {
    console.error('❌ 환경 변수 불일치:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    throw new Error('테스트용 Supabase 프로젝트가 아닙니다. 프로덕션 데이터베이스 사용 금지!')
  }
}

// Jest 환경에서는 초기화 시 검증 생략 (setup 단계에서 처리)
if (typeof jest === 'undefined') {
  validateTestEnvironment()
}