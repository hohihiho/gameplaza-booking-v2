const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createHolidaysTable() {
  try {
    console.log('holidays 테이블 생성 중...');
    
    // 테이블 생성 SQL
    const createTableSQL = `
      -- 공휴일 테이블 생성
      CREATE TABLE IF NOT EXISTS holidays (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          date DATE NOT NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('official', 'temporary', 'substitute')),
          is_red_day BOOLEAN DEFAULT true,
          year INTEGER NOT NULL,
          source VARCHAR(20) DEFAULT 'manual',
          last_synced_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(date, name)
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
      CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year);
      CREATE INDEX IF NOT EXISTS idx_holidays_year_month ON holidays(year, EXTRACT(MONTH FROM date));

      -- RLS 정책
      ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

      -- 모든 사용자가 읽기 가능
      CREATE POLICY "holidays_read_all" ON holidays
          FOR SELECT TO authenticated, anon
          USING (true);

      -- 관리자만 수정 가능
      CREATE POLICY "holidays_manage_admin" ON holidays
          FOR ALL TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM admins
                  WHERE admins.user_id = auth.uid()
              )
          );
    `;

    // SQL 실행
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql_query: createTableSQL 
    }).single();

    if (createError) {
      // RPC가 없으면 직접 테이블 체크
      const { data: tables, error: checkError } = await supabase
        .from('holidays')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.code === '42P01') {
        console.error('테이블 생성 실패. Supabase 대시보드에서 직접 SQL을 실행해주세요.');
        console.log('\n아래 SQL을 Supabase 대시보드 SQL Editor에서 실행하세요:\n');
        console.log(createTableSQL);
        return;
      }
    }

    console.log('✅ holidays 테이블이 성공적으로 생성되었습니다.');

    // 2025년 기본 공휴일 데이터 삽입
    const holidays2025 = [
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

    console.log('2025년 기본 공휴일 데이터 삽입 중...');
    
    const { data, error: insertError } = await supabase
      .from('holidays')
      .upsert(holidays2025, { onConflict: 'date,name' });

    if (insertError) {
      console.error('공휴일 데이터 삽입 실패:', insertError);
    } else {
      console.log('✅ 2025년 공휴일 데이터가 성공적으로 삽입되었습니다.');
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

createHolidaysTable();