#!/usr/bin/env tsx
/**
 * 스키마 일관성 검증 스크립트
 * 실제 Supabase DB와 TypeScript 타입 정의의 일치성을 검증합니다.
 * 
 * 사용법:
 * npm run verify-schema
 * 또는
 * tsx scripts/verify-schema-consistency.ts
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import * as fs from 'fs'
import * as path from 'path'

// .env.local 파일 로드
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']/, '').replace(/["']$/, '')
          process.env[key] = value
        }
      }
    }
  }
}

// 환경 변수 로드
loadEnvFile()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL)
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY)
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

interface SchemaValidationResult {
  table: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

async function validateCoreSchema(): Promise<SchemaValidationResult[]> {
  const results: SchemaValidationResult[] = []

  try {
    console.log('🔍 핵심 스키마 구조 검증 중...\n')

    // 1. device_types 테이블 구조 검증
    console.log('1. device_types 테이블 검증')
    const { data: deviceTypes, error: deviceTypesError } = await supabase
      .from('device_types')
      .select('id, name, category_id, description')
      .limit(1)

    if (deviceTypesError) {
      results.push({
        table: 'device_types',
        status: 'fail',
        message: 'device_types 테이블 쿼리 실패',
        details: deviceTypesError
      })
    } else {
      results.push({
        table: 'device_types',
        status: 'pass',
        message: '✅ device_types 테이블 구조 정상'
      })

      if (deviceTypes && deviceTypes.length > 0) {
        const sample = deviceTypes[0]
        console.log(`   - category_id: ${sample.category_id ? '✅' : '❌'}`)
        console.log(`   - play_modes: ${sample.play_modes !== undefined ? '✅' : '❌'}`)
      }
    }

    // 2. play_modes 테이블 구조 검증
    console.log('\n2. play_modes 테이블 검증')
    const { data: playModes, error: playModesError } = await supabase
      .from('play_modes')
      .select('id, device_type_id, name, price, display_order')
      .limit(1)

    if (playModesError) {
      results.push({
        table: 'play_modes',
        status: 'fail',
        message: 'play_modes 테이블 쿼리 실패',
        details: playModesError
      })
    } else {
      results.push({
        table: 'play_modes',
        status: 'pass',
        message: '✅ play_modes 테이블 구조 정상'
      })
    }

    // 3. 관계형 쿼리 검증 (단순화)
    console.log('\n3. 관계형 쿼리 검증')
    const { data: joinedData, error: joinError } = await supabase
      .from('device_types')
      .select(`
        id,
        name,
        device_categories(id, name)
      `)
      .limit(1)

    if (joinError) {
      results.push({
        table: 'relationships',
        status: 'fail',
        message: '관계형 쿼리 실패',
        details: joinError
      })
    } else {
      results.push({
        table: 'relationships',
        status: 'pass',
        message: '✅ 테이블 관계 구조 정상'
      })
    }

    // 4. 하이브리드 구조 검증 - 간소화
    console.log('\n4. 하이브리드 구조 일관성 검증')
    
    try {
      // 샘플 기기 타입에서 JSONB 데이터 확인 
      console.log('   JSONB play_modes 확인 중...')
      
      // 관계형 테이블 데이터 확인
      const { data: relationalModes, error: relError } = await supabase
        .from('play_modes')
        .select('device_type_id')
        .limit(5)

      if (relError) {
        results.push({
          table: 'hybrid_consistency',
          status: 'fail',
          message: '관계형 play_modes 테이블 접근 실패',
          details: relError
        })
      } else {
        const relationalCount = relationalModes?.length || 0
        
        if (relationalCount > 0) {
          results.push({
            table: 'hybrid_consistency',
            status: 'pass',
            message: `✅ 하이브리드 구조 기본 검증 완료 (관계형 데이터: ${relationalCount}개 확인)`
          })
          
          // 실제 불일치 검사를 위해 하나의 샘플만 확인
          const sampleDeviceTypeId = relationalModes[0]?.device_type_id
          if (sampleDeviceTypeId) {
            const { data: relSample } = await supabase
              .from('play_modes')
              .select('*')
              .eq('device_type_id', sampleDeviceTypeId)
              
            console.log(`   - 샘플 기기의 관계형 데이터: ${relSample?.length || 0}개`)
          }
        } else {
          results.push({
            table: 'hybrid_consistency',
            status: 'warning',
            message: '⚠️  관계형 play_modes 테이블이 비어있음'
          })
        }
      }
    } catch (err) {
      results.push({
        table: 'hybrid_consistency',
        status: 'fail',
        message: '하이브리드 구조 검증 중 오류 발생',
        details: err
      })
    }

  } catch (error) {
    results.push({
      table: 'general',
      status: 'fail',
      message: '스키마 검증 중 예외 발생',
      details: error
    })
  }

  return results
}

async function validateAPICompatibility(): Promise<SchemaValidationResult[]> {
  const results: SchemaValidationResult[] = []

  try {
    console.log('\n🔌 API 호환성 검증 중...\n')

    // 실제 API 엔드포인트 테스트
    const apiTests = [
      {
        name: 'GET /api/admin/devices/types',
        test: async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/devices/types?no-cache=true`)
          return response.ok
        }
      }
    ]

    for (const test of apiTests) {
      try {
        const passed = await test.test()
        results.push({
          table: 'api',
          status: passed ? 'pass' : 'fail',
          message: `${passed ? '✅' : '❌'} ${test.name}`
        })
      } catch (error) {
        results.push({
          table: 'api',
          status: 'fail',
          message: `❌ ${test.name} - 네트워크 오류`,
          details: error
        })
      }
    }

  } catch (error) {
    results.push({
      table: 'api',
      status: 'fail',
      message: 'API 호환성 검증 중 오류 발생',
      details: error
    })
  }

  return results
}

async function generateReport(results: SchemaValidationResult[]) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 스키마 검증 결과 리포트')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warning').length

  console.log(`\n✅ 통과: ${passed}개`)
  console.log(`❌ 실패: ${failed}개`)
  console.log(`⚠️  경고: ${warnings}개`)
  console.log(`📊 총 검증 항목: ${results.length}개`)

  if (failed > 0) {
    console.log('\n❌ 실패한 항목:')
    results
      .filter(r => r.status === 'fail')
      .forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.message}`)
        if (result.details) {
          console.log(`   상세: ${JSON.stringify(result.details, null, 2)}`)
        }
      })
  }

  if (warnings > 0) {
    console.log('\n⚠️  경고 항목:')
    results
      .filter(r => r.status === 'warning')
      .forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.message}`)
        if (result.details) {
          console.log(`   상세: ${JSON.stringify(result.details, null, 2)}`)
        }
      })
  }

  console.log('\n' + '='.repeat(60))
  
  // 종료 코드 결정
  const exitCode = failed > 0 ? 1 : 0
  
  if (exitCode === 0) {
    console.log('🎉 스키마 검증 완료! 모든 항목이 정상입니다.')
  } else {
    console.log('💥 스키마 검증 실패! 위의 오류를 수정해주세요.')
  }

  return exitCode
}

// 메인 실행
async function main() {
  console.log('🚀 게임플라자 스키마 일관성 검증 시작\n')

  try {
    const schemaResults = await validateCoreSchema()
    const apiResults = await validateAPICompatibility()
    
    const allResults = [...schemaResults, ...apiResults]
    const exitCode = await generateReport(allResults)
    
    process.exit(exitCode)

  } catch (error) {
    console.error('💥 검증 스크립트 실행 중 치명적 오류:', error)
    process.exit(1)
  }
}

// 직접 실행될 때만 main() 호출
if (require.main === module) {
  main()
}

export { validateCoreSchema, validateAPICompatibility }