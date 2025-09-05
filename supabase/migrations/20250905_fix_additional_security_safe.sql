-- 추가 보안 문제 수정 마이그레이션 (안전 버전)
-- 새로 발견된 보안 권고사항들을 수정합니다 (존재하지 않는 함수는 자동으로 건너뜀)
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
-- 2. 함수들의 search_path 보안 취약점 수정 (안전 버전)
-- =============================================================================

-- 모든 함수를 개별적으로 안전하게 처리하는 함수
CREATE OR REPLACE FUNCTION fix_function_search_path_safe()
RETURNS TEXT AS $$
DECLARE
    function_list TEXT[] := ARRAY[
        'process_scheduled_completions',
        'schedule_reservation_completion', 
        'update_reservation_status',
        'check_and_update_reservation_status',
        'trigger_status_update',
        'update_device_status_on_checkin',
        'update_device_status_on_completion',
        'update_device_status_on_rental_start',
        'update_device_status_on_rental_end',
        'set_actual_start_time',
        'check_time_slot_conflict',
        'check_schedule_date',
        'check_template_exists',
        'check_rental_start_times',
        'handle_reservation_time_change',
        'generate_reservation_number',
        'update_updated_at_column',
        'is_admin',
        'is_super_admin',
        'get_admin_bank_account',
        'update_admin_bank_account',
        'get_user_emails',
        'get_user_by_email',
        'check_and_update_expired_rentals',
        'check_expired_rentals',
        'check_schedule_status',
        'delete_old_sms_limits',
        'check_sms_limit',
        'debug_completion_schedule',
        'check_rls_status',
        'check_security_definer_objects'
    ];
    func_name TEXT;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    result_text TEXT := '';
BEGIN
    -- 각 함수를 개별적으로 처리
    FOREACH func_name IN ARRAY function_list
    LOOP
        BEGIN
            -- 함수가 존재하는지 확인
            IF EXISTS (
                SELECT 1 FROM pg_proc p 
                JOIN pg_namespace n ON p.pronamespace = n.oid 
                WHERE n.nspname = 'public' AND p.proname = func_name
            ) THEN
                -- search_path 설정
                EXECUTE format('ALTER FUNCTION %I() SET search_path = ''public''', func_name);
                success_count := success_count + 1;
                result_text := result_text || format('✓ %s - 성공\n', func_name);
            ELSE
                result_text := result_text || format('- %s - 존재하지 않음\n', func_name);
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                result_text := result_text || format('✗ %s - 오류: %s\n', func_name, SQLERRM);
        END;
    END LOOP;
    
    -- 매개변수가 있는 함수들 별도 처리
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'calculate_actual_duration') THEN
            ALTER FUNCTION calculate_actual_duration(TIMESTAMPTZ, TIMESTAMPTZ) SET search_path = 'public';
            success_count := success_count + 1;
            result_text := result_text || '✓ calculate_actual_duration(TIMESTAMPTZ, TIMESTAMPTZ) - 성공\n';
        ELSE
            result_text := result_text || '- calculate_actual_duration(TIMESTAMPTZ, TIMESTAMPTZ) - 존재하지 않음\n';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            error_count := error_count + 1;
            result_text := result_text || format('✗ calculate_actual_duration(TIMESTAMPTZ, TIMESTAMPTZ) - 오류: %s\n', SQLERRM);
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'calculate_adjusted_amount') THEN
            ALTER FUNCTION calculate_adjusted_amount(UUID) SET search_path = 'public';
            success_count := success_count + 1;
            result_text := result_text || '✓ calculate_adjusted_amount(UUID) - 성공\n';
        ELSE
            result_text := result_text || '- calculate_adjusted_amount(UUID) - 존재하지 않음\n';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            error_count := error_count + 1;
            result_text := result_text || format('✗ calculate_adjusted_amount(UUID) - 오류: %s\n', SQLERRM);
    END;
    
    -- 결과 요약
    result_text := result_text || format('\n=== 요약 ===\n성공: %s개\n오류: %s개\n', success_count, error_count);
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- 함수 실행
SELECT fix_function_search_path_safe();

-- =============================================================================
-- 3. 추가 보안 강화 조치 (안전 버전)
-- =============================================================================

CREATE OR REPLACE FUNCTION apply_security_definer_safe()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
BEGIN
    -- 관리자 확인 함수들은 SECURITY DEFINER로 설정
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'is_admin') THEN
            ALTER FUNCTION is_admin() SECURITY DEFINER;
            result_text := result_text || '✓ is_admin() SECURITY DEFINER 설정 완료\n';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            result_text := result_text || format('✗ is_admin() SECURITY DEFINER 설정 오류: %s\n', SQLERRM);
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'is_super_admin') THEN
            ALTER FUNCTION is_super_admin() SECURITY DEFINER;
            result_text := result_text || '✓ is_super_admin() SECURITY DEFINER 설정 완료\n';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            result_text := result_text || format('✗ is_super_admin() SECURITY DEFINER 설정 오류: %s\n', SQLERRM);
    END;
    
    -- 시스템 함수들은 SECURITY DEFINER로 설정
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'process_scheduled_completions') THEN
            ALTER FUNCTION process_scheduled_completions() SECURITY DEFINER;
            result_text := result_text || '✓ process_scheduled_completions() SECURITY DEFINER 설정 완료\n';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            result_text := result_text || format('✗ process_scheduled_completions() SECURITY DEFINER 설정 오류: %s\n', SQLERRM);
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'update_reservation_status') THEN
            ALTER FUNCTION update_reservation_status() SECURITY DEFINER;
            result_text := result_text || '✓ update_reservation_status() SECURITY DEFINER 설정 완료\n';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            result_text := result_text || format('✗ update_reservation_status() SECURITY DEFINER 설정 오류: %s\n', SQLERRM);
    END;
    
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                   WHERE n.nspname = 'public' AND p.proname = 'trigger_status_update') THEN
            ALTER FUNCTION trigger_status_update() SECURITY DEFINER;
            result_text := result_text || '✓ trigger_status_update() SECURITY DEFINER 설정 완료\n';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            result_text := result_text || format('✗ trigger_status_update() SECURITY DEFINER 설정 오류: %s\n', SQLERRM);
    END;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- SECURITY DEFINER 적용
SELECT apply_security_definer_safe();

-- =============================================================================
-- 4. 보안 검증 함수들 (기존과 동일)
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
-- 5. 정리 작업
-- =============================================================================

-- 임시 함수들 제거
DROP FUNCTION IF EXISTS fix_function_search_path_safe();
DROP FUNCTION IF EXISTS apply_security_definer_safe();

-- =============================================================================
-- 마이그레이션 완료 기록
-- =============================================================================

-- 마이그레이션 실행 기록
INSERT INTO migration_log (
  migration_name,
  description,
  executed_at
) VALUES (
  '20250905_fix_additional_security_safe',
  '추가 보안 문제 수정 (안전 버전): migration_log RLS 활성화, 함수 search_path 보안 강화',
  NOW()
) ON CONFLICT (migration_name) DO NOTHING;

-- 마이그레이션 설명:
-- 1. migration_log 테이블 RLS 활성화 및 적절한 권한 설정
-- 2. 존재하는 함수들만 안전하게 search_path 보안 취약점 수정
-- 3. 중요한 함수들에 적절한 보안 속성 설정 (SECURITY DEFINER)
-- 4. 보안 상태 확인을 위한 유틸리티 함수 제공
-- 5. 존재하지 않는 함수로 인한 오류 방지

-- 보안 검증 쿼리:
-- SELECT * FROM check_function_security();
-- SELECT * FROM security_audit_summary();