// Supabase Edge Function - 예약 상태 자동 업데이트
// 크론잡 대신 Edge Function을 사용하여 주기적으로 실행

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 현재 KST 시간 계산
    const now = new Date()
    const kstOffset = 9 * 60 * 60 * 1000 // 9시간을 밀리초로
    const kstTime = new Date(now.getTime() + kstOffset)
    
    const currentDate = kstTime.toISOString().split('T')[0]
    const currentTime = kstTime.toTimeString().slice(0, 5)

    console.log(`상태 업데이트 시작 - KST: ${currentDate} ${currentTime}`)

    // 1. 종료 시간이 지난 예약 완료 처리
    const { data: completedReservations, error: completeError } = await supabase
      .from('reservations')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'approved')
      .or(`date.lt.${currentDate},and(date.eq.${currentDate},end_time.lt.${currentTime})`)
      .select()

    if (completeError) {
      console.error('완료 처리 실패:', completeError)
    } else {
      console.log(`${completedReservations?.length || 0}개 예약 완료 처리`)
    }

    // 2. 시작 시간 30분 지났는데 체크인 안 한 예약 no_show 처리
    const thirtyMinutesAgo = new Date(kstTime.getTime() - 30 * 60 * 1000)
    const thirtyMinutesAgoTime = thirtyMinutesAgo.toTimeString().slice(0, 5)

    const { data: noShowReservations, error: noShowError } = await supabase
      .from('reservations')
      .update({ 
        status: 'no_show',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'approved')
      .eq('date', currentDate)
      .lt('start_time', thirtyMinutesAgoTime)
      .select()

    if (noShowError) {
      console.error('No-show 처리 실패:', noShowError)
    } else {
      console.log(`${noShowReservations?.length || 0}개 예약 no-show 처리`)
    }

    // 3. 24시간이 지난 pending 예약 자동 취소
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const { data: cancelledReservations, error: cancelError } = await supabase
      .from('reservations')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('created_at', oneDayAgo.toISOString())
      .select()

    if (cancelError) {
      console.error('자동 취소 처리 실패:', cancelError)
    } else {
      console.log(`${cancelledReservations?.length || 0}개 예약 자동 취소`)
    }

    // 4. 데이터베이스 함수 호출 (선택적)
    const { error: functionError } = await supabase.rpc('trigger_status_update')
    
    if (functionError) {
      console.error('트리거 함수 실행 실패:', functionError)
    }

    // 결과 반환
    const result = {
      success: true,
      timestamp: kstTime.toISOString(),
      updated: {
        completed: completedReservations?.length || 0,
        no_show: noShowReservations?.length || 0,
        cancelled: cancelledReservations?.length || 0
      }
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Edge Function 실행 실패:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500 
      }
    )
  }
})