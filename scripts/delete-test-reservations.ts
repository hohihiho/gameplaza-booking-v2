import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// .env.local 파일 로드
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function deleteTestReservations() {
  console.log('테스트 예약 삭제 시작...')
  
  try {
    // 테스트 사용자의 예약 삭제
    const supabase = createClient();
  const { error$1 } = await supabase.from('reservations')
      .delete()
      .eq('date', '2025-07-25')
    
    if (error) throw error
    
    console.log('2025-07-25 날짜의 모든 예약이 삭제되었습니다.')
    
  } catch (error) {
    console.error('예약 삭제 중 오류:', error)
  }
}

// 스크립트 실행
deleteTestReservations()