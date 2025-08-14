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

    // 1. 체크인된 예약 중 시작 시간이 된 예약을 in_use(대여중)로 변경
    const { data: inUseReservations, error: inUseError } = await supabase
      .from('reservations')
      .update({ 
        status: 'in_use',
        actual_start_time: currentTime,
        updated_at: new Date().toISOString()
      })
      .eq('status', 'checked_in')
      .eq('date', currentDate)
      .lte('start_time', currentTime)
      .select()

    if (inUseError) {
      console.error('대여중 처리 실패:', inUseError)
    } else {
      console.log(`${inUseReservations?.length || 0}개 예약 대여중 처리`)
    }

    // 2. 종료 시간이 지난 대여중 예약을 완료 처리
    const { data: completedReservations, error: completeError } = await supabase
      .from('reservations')
      .update({ 
        status: 'completed',
        actual_end_time: currentTime,
        updated_at: new Date().toISOString()
      })
      .eq('status', 'in_use')
      .or(`date.lt.${currentDate},and(date.eq.${currentDate},end_time.lt.${currentTime})`)
      .select()

    if (completeError) {
      console.error('완료 처리 실패:', completeError)
    } else {
      console.log(`${completedReservations?.length || 0}개 예약 완료 처리`)
      
      // 완료된 예약의 기기 상태를 사용 가능으로 변경
      if (completedReservations && completedReservations.length > 0) {
        const deviceIds = completedReservations.map(r => r.device_id)
        await supabase
          .from('devices')
          .update({ 
            status: 'available',
            updated_at: new Date().toISOString()
          })
          .in('id', deviceIds)
      }
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
        in_use: inUseReservations?.length || 0,
        completed: completedReservations?.length || 0
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