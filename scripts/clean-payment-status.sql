-- payment_status 데이터 정리

-- 트랜잭션 시작
BEGIN;

-- 1. 'completed' -> 'paid'로 변경
UPDATE reservations 
SET payment_status = 'paid' 
WHERE payment_status = 'completed';

-- 2. 'confirmed' -> 'paid'로 변경  
UPDATE reservations 
SET payment_status = 'paid' 
WHERE payment_status = 'confirmed';

-- 3. NULL 값은 'pending'으로 설정
UPDATE reservations 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- 4. 변경 후 확인
SELECT payment_status, COUNT(*) as count
FROM reservations
GROUP BY payment_status
ORDER BY payment_status;

-- 5. 모든 값이 정상인지 확인
SELECT COUNT(*) as invalid_count
FROM reservations
WHERE payment_status NOT IN ('pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded');

-- 문제가 없으면 COMMIT, 있으면 ROLLBACK
-- COMMIT;
-- ROLLBACK;