-- payment_status 제약조건 수정
-- 실행: Supabase SQL Editor에서 실행

-- 1. 현재 제약조건 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
AND conname LIKE '%payment_status%';

-- 2. 제약조건 삭제 및 재생성
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded'));

-- 3. 인덱스 추가 (성능 개선)
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);

-- 4. 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
AND column_name = 'payment_status';

-- 5. 제약조건 최종 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
AND conname LIKE '%payment_status%';