-- 모든 제약조건과 트리거 상세 확인

-- 1. reservations 테이블의 모든 CHECK 제약조건 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
AND contype = 'c'  -- CHECK constraints
ORDER BY conname;

-- 2. 특정 예약의 모든 값 확인 (문제가 되는 예약)
SELECT * FROM reservations 
WHERE id = 'b106bd02-fd1a-4d5e-9df7-3ba60c6fd436'\G

-- 3. reservations 테이블의 컬럼 정보
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;

-- 4. 트리거 함수 내용 확인
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'reservations'::regclass
AND NOT t.tgisinternal;