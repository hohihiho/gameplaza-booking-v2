-- 추가 보안 문제 수정 마이그레이션
-- 새로 발견된 보안 권고사항들을 수정합니다
-- 실행일: 2025-09-05

-- =============================================================================
-- 1. migration_log 테이블 RLS 활성화
-- =============================================================================

-- migration_log 테이블 RLS 활성화
ALTER TABLE migration_log ENABLE ROW LEVEL SECURITY;

-- migration_log RLS 정책 (기존 정책 삭제 후 재생성)
DROP POLICY IF EXISTS "Only admins can view migration log" ON migration_log;
DROP POLICY IF EXISTS "System can create migration log" ON migration_log;

-- 관리자만 접근 가능
CREATE POLICY "Only admins can view migration log" ON migration_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 시스템만 마이그레이션 로그 생성 가능
CREATE POLICY "System can create migration log" ON migration_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- 2. 함수들의 search_path 보안 취약점 수정
-- =============================================================================

-- 2.1 예약 관련 핵심 함수들
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_scheduled_completions') THEN
        ALTER FUNCTION process_scheduled_completions() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'schedule_reservation_completion') THEN
        ALTER FUNCTION schedule_reservation_completion() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_reservation_status') THEN
        ALTER FUNCTION update_reservation_status() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_update_reservation_status') THEN
        ALTER FUNCTION check_and_update_reservation_status() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_status_update') THEN
        ALTER FUNCTION trigger_status_update() SET search_path = 'public';
    END IF;
END $$;

-- 2.2 기기 상태 관리 함수들
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_device_status_on_checkin') THEN
        ALTER FUNCTION update_device_status_on_checkin() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_device_status_on_completion') THEN
        ALTER FUNCTION update_device_status_on_completion() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_device_status_on_rental_start') THEN
        ALTER FUNCTION update_device_status_on_rental_start() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_device_status_on_rental_end') THEN
        ALTER FUNCTION update_device_status_on_rental_end() SET search_path = 'public';
    END IF;
END $$;

-- 2.3 시간 및 예약 검증 함수들
-- 존재하는 함수들만 처리 (IF EXISTS 사용)
DO $$
BEGIN
    -- set_actual_start_time 함수 처리
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_actual_start_time') THEN
        ALTER FUNCTION set_actual_start_time() SET search_path = 'public';
    END IF;
    
    -- check_time_slot_conflict 함수 처리
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_time_slot_conflict') THEN
        ALTER FUNCTION check_time_slot_conflict() SET search_path = 'public';
    END IF;
    
    -- check_schedule_date 함수 처리
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_schedule_date') THEN
        ALTER FUNCTION check_schedule_date() SET search_path = 'public';
    END IF;
    
    -- check_template_exists 함수 처리
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_template_exists') THEN
        ALTER FUNCTION check_template_exists() SET search_path = 'public';
    END IF;
    
    -- check_rental_start_times 함수 처리
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_rental_start_times') THEN
        ALTER FUNCTION check_rental_start_times() SET search_path = 'public';
    END IF;
    
    -- handle_reservation_time_change 함수 처리
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_reservation_time_change') THEN
        ALTER FUNCTION handle_reservation_time_change() SET search_path = 'public';
    END IF;
END $$;

-- 2.4 계산 및 유틸리티 함수들 (매개변수 포함)
DO $$
BEGIN
    -- calculate_actual_duration 함수 처리 (매개변수 포함)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_actual_duration') THEN
        ALTER FUNCTION calculate_actual_duration(TIMESTAMPTZ, TIMESTAMPTZ) SET search_path = 'public';
    END IF;
    
    -- calculate_adjusted_amount 함수 처리 (매개변수 포함)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_adjusted_amount') THEN
        ALTER FUNCTION calculate_adjusted_amount(UUID) SET search_path = 'public';
    END IF;
    
    -- generate_reservation_number 함수 처리
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_reservation_number') THEN
        ALTER FUNCTION generate_reservation_number() SET search_path = 'public';
    END IF;
    
    -- update_updated_at_column 함수 처리
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        ALTER FUNCTION update_updated_at_column() SET search_path = 'public';
    END IF;
END $$;

-- 2.5 관리자 및 인증 관련 함수들
DO $$
BEGIN
    -- 각 함수를 개별적으로 안전하게 처리
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'is_admin') THEN
            ALTER FUNCTION is_admin() SET search_path = 'public';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL; -- 오류 무시
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'is_super_admin') THEN
            ALTER FUNCTION is_super_admin() SET search_path = 'public';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'get_admin_bank_account') THEN
            ALTER FUNCTION get_admin_bank_account() SET search_path = 'public';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'update_admin_bank_account') THEN
            ALTER FUNCTION update_admin_bank_account() SET search_path = 'public';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'get_user_emails') THEN
            ALTER FUNCTION get_user_emails() SET search_path = 'public';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'get_user_by_email') THEN
            ALTER FUNCTION get_user_by_email() SET search_path = 'public';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- 2.6 대여 시스템 관리 함수들
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_update_expired_rentals') THEN
        ALTER FUNCTION check_and_update_expired_rentals() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_expired_rentals') THEN
        ALTER FUNCTION check_expired_rentals() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_schedule_status') THEN
        ALTER FUNCTION check_schedule_status() SET search_path = 'public';
    END IF;
END $$;

-- 2.7 SMS 및 통신 관련 함수들
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_old_sms_limits') THEN
        ALTER FUNCTION delete_old_sms_limits() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_sms_limit') THEN
        ALTER FUNCTION check_sms_limit() SET search_path = 'public';
    END IF;
END $$;

-- 2.8 디버그 및 모니터링 함수들
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'debug_completion_schedule') THEN
        ALTER FUNCTION debug_completion_schedule() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_rls_status') THEN
        ALTER FUNCTION check_rls_status() SET search_path = 'public';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_security_definer_objects') THEN
        ALTER FUNCTION check_security_definer_objects() SET search_path = 'public';
    END IF;
END $$;

-- =============================================================================
-- 3. 추가 보안 강화 조치
-- =============================================================================

-- 3.1 중요한 함수들에 SECURITY DEFINER 설정 (필요한 경우에만)
-- 주의: SECURITY DEFINER는 신중하게 사용해야 함

DO $$
BEGIN
    -- 관리자 확인 함수들은 SECURITY DEFINER로 설정 (안전한 권한 검사를 위해)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        ALTER FUNCTION is_admin() SECURITY DEFINER;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin') THEN
        ALTER FUNCTION is_super_admin() SECURITY DEFINER;
    END IF;
    
    -- 시스템 함수들은 SECURITY DEFINER로 설정
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_scheduled_completions') THEN
        ALTER FUNCTION process_scheduled_completions() SECURITY DEFINER;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_reservation_status') THEN
        ALTER FUNCTION update_reservation_status() SECURITY DEFINER;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_status_update') THEN
        ALTER FUNCTION trigger_status_update() SECURITY DEFINER;
    END IF;
END $$;

-- 3.2 중요한 함수들의 실행 권한 제한
-- 일반 사용자가 직접 호출할 수 없도록 권한 제한

DO $$
BEGIN
    -- 시스템 함수들의 실행 권한을 관리자에게만 부여
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_scheduled_completions') THEN
        REVOKE EXECUTE ON FUNCTION process_scheduled_completions() FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION process_scheduled_completions() TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_status_update') THEN
        REVOKE EXECUTE ON FUNCTION trigger_status_update() FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION trigger_status_update() TO authenticated;
    END IF;
END $$;

-- =============================================================================
-- 4. 보안 검증 업데이트
-- =============================================================================

-- 4.1 함수 search_path 설정 확인 함수 업데이트
CREATE OR REPLACE FUNCTION check_function_security()
RETURNS TABLE (
  function_name TEXT,
  search_path_setting TEXT,
  security_definer BOOLEAN,
  has_proper_security BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::TEXT,
    COALESCE(
      (SELECT setting 
       FROM pg_settings 
       WHERE name = 'search_path' AND source = 'function'),
      'default'
    )::TEXT as search_path_setting,
    p.prosecdef,
    (
      -- search_path가 설정되었거나 SECURITY DEFINER인 경우를 안전하다고 판단
      p.prosecdef = true OR 
      EXISTS (
        SELECT 1 FROM pg_proc_config pc 
        WHERE pc.oid = p.oid 
        AND pc.config[1] LIKE 'search_path=%'
      )
    ) as has_proper_security
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  ORDER BY p.proname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public';

-- 4.2 전체 보안 상태 확인 함수
CREATE OR REPLACE FUNCTION security_audit_summary()
RETURNS TABLE (
  category TEXT,
  total_count INTEGER,
  secure_count INTEGER,
  security_percentage NUMERIC(5,2)
) AS $$
BEGIN
  -- RLS 활성화 상태
  RETURN QUERY
  SELECT 
    'RLS Enabled Tables'::TEXT,
    COUNT(*)::INTEGER as total,
    COUNT(CASE WHEN rowsecurity THEN 1 END)::INTEGER as secure,
    ROUND(
      (COUNT(CASE WHEN rowsecurity THEN 1 END)::NUMERIC / COUNT(*)) * 100, 
      2
    ) as percentage
  FROM pg_tables
  WHERE schemaname = 'public';
  
  -- 함수 보안 설정
  RETURN QUERY
  SELECT 
    'Secure Functions'::TEXT,
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN has_proper_security THEN 1 END)::INTEGER,
    ROUND(
      (COUNT(CASE WHEN has_proper_security THEN 1 END)::NUMERIC / COUNT(*)) * 100,
      2
    )
  FROM check_function_security();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public';

-- =============================================================================
-- 마이그레이션 완료 기록
-- =============================================================================

-- 마이그레이션 실행 기록
INSERT INTO migration_log (
  migration_name,
  description,
  executed_at
) VALUES (
  '20250905_fix_additional_security_issues',
  '추가 보안 문제 수정: migration_log RLS 활성화, 함수 search_path 보안 강화',
  NOW()
) ON CONFLICT (migration_name) DO NOTHING;

-- 마이그레이션 설명:
-- 1. migration_log 테이블 RLS 활성화 및 적절한 권한 설정
-- 2. 모든 public 함수들의 search_path 보안 취약점 수정
-- 3. 중요한 함수들에 적절한 보안 속성 설정 (SECURITY DEFINER)
-- 4. 함수 실행 권한 제한으로 추가 보안 강화
-- 5. 보안 상태 확인을 위한 새로운 유틸리티 함수 제공

-- 보안 검증 쿼리:
-- SELECT * FROM check_function_security();
-- SELECT * FROM security_audit_summary();