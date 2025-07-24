import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/src/types/supabase'
import { seedSuperAdmins } from './superadmin.seed'

/**
 * 모든 시드 데이터 실행
 * 
 * 데이터베이스 초기화 시 필요한 모든 시드 데이터를 생성합니다.
 */
export async function seedAll(supabase: SupabaseClient<Database>) {
  console.log('🌱 전체 시드 데이터 생성 시작...')

  try {
    // 1. 슈퍼관리자 시드
    await seedSuperAdmins(supabase)

    // 2. 추가 시드 데이터가 필요한 경우 여기에 추가
    // await seedDevices(supabase)
    // await seedRentalSettings(supabase)
    // 등...

    console.log('🌱 전체 시드 데이터 생성 완료!')
  } catch (error) {
    console.error('❌ 시드 데이터 생성 중 오류 발생:', error)
    throw error
  }
}

/**
 * 특정 시드만 실행
 */
export { seedSuperAdmins } from './superadmin.seed'