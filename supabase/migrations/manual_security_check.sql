-- 수동 보안 및 성능 점검 쿼리
-- Supabase Advisors 대신 직접 문제를 찾는 SQL
-- 실행일: 2025-09-05

-- =============================================================================
-- 1. RLS 비활성화 테이블 찾기 (ERROR 레벨 문제)
-- =============================================================================

SELECT 
  '🚨 RLS 비활성화 테이블' as issue_type,
  'ERROR' as level,
  t.tablename as table_name,
  'RLS가 비활성화되어 있습니다' as description,
  format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY;', t.tablename) as fix_sql
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.rowsecurity = false
AND t.tablename NOT LIKE 'pg_%'
ORDER BY t.tablename;

-- =============================================================================
-- 2. Security Definer 뷰/함수 찾기 (ERROR 레벨 문제)
-- =============================================================================

-- Security Definer 뷰 확인
SELECT 
  '🚨 Security Definer 뷰' as issue_type,
  'ERROR' as level,
  v.table_name,
  'Security Definer 속성을 가진 뷰입니다' as description,
  format('DROP VIEW %s; CREATE VIEW %s AS ...', v.table_name, v.table_name) as fix_sql
FROM information_schema.views v
WHERE v.table_schema = 'public'
AND EXISTS (
  SELECT 1 FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND c.relname = v.table_name
  AND c.relkind = 'v'
);

-- Security Definer 함수 확인 (위험한 것들만)
SELECT 
  '⚠️ Security Definer 함수' as issue_type,
  'WARN' as level,
  p.proname as function_name,
  'Security Definer 함수입니다' as description,
  CASE 
    WHEN p.proname LIKE '%admin%' OR p.proname LIKE '%auth%' 
    THEN '필요한 보안 함수일 수 있음'
    ELSE '검토 필요'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true
ORDER BY p.proname;

-- =============================================================================
-- 3. 함수 search_path 보안 취약점 찾기 (WARN 레벨 문제)
-- =============================================================================

SELECT 
  '⚠️ 함수 search_path 취약점' as issue_type,
  'WARN' as level,
  p.proname as function_name,
  'search_path가 설정되지 않은 함수입니다' as description,
  format('ALTER FUNCTION %s() SET search_path = ''public'';', p.proname) as fix_sql
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = false  -- SECURITY DEFINER가 아닌 함수
AND p.proname NOT LIKE 'pg_%'
-- 더 호환성 높은 방법으로 search_path 설정 확인
AND (
  p.proconfig IS NULL OR 
  NOT EXISTS (
    SELECT 1 FROM unnest(p.proconfig) as config 
    WHERE config LIKE 'search_path=%'
  )
)
ORDER BY p.proname;

-- =============================================================================
-- 4. Auth RLS 초기화 성능 문제 찾기 (성능 최적화 필요)
-- =============================================================================

SELECT 
  '🐌 Auth RLS 성능 문제' as issue_type,
  'PERFORMANCE' as level,
  p.tablename,
  format('정책에서 auth.uid() 직접 호출: %s', p.policyname) as description,
  'auth.uid()를 (SELECT auth.uid())로 변경 필요' as fix_suggestion
FROM pg_policies p
WHERE p.schemaname = 'public'
AND (
  p.qual LIKE '%auth.uid()%' OR
  p.with_check LIKE '%auth.uid()%'
)
ORDER BY p.tablename, p.policyname;

-- =============================================================================
-- 5. 중복 정책 찾기 (성능 최적화 필요)
-- =============================================================================

SELECT 
  '📊 중복 정책 문제' as issue_type,
  'PERFORMANCE' as level,
  tablename,
  format('%s개의 정책이 있습니다', COUNT(*)) as description,
  CASE 
    WHEN COUNT(*) > 5 THEN '정책 통합 권장'
    WHEN COUNT(*) > 3 THEN '정책 검토 권장'
    ELSE '적정 수준'
  END as recommendation
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 3
ORDER BY COUNT(*) DESC;

-- =============================================================================
-- 6. 중복 인덱스 찾기 (성능 최적화 필요)
-- =============================================================================

WITH duplicate_indexes AS (
  SELECT 
    i1.indexname as index1,
    i2.indexname as index2,
    i1.tablename,
    i1.indexdef as def1,
    i2.indexdef as def2
  FROM pg_indexes i1
  JOIN pg_indexes i2 ON i1.tablename = i2.tablename
  WHERE i1.schemaname = 'public' 
  AND i2.schemaname = 'public'
  AND i1.indexname < i2.indexname  -- 중복 방지
  AND i1.indexdef = i2.indexdef     -- 동일한 정의
)
SELECT 
  '🔄 중복 인덱스' as issue_type,
  'PERFORMANCE' as level,
  tablename,
  format('중복 인덱스: %s, %s', index1, index2) as description,
  format('DROP INDEX %s; -- %s 유지', index2, index1) as fix_sql
FROM duplicate_indexes;

-- =============================================================================
-- 7. 전체 보안 점수 계산
-- =============================================================================

WITH security_stats AS (
  SELECT 
    'RLS 활성화율' as metric,
    ROUND(
      (COUNT(CASE WHEN rowsecurity THEN 1 END)::FLOAT / COUNT(*)) * 100, 
      1
    ) as score
  FROM pg_tables 
  WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  
  UNION ALL
  
  SELECT 
    '정책 평균 수',
    ROUND(AVG(policy_count), 1)
  FROM (
    SELECT COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) t
)
SELECT 
  '📈 보안 점수' as issue_type,
  'INFO' as level,
  metric,
  format('%s점', score) as description,
  CASE 
    WHEN metric = 'RLS 활성화율' AND score = 100 THEN '✅ 완벽'
    WHEN metric = 'RLS 활성화율' AND score >= 80 THEN '🟡 양호'
    WHEN metric = 'RLS 활성화율' THEN '🔴 개선 필요'
    WHEN metric = '정책 평균 수' AND score <= 3 THEN '✅ 최적화됨'
    WHEN metric = '정책 평균 수' AND score <= 5 THEN '🟡 보통'
    ELSE '🔴 너무 많음'
  END as status
FROM security_stats;

-- =============================================================================
-- 🎯 실행 방법
-- =============================================================================
-- 
-- 이 SQL을 Supabase Dashboard → SQL Editor에서 실행하시면
-- Supabase Advisors와 동일한 정보를 확인할 수 있습니다!
--
-- 결과에서 ERROR/WARN 레벨 문제들을 확인하고
-- 제공된 fix_sql을 사용해서 문제를 해결하세요.
--