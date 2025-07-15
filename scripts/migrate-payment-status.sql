-- payment_status 값 마이그레이션

-- 1. 'completed' -> 'paid'로 변경
UPDATE reservations 
SET payment_status = 'paid' 
WHERE payment_status = 'completed';

-- 2. 변경 후 확인
SELECT DISTINCT payment_status, COUNT(*) as count
FROM reservations
GROUP BY payment_status
ORDER BY payment_status;

-- 3. 이제 제약조건 업데이트 (이미 있다면 삭제 후 재생성)
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded'));