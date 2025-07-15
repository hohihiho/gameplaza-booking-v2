-- 직접 UPDATE 테스트

-- 1. 문제가 되는 예약의 현재 상태 확인
SELECT id, payment_status, payment_method, payment_confirmed_at 
FROM reservations 
WHERE id = 'b106bd02-fd1a-4d5e-9df7-3ba60c6fd436';

-- 2. 간단한 UPDATE 시도
UPDATE reservations 
SET updated_at = now()
WHERE id = 'b106bd02-fd1a-4d5e-9df7-3ba60c6fd436';

-- 3. payment_confirmed_at만 업데이트 시도
UPDATE reservations 
SET payment_confirmed_at = now()
WHERE id = 'b106bd02-fd1a-4d5e-9df7-3ba60c6fd436';

-- 4. 전체 결제 관련 필드 업데이트 시도
UPDATE reservations 
SET 
    payment_status = 'paid',
    payment_method = 'cash',
    payment_confirmed_at = now()
WHERE id = 'b106bd02-fd1a-4d5e-9df7-3ba60c6fd436';