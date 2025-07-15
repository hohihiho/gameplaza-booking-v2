-- 현재 제약 조건 및 트리거 확인

-- 1. 현재 payment_status 제약조건 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
AND conname LIKE '%payment_status%';

-- 2. reservations 테이블의 모든 제약조건 확인
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
ORDER BY conname;

-- 3. reservations 테이블의 트리거 확인
SELECT 
    tgname AS trigger_name,
    tgtype,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'reservations'::regclass
AND NOT tgisinternal
ORDER BY tgname;

-- 4. payment_status 컬럼 정보 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'reservations'
AND column_name = 'payment_status';

-- 5. 현재 payment_status 값들 확인
SELECT DISTINCT payment_status, COUNT(*) as count
FROM reservations
GROUP BY payment_status
ORDER BY payment_status;