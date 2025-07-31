import { NextRequest } from 'next/server'
import { createResponse, ErrorResponse } from '@/lib/api/response'
import { withAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// 관리자용 예약 목록 조회 (v2)
export const GET = withAuth(
  async (request: NextRequest, { user: _user }) => {
    try {
      const supabaseAdmin = createAdminClient()
      const { searchParams } = new URL(request.url)
      const year = searchParams.get('year')
      const limit = searchParams.get('limit')
      const status = searchParams.get('status')
      const date = searchParams.get('date')
      
      // 전체 예약 수 확인 (디버깅용)
      const { count: totalCount, error: countError } = await supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
      
      console.log('Admin reservations API: Total reservations in DB:', totalCount, 'Error:', countError)
      
      let query = supabaseAdmin
        .from('reservations')
        .select(`
          *,
          users:user_id (
            id,
            name,
            phone,
            email,
            nickname
          ),
          devices:device_id (
            id,
            device_number,
            device_types (
              id,
              name,
              model_name,
              version_name,
              category_id,
              device_categories (
                id,
                name
              )
            )
          )
        `)
      
      // 연도 필터링
      if (year && year !== 'all') {
        const startDate = `${year}-01-01`
        const endDate = `${year}-12-31`
        query = query.gte('date', startDate).lte('date', endDate)
      }
      
      // 특정 날짜 필터링
      if (date) {
        query = query.eq('date', date)
      }
      
      // 상태 필터링
      if (status && status !== 'all') {
        if (status === 'cancelled') {
          // cancelled는 'cancelled'와 'rejected' 포함
          query = query.in('status', ['cancelled', 'rejected'])
        } else {
          query = query.eq('status', status)
        }
      }
      
      // 제한 개수 적용
      if (limit) {
        query = query.limit(parseInt(limit))
      } else {
        query = query.limit(1000)
      }
      
      // 최신 순으로 정렬
      query = query.order('created_at', { ascending: false })

      console.log('Admin reservations API: Query built')
      console.log('Query parameters:', { year, limit, status, date })
      
      const { data: reservationsData, error } = await query

      console.log('Admin reservations API: Raw data count:', reservationsData?.length || 0)
      console.log('Admin reservations API: Query error:', error)
      
      if (reservationsData && reservationsData.length > 0) {
        console.log('Admin reservations API: First reservation:', reservationsData[0])
      }

      if (error) {
        console.error('예약 데이터 조회 에러:', error)
        return createResponse(
          new ErrorResponse('예약 데이터 조회 실패', 'DATABASE_ERROR'),
          500
        )
      }

      // v2 형식으로 변환 (snake_case 유지)
      const formattedData = (reservationsData || []).map((res: any) => ({
        id: res.id,
        reservation_number: res.reservation_number,
        user_id: res.user_id,
        user_name: res.users?.nickname || res.users?.name || '알 수 없음',
        user_phone: res.users?.phone || '',
        user_email: res.users?.email || '',
        device_id: res.device_id,
        device_number: res.devices?.device_number || res.assigned_device_number,
        device_type_id: res.devices?.device_types?.id || res.device_type_id,
        device_type_name: res.devices?.device_types?.name || res.device_type_name || '알 수 없음',
        device_model_name: res.devices?.device_types?.model_name,
        device_version_name: res.devices?.device_types?.version_name,
        device_category_name: res.devices?.device_types?.device_categories?.name,
        date: res.date,
        start_time: res.start_time,
        end_time: res.end_time,
        start_hour: res.start_hour,
        end_hour: res.end_hour,
        player_count: res.player_count || 1,
        credit_type: res.credit_type,
        total_amount: res.total_amount || 0,
        status: res.status,
        payment_status: res.payment_status,
        payment_method: res.payment_method,
        assigned_device_number: res.assigned_device_number,
        user_notes: res.user_notes,
        admin_notes: res.admin_notes,
        rejection_reason: res.rejection_reason,
        check_in_at: res.check_in_at,
        check_in_by: res.check_in_by,
        actual_start_time: res.actual_start_time,
        actual_end_time: res.actual_end_time,
        approved_at: res.approved_at,
        approved_by: res.approved_by,
        created_at: res.created_at,
        updated_at: res.updated_at
      }))

      // createResponse는 이미 success: true와 data를 감싸므로 직접 데이터만 전달
      return createResponse({
        reservations: formattedData,
        total: formattedData.length
      })
    } catch (error) {
      console.error('Get reservations error:', error)
      return createResponse(
        new ErrorResponse('예약 목록 조회 중 오류가 발생했습니다', 'INTERNAL_ERROR'),
        500
      )
    }
  },
  { requireAdmin: true }
)

// 예약 상태 업데이트 (v2)
export const PATCH = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json()
      const { id, status, notes, rejection_reason } = body

      if (!id || !status) {
        return createResponse(
          new ErrorResponse('필수 정보가 누락되었습니다', 'VALIDATION_ERROR'),
          400
        )
      }

      const validStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'checked_in', 'no_show']
      if (!validStatuses.includes(status)) {
        return createResponse(
          new ErrorResponse('유효하지 않은 상태입니다', 'VALIDATION_ERROR'),
          400
        )
      }

      const supabaseAdmin = createAdminClient()
      
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString()
        updateData.approved_by = user.id
      }
      
      if ((status === 'rejected' || status === 'cancelled') && rejection_reason) {
        updateData.rejection_reason = rejection_reason
      }
      
      if (notes) {
        updateData.admin_notes = notes
      }

      const { data, error } = await supabaseAdmin
        .from('reservations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('예약 상태 업데이트 에러:', error)
        return createResponse(
          new ErrorResponse('예약 상태 업데이트 실패', 'DATABASE_ERROR'),
          500
        )
      }

      // TODO: 상태 변경에 따른 추가 처리
      // - 승인 시: 스케줄 업데이트, 푸시 알림
      // - 거절/취소 시: 스케줄 삭제, 푸시 알림

      // createResponse는 이미 success: true와 data를 감싸므로 직접 데이터만 전달
      return createResponse({
        reservation: {
          id: data.id,
          status: data.status,
          updated_at: data.updated_at
        }
      })
    } catch (error) {
      console.error('Update reservation error:', error)
      return createResponse(
        new ErrorResponse('예약 상태 업데이트 중 오류가 발생했습니다', 'INTERNAL_ERROR'),
        500
      )
    }
  },
  { requireAdmin: true }
)