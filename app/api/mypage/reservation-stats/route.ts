import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/db'

export const GET = withAuth(
  async (_req, { user }) => {
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
  }
)