import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 테이블이 존재하는지 확인
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservation_rules')
      .select('id')
      .limit(1)

    if (!tableExists) {
      // 테이블이 없으면 기본 메시지 반환
      return NextResponse.json({ 
        error: 'reservation_rules 테이블이 존재하지 않습니다. Supabase 대시보드에서 마이그레이션을 실행해주세요.',
        migrationPath: '/supabase/migrations/20250102_create_reservation_rules.sql'
      }, { status: 400 })
    }

    // 데이터가 없으면 초기 데이터 삽입
    const { count } = await supabaseAdmin
      .from('reservation_rules')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      const initialRules = [
        {
          content: '예약한 시간에 맞춰 방문해주세요. 10분 이상 늦을 경우 예약이 자동 취소될 수 있습니다.',
          display_order: 1
        },
        {
          content: '본인 확인을 위해 신분증을 반드시 지참해주세요.',
          display_order: 2
        },
        {
          content: '예약 변경 및 취소는 이용 시간 24시간 전까지 가능합니다.',
          display_order: 3
        },
        {
          content: '기기는 소중히 다뤄주시고, 음식물 반입은 금지입니다.',
          display_order: 4
        },
        {
          content: '미성년자는 22시 이후 이용이 제한됩니다.',
          display_order: 5
        }
      ]

      await supabaseAdmin
        .from('reservation_rules')
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