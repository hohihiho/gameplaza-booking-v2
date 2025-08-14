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

-- 2025년 기본 공휴일 데이터 삽입
INSERT INTO holidays (name, date, type, is_red_day, year, source) VALUES
    ('신정', '2025-01-01', 'official', true, 2025, 'manual'),
    ('설날 연휴', '2025-01-28', 'official', true, 2025, 'manual'),
    ('설날', '2025-01-29', 'official', true, 2025, 'manual'),
    ('설날 연휴', '2025-01-30', 'official', true, 2025, 'manual'),
    ('삼일절', '2025-03-01', 'official', true, 2025, 'manual'),
    ('어린이날', '2025-05-05', 'official', true, 2025, 'manual'),
    ('어린이날 대체공휴일', '2025-05-06', 'substitute', true, 2025, 'manual'),
    ('부처님오신날', '2025-05-05', 'official', true, 2025, 'manual'),
    ('현충일', '2025-06-06', 'official', true, 2025, 'manual'),
    ('광복절', '2025-08-15', 'official', true, 2025, 'manual'),
    ('추석 연휴', '2025-10-05', 'official', true, 2025, 'manual'),
    ('추석', '2025-10-06', 'official', true, 2025, 'manual'),
    ('추석 연휴', '2025-10-07', 'official', true, 2025, 'manual'),
    ('추석 대체공휴일', '2025-10-08', 'substitute', true, 2025, 'manual'),
    ('개천절', '2025-10-03', 'official', true, 2025, 'manual'),
    ('한글날', '2025-10-09', 'official', true, 2025, 'manual'),
    ('성탄절', '2025-12-25', 'official', true, 2025, 'manual')
ON CONFLICT (date, name) DO NOTHING;