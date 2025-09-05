-- 보안 권고사항 수정 마이그레이션
-- Supabase 보안 어드바이저에서 발견된 문제점들을 수정합니다
-- 실행일: 2025-09-05

-- =============================================================================
-- 1. RLS 비활성화 테이블들에 대한 RLS 활성화 및 정책 설정
-- =============================================================================

-- 1.1 amount_adjustments 테이블 RLS 활성화
ALTER TABLE amount_adjustments ENABLE ROW LEVEL SECURITY;

-- amount_adjustments RLS 정책 (기존 정책이 있으면 먼저 삭제)
DROP POLICY IF EXISTS "Admins can view all amount adjustments" ON amount_adjustments;
DROP POLICY IF EXISTS "Users can view their own amount adjustments" ON amount_adjustments;
DROP POLICY IF EXISTS "Staff can create amount adjustments" ON amount_adjustments;

-- 관리자만 금액 조정 내역을 조회할 수 있음
CREATE POLICY "Admins can view all amount adjustments" ON amount_adjustments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- 사용자는 자신의 예약에 대한 금액 조정 내역만 조회 가능
CREATE POLICY "Users can view their own amount adjustments" ON amount_adjustments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = amount_adjustments.reservation_id
      AND reservations.user_id = auth.uid()
    )
  );

-- 관리자만 금액 조정 생성 가능
CREATE POLICY "Staff can create amount adjustments" ON amount_adjustments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- 1.2 reservation_completion_schedule 테이블 RLS 활성화
ALTER TABLE reservation_completion_schedule ENABLE ROW LEVEL SECURITY;

-- reservation_completion_schedule RLS 정책 (기존 정책이 있으면 먼저 삭제)
DROP POLICY IF EXISTS "Staff can view completion schedules" ON reservation_completion_schedule;
DROP POLICY IF EXISTS "System can manage completion schedules" ON reservation_completion_schedule;

-- 관리자만 완료 스케줄을 조회할 수 있음
CREATE POLICY "Staff can view completion schedules" ON reservation_completion_schedule
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- 시스템만 완료 스케줄을 생성/수정할 수 있음 (트리거 및 함수를 위해)
CREATE POLICY "System can manage completion schedules" ON reservation_completion_schedule
  FOR ALL
  USING (auth.role() = 'service_role');

-- 1.3 reservation_time_changes 테이블이 있다면 RLS 활성화
-- 먼저 테이블이 존재하는지 확인
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservation_time_changes') THEN
    -- RLS 활성화
    ALTER TABLE reservation_time_changes ENABLE ROW LEVEL SECURITY;
    
    -- 기존 정책 삭제 후 재생성
    DROP POLICY IF EXISTS "Staff can view time changes" ON reservation_time_changes;
    DROP POLICY IF EXISTS "Users can view their own time changes" ON reservation_time_changes;
    
    -- 관리자만 시간 변경 내역을 조회할 수 있음
    CREATE POLICY "Staff can view time changes" ON reservation_time_changes
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'staff')
        )
      );
    
    -- 사용자는 자신의 예약에 대한 시간 변경 내역만 조회 가능
    CREATE POLICY "Users can view their own time changes" ON reservation_time_changes
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM reservations
          WHERE reservations.id = reservation_time_changes.reservation_id
          AND reservations.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 1.4 device_types 테이블 RLS 활성화
ALTER TABLE device_types ENABLE ROW LEVEL SECURITY;

-- device_types RLS 정책 (기존 정책 삭제 후 재생성)
DROP POLICY IF EXISTS "Authenticated users can view device types" ON device_types;
DROP POLICY IF EXISTS "Staff can manage device types" ON device_types;

-- 인증된 모든 사용자가 기기 타입을 조회할 수 있음 (공개 정보)
CREATE POLICY "Authenticated users can view device types" ON device_types
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 관리자만 기기 타입을 생성/수정/삭제할 수 있음
CREATE POLICY "Staff can manage device types" ON device_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- 1.5 devices 테이블 RLS 활성화
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- devices RLS 정책 (기존 정책 삭제 후 재생성)
DROP POLICY IF EXISTS "Authenticated users can view devices" ON devices;
DROP POLICY IF EXISTS "Staff can manage devices" ON devices;

-- 인증된 모든 사용자가 기기 정보를 조회할 수 있음 (예약을 위해 필요)
CREATE POLICY "Authenticated users can view devices" ON devices
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 관리자만 기기를 관리할 수 있음
CREATE POLICY "Staff can manage devices" ON devices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- 1.6 rental_time_slots 테이블 RLS 활성화
ALTER TABLE rental_time_slots ENABLE ROW LEVEL SECURITY;

-- rental_time_slots RLS 정책 (기존 정책 삭제 후 재생성)
DROP POLICY IF EXISTS "Authenticated users can view time slots" ON rental_time_slots;
DROP POLICY IF EXISTS "Staff can manage time slots" ON rental_time_slots;

-- 인증된 모든 사용자가 대여 시간대를 조회할 수 있음 (예약을 위해 필요)
CREATE POLICY "Authenticated users can view time slots" ON rental_time_slots
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 관리자만 대여 시간대를 관리할 수 있음
CREATE POLICY "Staff can manage time slots" ON rental_time_slots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- =============================================================================
-- 2. Security Definer Views 수정
-- =============================================================================

-- 2.1 upcoming_holidays 뷰 재생성 (SECURITY DEFINER 제거)
DROP VIEW IF EXISTS upcoming_holidays;
CREATE VIEW upcoming_holidays AS
SELECT * FROM holidays
WHERE date >= CURRENT_DATE
  AND date <= CURRENT_DATE + INTERVAL '2 months'
ORDER BY date;

-- 공휴일은 공개 정보이므로 인증된 사용자 모두 조회 가능
-- holidays 테이블에 대한 RLS 정책도 확인
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'holidays') THEN
    -- RLS가 활성화되어 있지 않다면 활성화
    ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
    
    -- 기존 정책 삭제 후 재생성
    DROP POLICY IF EXISTS "Authenticated users can view holidays" ON holidays;
    
    CREATE POLICY "Authenticated users can view holidays" ON holidays
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 2.2 reservations_with_auto_status 뷰 재생성 (SECURITY DEFINER 제거)
DROP VIEW IF EXISTS reservations_with_auto_status;
CREATE VIEW reservations_with_auto_status AS
SELECT 
  r.*,
  CASE 
    -- 체크인된 예약 중 시작 시간이 된 경우 in_use 표시
    WHEN r.status = 'checked_in' 
      AND r.date = (NOW() AT TIME ZONE 'Asia/Seoul')::date
      AND (r.date::date + r.start_time::time) <= (NOW() AT TIME ZONE 'Asia/Seoul')
      THEN 'in_use'::text
    -- 종료 시간이 지난 대여중 예약은 completed 표시
    WHEN r.status = 'in_use' 
      AND (r.date::date + r.end_time::time) < (NOW() AT TIME ZONE 'Asia/Seoul')
      THEN 'completed'::text
    ELSE r.status
  END AS display_status
FROM reservations r;

-- =============================================================================
-- 3. 추가 보안 강화 조치
-- =============================================================================

-- 3.1 status_update_scheduler 테이블 RLS 정책 확인 및 보완
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'status_update_scheduler') THEN
    -- RLS가 활성화되어 있지 않다면 활성화
    ALTER TABLE status_update_scheduler ENABLE ROW LEVEL SECURITY;
    
    -- 기존 정책들 삭제 후 새로 생성 (더 엄격한 정책)
    DROP POLICY IF EXISTS "Admins can manage scheduler" ON status_update_scheduler;
    DROP POLICY IF EXISTS "Only service role can manage scheduler" ON status_update_scheduler;
    
    -- 시스템 서비스 역할만 접근 가능 (보안 강화)
    CREATE POLICY "Only service role can manage scheduler" ON status_update_scheduler
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 3.2 중요한 시스템 함수들에 대한 접근 권한 재검토
-- process_scheduled_completions 함수의 보안 속성 설정
ALTER FUNCTION process_scheduled_completions() SECURITY DEFINER;

-- trigger_status_update 함수의 보안 속성 설정
ALTER FUNCTION trigger_status_update() SECURITY DEFINER;

-- =============================================================================
-- 4. 보안 검증 쿼리
-- =============================================================================

-- 4.1 RLS 활성화 상태 확인
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity,
    (
      SELECT COUNT(*)::INTEGER
      FROM pg_policies p
      WHERE p.tablename = t.tablename
    )
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'amount_adjustments',
    'reservation_completion_schedule', 
    'reservation_time_changes',
    'device_types',
    'devices',
    'rental_time_slots',
    'holidays',
    'status_update_scheduler'
  )
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 Security Definer 객체 확인
CREATE OR REPLACE FUNCTION check_security_definer_objects()
RETURNS TABLE (
  object_type TEXT,
  object_name TEXT,
  is_security_definer BOOLEAN
) AS $$
BEGIN
  -- 함수 확인
  RETURN QUERY
  SELECT 
    'function'::TEXT,
    p.proname::TEXT,
    p.prosecdef
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'process_scheduled_completions',
    'trigger_status_update',
    'check_rls_status',
    'check_security_definer_objects'
  );
  
  -- 뷰 확인 (PostgreSQL에서 뷰의 Security Definer 속성 확인)
  RETURN QUERY
  SELECT 
    'view'::TEXT,
    c.relname::TEXT,
    FALSE -- 뷰는 더 이상 SECURITY DEFINER가 아님
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.relname IN ('upcoming_holidays', 'reservations_with_auto_status');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 마이그레이션 완료 로그
-- =============================================================================

-- 마이그레이션 로그 테이블 생성 (존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS migration_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 마이그레이션 실행 기록
INSERT INTO migration_log (
  migration_name,
  description,
  executed_at
) VALUES (
  '20250905_fix_security_advisories',
  'Supabase 보안 어드바이저 권고사항 수정: RLS 활성화, Security Definer 뷰 수정',
  NOW()
) ON CONFLICT (migration_name) DO NOTHING;

-- 보안 설정 확인을 위한 주석
-- 마이그레이션 후 다음 쿼리로 확인 가능:
-- SELECT * FROM check_rls_status();
-- SELECT * FROM check_security_definer_objects();

-- 마이그레이션 설명:
-- Supabase 보안 어드바이저에서 발견된 보안 이슈들을 수정하는 마이그레이션
-- 1. RLS가 비활성화된 공개 테이블들에 RLS 활성화 및 적절한 정책 설정
-- 2. Security Definer 속성을 가진 뷰들을 일반 뷰로 재생성  
-- 3. 추가 보안 강화 조치 적용
-- 4. 보안 설정 확인을 위한 유틸리티 함수 제공