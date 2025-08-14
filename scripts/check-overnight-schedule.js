const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOvernightSchedules() {
  try {
    console.log('=== 공휴일 확인 ===');
    
    // 8월 공휴일 확인
    const { data: holidays, error: holidayError } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', '2025-08-01')
      .lte('date', '2025-08-31')
      .order('date');
    
    if (holidayError) {
      console.error('공휴일 조회 오류:', holidayError);
    } else {
      console.log('8월 공휴일:', holidays);
    }
    
    console.log('\n=== 8월 14일 밤샘영업 일정 확인 ===');
    
    // 8월 14일 schedule 확인
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('date', '2025-08-14');
    
    if (scheduleError) {
      console.error('일정 조회 오류:', scheduleError);
    } else {
      console.log('8월 14일 일정:', schedules);
    }
    
    // 8월 전체 밤샘영업 일정 확인
    console.log('\n=== 8월 전체 밤샘영업 일정 ===');
    const { data: overnightSchedules, error: overnightError } = await supabase
      .from('schedule')
      .select('*')
      .eq('type', 'overnight')
      .gte('date', '2025-08-01')
      .lte('date', '2025-08-31')
      .order('date');
    
    if (overnightError) {
      console.error('밤샘영업 조회 오류:', overnightError);
    } else {
      console.log('8월 밤샘영업 일정:', overnightSchedules);
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

checkOvernightSchedules();