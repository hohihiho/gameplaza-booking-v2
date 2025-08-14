/**
 * 공휴일 동기화 스크립트
 * GitHub Actions에서 실행되거나 수동으로 실행 가능
 */

const { createClient } = require('@supabase/supabase-js');

// 환경 변수 확인
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const holidayApiKey = process.env.NEXT_PUBLIC_HOLIDAY_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 공공데이터 API에서 공휴일 정보 가져오기
 */
async function fetchHolidaysFromAPI(year) {
  try {
    if (!holidayApiKey) {
      console.log('공휴일 API 키가 없어 로컬 데이터를 사용합니다.');
      return getLocalHolidays(year);
    }

    const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo`;
    const params = new URLSearchParams({
      serviceKey: holidayApiKey,
      solYear: year.toString(),
      _type: 'json',
      numOfRows: '50'
    });

    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.response.header.resultCode !== '00') {
      throw new Error(`API 오류: ${data.response.header.resultMsg}`);
    }

    const items = data.response.body.items?.item || [];
    
    return items.map(item => ({
      name: item.dateName,
      date: formatDate(item.locdate),
      type: getHolidayType(item.dateKind, item.dateName),
      is_red_day: item.isHoliday === 'Y',
      year: year,
      source: 'api'
    }));
  } catch (error) {
    console.error('공휴일 API 호출 오류:', error);
    return getLocalHolidays(year);
  }
}

/**
 * 날짜 포맷 변환
 */
function formatDate(locdate) {
  const dateStr = locdate.toString();
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
}

/**
 * 공휴일 타입 결정
 */
function getHolidayType(dateKind, dateName) {
  if (dateName.includes('대체')) {
    return 'substitute';
  }
  if (dateName.includes('임시')) {
    return 'temporary';
  }
  return 'official';
}

/**
 * 로컬 공휴일 데이터 (백업용)
 */
function getLocalHolidays(year) {
  if (year === 2025) {
    return [
      { name: '신정', date: '2025-01-01', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '설날 연휴', date: '2025-01-28', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '설날', date: '2025-01-29', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '설날 연휴', date: '2025-01-30', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '삼일절', date: '2025-03-01', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '어린이날', date: '2025-05-05', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '어린이날 대체공휴일', date: '2025-05-06', type: 'substitute', is_red_day: true, year: 2025, source: 'manual' },
      { name: '부처님오신날', date: '2025-05-05', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '현충일', date: '2025-06-06', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '광복절', date: '2025-08-15', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '추석 연휴', date: '2025-10-05', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '추석', date: '2025-10-06', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '추석 연휴', date: '2025-10-07', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '추석 대체공휴일', date: '2025-10-08', type: 'substitute', is_red_day: true, year: 2025, source: 'manual' },
      { name: '개천절', date: '2025-10-03', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '한글날', date: '2025-10-09', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
      { name: '성탄절', date: '2025-12-25', type: 'official', is_red_day: true, year: 2025, source: 'manual' }
    ];
  }
  return [];
}

/**
 * 공휴일 동기화 실행
 */
async function syncHolidays() {
  const year = new Date().getFullYear();
  let created = 0;
  let updated = 0;
  let errors = 0;

  try {
    console.log(`${year}년 공휴일 동기화 시작...`);
    
    // API에서 공휴일 가져오기
    const apiHolidays = await fetchHolidaysFromAPI(year);
    
    if (apiHolidays.length === 0) {
      console.log('API에서 공휴일을 가져올 수 없습니다.');
      return;
    }

    // 기존 공휴일 조회
    const { data: existingHolidays, error: fetchError } = await supabase
      .from('holidays')
      .select('date, name')
      .eq('year', year);

    if (fetchError) {
      console.error('기존 공휴일 조회 실패:', fetchError);
      return;
    }

    const existingMap = new Map(
      (existingHolidays || []).map(h => [`${h.date}_${h.name}`, true])
    );

    // 공휴일 추가/업데이트
    for (const holiday of apiHolidays) {
      const key = `${holiday.date}_${holiday.name}`;
      
      try {
        if (!existingMap.has(key)) {
          // 새 공휴일 추가
          const { error } = await supabase
            .from('holidays')
            .insert({
              ...holiday,
              last_synced_at: new Date().toISOString()
            });

          if (error) {
            console.error(`공휴일 추가 실패 (${holiday.name}):`, error);
            errors++;
          } else {
            created++;
            console.log(`새 공휴일 추가: ${holiday.name} (${holiday.date})`);
          }
        } else {
          // 기존 공휴일 업데이트 (동기화 시간만)
          const { error } = await supabase
            .from('holidays')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('date', holiday.date)
            .eq('name', holiday.name);

          if (error) {
            console.error(`공휴일 업데이트 실패 (${holiday.name}):`, error);
            errors++;
          } else {
            updated++;
          }
        }
      } catch (err) {
        console.error(`공휴일 처리 오류 (${holiday.name}):`, err);
        errors++;
      }
    }

    console.log(`동기화 완료 - 생성: ${created}, 업데이트: ${updated}, 오류: ${errors}`);
    
    // 새로운 공휴일이 있으면 알림 (여기에 알림 로직 추가 가능)
    if (created > 0) {
      console.log(`🎉 ${created}개의 새로운 공휴일이 추가되었습니다!`);
    }
    
  } catch (error) {
    console.error('공휴일 동기화 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
syncHolidays()
  .then(() => {
    console.log('공휴일 동기화가 완료되었습니다.');
    process.exit(0);
  })
  .catch(error => {
    console.error('동기화 실패:', error);
    process.exit(1);
  });