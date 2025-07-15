-- 잘못된 payment_status 값 찾기

-- 1. 모든 payment_status 값과 개수 확인
SELECT payment_status, COUNT(*) as count
FROM reservations
GROUP BY payment_status
ORDER BY payment_status;

-- 2. 허용되지 않는 값 찾기
SELECT id, reservation_number, payment_status, status, created_at
FROM reservations
WHERE payment_status NOT IN ('pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded')
OR payment_status IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 3. 'completed' 값이 있는지 확인
SELECT COUNT(*) as completed_count
FROM reservations
WHERE payment_status = 'completed';

-- 4. 'confirmed' 값이 있는지 확인  
SELECT COUNT(*) as confirmed_count
FROM reservations
WHERE payment_status = 'confirmed';

-- 5. NULL 값이 있는지 확인
SELECT COUNT(*) as null_count
FROM reservations
WHERE payment_status IS NULL;