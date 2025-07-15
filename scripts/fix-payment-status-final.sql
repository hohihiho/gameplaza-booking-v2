-- payment_status 최종 수정 스크립트
-- Supabase SQL Editor에서 전체를 한 번에 실행하세요

-- 1단계: 현재 상태 확인
SELECT '=== 현재 payment_status 값들 ===' as step;
SELECT payment_status, COUNT(*) as count
FROM reservations
GROUP BY payment_status
ORDER BY payment_status;

-- 2단계: 제약조건 임시 삭제
SELECT '=== 제약조건 삭제 ===' as step;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;

-- 3단계: 데이터 정리
SELECT '=== 데이터 정리 시작 ===' as step;

-- 'completed' -> 'paid'로 변경
UPDATE reservations 
SET payment_status = 'paid' 
WHERE payment_status = 'completed';

-- 'confirmed' -> 'paid'로 변경  
UPDATE reservations 
SET payment_status = 'paid' 
WHERE payment_status = 'confirmed';

-- NULL 값은 'pending'으로 설정
UPDATE reservations 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- 4단계: 정리 후 확인
SELECT '=== 정리 후 payment_status 값들 ===' as step;
SELECT payment_status, COUNT(*) as count
FROM reservations
GROUP BY payment_status
ORDER BY payment_status;

-- 5단계: 제약조건 재생성
SELECT '=== 제약조건 재생성 ===' as step;
ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded'));

-- 6단계: 최종 확인
SELECT '=== 완료! 제약조건 확인 ===' as step;
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
AND conname = 'reservations_payment_status_check';