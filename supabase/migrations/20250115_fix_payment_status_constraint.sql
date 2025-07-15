-- 긴급: payment_status 제약조건 수정
-- 비전공자 설명: 노쇼 처리 시 발생하는 오류를 해결합니다
-- 실행일: 2025-01-15

-- 현재 제약조건 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
AND conname LIKE '%payment_status%';

-- payment_status 제약조건 업데이트
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded'));

-- 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
AND column_name = 'payment_status';

-- 제약조건 재확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
AND conname LIKE '%payment_status%';