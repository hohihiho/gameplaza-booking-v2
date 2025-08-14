const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.');
  console.log('\n아래 SQL을 Supabase 대시보드 SQL Editor에서 실행하세요:\n');
  
  const sql = `
-- schedule 테이블 생성
CREATE TABLE IF NOT EXISTS schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, type)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(date);
CREATE INDEX IF NOT EXISTS idx_schedule_type ON schedule(type);
CREATE INDEX IF NOT EXISTS idx_schedule_date_type ON schedule(date, type);

-- RLS 정책
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "schedule_read_all" ON schedule
    FOR SELECT TO authenticated, anon
    USING (true);

-- 관리자만 수정 가능
CREATE POLICY "schedule_manage_admin" ON schedule
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.user_id = auth.uid()
        )
    );

-- 8월 14일 밤샘영업 일정 추가 (광복절 전날)
INSERT INTO schedule (date, type, start_time, end_time, description)
VALUES ('2025-08-14', 'overnight', '24:00:00', '29:00:00', '광복절 전날 밤샘영업')
ON CONFLICT (date, type) DO NOTHING;
`;
  
  console.log(sql);
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createScheduleTable() {
  console.log('Supabase 대시보드에서 SQL을 실행해주세요.');
  console.log('https://supabase.com/dashboard/project/rupeyejnfurlcpgneekg/sql/new');
}

createScheduleTable();