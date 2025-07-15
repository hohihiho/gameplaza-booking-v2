-- payment_status 제약조건 수정 (데이터 정리 포함)
-- 실행: Supabase SQL Editor에서 순서대로 실행

-- 1. 현재 payment_status 값들 확인
SELECT DISTINCT payment_status, COUNT(*) as count
FROM reservations
GROUP BY payment_status
ORDER BY payment_status;

-- 2. 기존 데이터 마이그레이션
-- 'completed' -> 'paid'로 변경
UPDATE reservations 
SET payment_status = 'paid' 
WHERE payment_status = 'completed';

-- 'confirmed' -> 'paid'로 변경
UPDATE reservations 
SET payment_status = 'paid' 
WHERE payment_status = 'confirmed';

-- 3. 다시 확인
SELECT DISTINCT payment_status, COUNT(*) as count
FROM reservations
GROUP BY payment_status
ORDER BY payment_status;

-- 4. 제약조건 삭제 및 재생성
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded'));

-- 5. 인덱스 추가 (성능 개선)
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);

-- 6. 최종 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
AND conname LIKE '%payment_status%';