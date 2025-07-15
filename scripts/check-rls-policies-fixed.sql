-- RLS 정책 확인 (수정된 버전)

-- 1. reservations 테이블의 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
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

-- 3. 현재 사용자 확인
SELECT current_user, session_user;

-- 4. 권한 확인
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'reservations'
ORDER BY grantee, privilege_type;