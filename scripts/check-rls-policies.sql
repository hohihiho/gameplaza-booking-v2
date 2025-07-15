-- RLS 정책 확인

-- 1. reservations 테이블의 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables
WHERE tablename = 'reservations';

-- 2. reservations 테이블의 모든 정책 확인
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'reservations'
ORDER BY policyname;