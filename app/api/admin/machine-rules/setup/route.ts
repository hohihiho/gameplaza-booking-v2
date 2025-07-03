import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 초기 데이터 설정
    const initialRules = [
      {
        content: '실시간 상태는 약 1분마다 업데이트됩니다',
        display_order: 1,
        is_active: true
      },
      {
        content: '대여 예약은 마이마이, 츄니즘, 발키리, 라이트닝만 가능합니다',
        display_order: 2,
        is_active: true
      },
      {
        content: '점검 중인 기기는 일시적으로 이용할 수 없습니다',
        display_order: 3,
        is_active: true
      },
      {
        content: '일반 이용은 현장에서 바로 가능합니다',
        display_order: 4,
        is_active: true
      }
    ]

    // 기존 데이터가 있는지 확인
    const { count } = await supabaseAdmin
      .from('machine_rules')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      // 초기 데이터 삽입
      const { error } = await supabaseAdmin
        .from('machine_rules')
        .insert(initialRules)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('기기 현황 안내사항 설정 오류:', error)
    return NextResponse.json({ 
      error: error.message || '초기 설정에 실패했습니다' 
    }, { status: 500 })
  }
}