import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
// TODO: D1 데이터베이스로 마이그레이션 필요
// import { createAdminClient } from '@/lib/supabase/admin'

export const GET = withAuth(
  async (_req, { user }) => {
    // 임시로 비활성화 - D1 마이그레이션 완료될 때까지
    return NextResponse.json(
      { 
        error: '이 기능은 현재 데이터베이스 마이그레이션 중입니다.',
        message: 'Cloudflare D1으로 전환 작업 진행 중'
      },
      { status: 503 }
    );

    /* D1 마이그레이션 후 구현 예정
    try {
      const supabase = createAdminClient()

      // 사용자 예약 통계 조회
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('id, status, date, start_time, end_time, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('예약 통계 조회 오류:', error)
        return NextResponse.json(
          { error: '예약 통계를 불러올 수 없습니다.' },
          { status: 500 }
        )
      }

      // 통계 계산
      const stats = {
        total: reservations?.length || 0,
        completed: reservations?.filter(r => r.status === 'completed').length || 0,
        pending: reservations?.filter(r => r.status === 'pending').length || 0,
        approved: reservations?.filter(r => r.status === 'approved').length || 0,
        cancelled: reservations?.filter(r => r.status === 'cancelled' || r.status === 'rejected').length || 0
      }

      return NextResponse.json({
        stats
      })

    } catch (error) {
      console.error('예약 통계 API 오류:', error)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
    */
  }
)