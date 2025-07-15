-- 정확한 제약조건 내용 확인

-- 1. payment_status 관련 모든 제약조건 확인
SELECT 
    conname,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'reservations'
AND pg_get_constraintdef(c.oid) LIKE '%payment_status%';

-- 2. 테이블의 모든 CHECK 제약조건 확인
SELECT 
    conname,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
WHERE conrelid = 'public.reservations'::regclass
AND contype = 'c';

-- 3. 시스템 카탈로그에서 직접 확인
SELECT 
    n.nspname as schema,
    t.relname as table,
    c.conname as constraint_name,
    pg_catalog.pg_get_constraintdef(c.oid, true) as constraint_definition
FROM pg_catalog.pg_constraint c
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.connamespace
    LEFT JOIN pg_catalog.pg_class t ON t.oid = c.conrelid
WHERE t.relname = 'reservations'
    AND c.contype = 'c'
ORDER BY 1, 2, 3;