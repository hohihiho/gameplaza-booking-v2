#!/usr/bin/env tsx
/**
 * 하이브리드 데이터 동기화 스크립트
 * JSONB play_modes와 관계형 play_modes 테이블 간의 데이터를 동기화합니다.
 * 
 * 사용법:
 * npm run sync-hybrid-data
 * 
 * 옵션:
 * --dry-run: 실제 변경 없이 분석만 수행
 * --source=jsonb|relational: 어느 쪽을 기준으로 동기화할지 설정 (기본값: relational)
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

loadEnvFile()

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SyncResult {
  deviceTypeId: string
  deviceTypeName: string
  jsonbCount: number
  relationalCount: number
  action: 'sync_needed' | 'already_synced' | 'error'
  changes?: string[]
}

async function analyzeDataInconsistencies(): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  try {
    console.log('🔍 하이브리드 데이터 불일치 분석 중...\n')

    // 모든 device_types 조회
    const { data: deviceTypes, error: dtError } = await supabase
      .from('device_types')
      .select('id, name')

    if (dtError) {
      console.error('❌ device_types 조회 실패:', dtError)
      return results
    }

    for (const deviceType of deviceTypes || []) {
      try {
        // 관계형 테이블 데이터 조회
        const { data: relationalModes } = await supabase
          .from('play_modes')
          .select('id, name, price, display_order')
          .eq('device_type_id', deviceType.id)
          .order('display_order')

        const relationalCount = relationalModes?.length || 0

        // SQL을 통해 JSONB 데이터 조회 (direct DB access)
        const { data: jsonbData } = await supabase
          .from('device_types')
          .select('play_modes')
          .eq('id', deviceType.id)
          .single()

        const jsonbPlayModes = Array.isArray(jsonbData?.play_modes) ? jsonbData.play_modes : []
        const jsonbCount = jsonbPlayModes.length

        let action: 'sync_needed' | 'already_synced' | 'error' = 'already_synced'
        const changes: string[] = []

        if (relationalCount !== jsonbCount) {
          action = 'sync_needed'
          
          if (relationalCount > jsonbCount) {
            changes.push(`관계형 테이블에 ${relationalCount - jsonbCount}개 더 많음`)
          } else {
            changes.push(`JSONB에 ${jsonbCount - relationalCount}개 더 많음`)
          }
        }

        results.push({
          deviceTypeId: deviceType.id,
          deviceTypeName: deviceType.name,
          jsonbCount,
          relationalCount,
          action,
          changes
        })

        if (action === 'sync_needed') {
          console.log(`⚠️  ${deviceType.name}: JSONB(${jsonbCount}) vs 관계형(${relationalCount})`)
        }

      } catch (error) {
        results.push({
          deviceTypeId: deviceType.id,
          deviceTypeName: deviceType.name,
          jsonbCount: 0,
          relationalCount: 0,
          action: 'error',
          changes: [`오류: ${error}`]
        })
      }
    }

  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error)
  }

  return results
}

async function syncRelationalToJsonb(deviceTypeId: string): Promise<boolean> {
  try {
    // 관계형 테이블에서 데이터 조회
    const { data: relationalModes } = await supabase
      .from('play_modes')
      .select('name, price, display_order')
      .eq('device_type_id', deviceTypeId)
      .order('display_order')

    if (!relationalModes) {
      console.log(`   관계형 데이터가 없어 JSONB를 빈 배열로 설정`)
      relationalModes = []
    }

    // JSONB 형태로 변환
    const jsonbData = relationalModes.map(mode => ({
      name: mode.name,
      price: mode.price,
      display_order: mode.display_order
    }))

    // device_types.play_modes 업데이트
    const { error } = await supabase
      .from('device_types')
      .update({ play_modes: jsonbData })
      .eq('id', deviceTypeId)

    if (error) {
      console.error(`   ❌ JSONB 업데이트 실패:`, error)
      return false
    }

    console.log(`   ✅ JSONB 동기화 완료 (${jsonbData.length}개 항목)`)
    return true

  } catch (error) {
    console.error(`   ❌ 동기화 중 오류:`, error)
    return false
  }
}

async function performSync(results: SyncResult[], dryRun: boolean = false, source: 'jsonb' | 'relational' = 'relational') {
  const needsSync = results.filter(r => r.action === 'sync_needed')
  
  if (needsSync.length === 0) {
    console.log('🎉 모든 데이터가 이미 동기화되어 있습니다!')
    return
  }

  console.log(`\n🔄 ${needsSync.length}개 항목의 동기화 ${dryRun ? '시뮬레이션' : '실행'} 중...\n`)

  if (source !== 'relational') {
    console.log('⚠️  현재는 관계형 → JSONB 동기화만 지원됩니다.')
    return
  }

  let successCount = 0
  let failCount = 0

  for (const item of needsSync) {
    console.log(`📝 ${item.deviceTypeName} 동기화 중...`)
    
    if (dryRun) {
      console.log(`   [DRY RUN] 관계형(${item.relationalCount}) → JSONB(${item.jsonbCount})`)
      successCount++
    } else {
      const success = await syncRelationalToJsonb(item.deviceTypeId)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`📊 동기화 결과: 성공 ${successCount}개, 실패 ${failCount}개`)
  
  if (failCount === 0) {
    console.log('🎉 모든 동기화가 완료되었습니다!')
  } else {
    console.log('⚠️  일부 항목의 동기화가 실패했습니다. 로그를 확인해주세요.')
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const sourceArg = args.find(arg => arg.startsWith('--source='))
  const source = sourceArg ? sourceArg.split('=')[1] as 'jsonb' | 'relational' : 'relational'

  console.log('🔄 하이브리드 데이터 동기화 도구\n')
  console.log(`모드: ${dryRun ? 'DRY RUN (시뮬레이션)' : 'LIVE (실제 변경)'}`)
  console.log(`동기화 방향: ${source} 테이블 → ${source === 'relational' ? 'JSONB' : '관계형'}\n`)

  if (!dryRun) {
    console.log('⚠️  실제 데이터가 변경됩니다. 계속하려면 5초 대기...')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  try {
    const results = await analyzeDataInconsistencies()
    
    // 분석 결과 요약
    const totalItems = results.length
    const syncNeeded = results.filter(r => r.action === 'sync_needed').length
    const errors = results.filter(r => r.action === 'error').length

    console.log(`\n📊 분석 완료: 총 ${totalItems}개 기기 타입`)
    console.log(`   - 동기화 필요: ${syncNeeded}개`)
    console.log(`   - 이미 동기화됨: ${totalItems - syncNeeded - errors}개`)
    console.log(`   - 오류: ${errors}개`)

    if (syncNeeded > 0) {
      await performSync(results, dryRun, source)
    }

  } catch (error) {
    console.error('💥 동기화 도구 실행 중 오류:', error)
    process.exit(1)
  }
}

// 직접 실행될 때만 main() 호출
if (require.main === module) {
  main()
}

export { analyzeDataInconsistencies, syncRelationalToJsonb }