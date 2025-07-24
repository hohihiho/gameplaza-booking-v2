#!/usr/bin/env node

/**
 * 데이터베이스 시드 스크립트
 * 
 * 사용법:
 * - npm run seed          # 모든 시드 데이터 생성
 * - npm run seed:superadmin  # 슈퍼관리자만 생성
 * 
 * 환경변수:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (선택사항, 더 높은 권한이 필요한 경우)
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '../src/types/supabase'
import { seedAll, seedSuperAdmins } from '../src/infrastructure/seeds'
import * as dotenv from 'dotenv'
import * as path from 'path'

// 환경변수 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Supabase 클라이언트 생성
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Supabase URL과 Key가 필요합니다. .env.local 파일을 확인하세요.')
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// 메인 실행 함수
async function main() {
  const command = process.argv[2]
  const supabase = createSupabaseClient()

  try {
    switch (command) {
      case 'superadmin':
        console.log('🌱 슈퍼관리자 시드만 실행합니다...')
        await seedSuperAdmins(supabase)
        break

      case 'all':
      default:
        console.log('🌱 모든 시드 데이터를 생성합니다...')
        await seedAll(supabase)
        break
    }

    console.log('✅ 시드 작업이 성공적으로 완료되었습니다!')
    process.exit(0)
  } catch (error) {
    console.error('❌ 시드 작업 중 오류가 발생했습니다:', error)
    process.exit(1)
  }
}

// 스크립트 실행
main().catch((error) => {
  console.error('❌ 예상치 못한 오류가 발생했습니다:', error)
  process.exit(1)
})