-- 제약조건 간단 확인

-- 1. reservations_payment_status_check 제약조건의 정확한 내용
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'reservations_payment_status_check';

-- 2. 현재 payment_status 값들
SELECT DISTINCT payment_status FROM reservations ORDER BY payment_status;

-- 3. 문제가 되는 row의 payment_status 확인
SELECT id, payment_status 
FROM reservations 
WHERE id = 'b106bd02-fd1a-4d5e-9df7-3ba60c6fd436';

-- 4. 제약조건을 임시로 삭제하고 다시 생성
BEGIN;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded'));
COMMIT;