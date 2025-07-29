import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 테이블이 존재하는지 확인
    const supabaseAdmin = createAdminClient();
  const { data: tableExists } = await supabaseAdmin.from('machine_rules')
      .select('id')
      .limit(1)

    if (!tableExists) {
      // 테이블이 없으면 기본 메시지 반환
      return NextResponse.json({ 
        error: 'machine_rules 테이블이 존재하지 않습니다. Supabase 대시보드에서 마이그레이션을 실행해주세요.',
        migrationPath: '/supabase/migrations/20250102_create_machine_rules.sql'
      }, { status: 400 })
    }

    // 데이터가 없으면 초기 데이터 삽입
    const { count } = await supabaseAdmin
      .from('machine_rules')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      const initialRules = [
        {
          content: '실시간 상태는 약 1분마다 업데이트됩니다',
          display_order: 1
        },
        {
          content: '대여 예약은 마이마이, 츄니즘, 발키리, 라이트닝만 가능합니다',
          display_order: 2
        },
        {
          content: '점검 중인 기기는 일시적으로 이용할 수 없습니다',
          display_order: 3
        },
        {
          content: '일반 이용은 현장에서 바로 가능합니다',
          display_order: 4
        }
      ]

      await supabaseAdmin
        .from('machine_rules')
        .insert(initialRules)
    }

    return NextResponse.json({ success: true, message: '마이그레이션이 완료되었습니다.' })
  } catch (error: any) {
    console.error('마이그레이션 오류:', error)
    return NextResponse.json({ 
      error: error.message || '마이그레이션에 실패했습니다',
      details: error
    }, { status: 500 })
  }
}