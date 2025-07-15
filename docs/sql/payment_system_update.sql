-- 결제 시스템 업데이트 SQL
-- 실행 일자: 2025-01-15
-- 변경 사항: payment_status 값 업데이트 및 필드 추가

-- 1. payment_status CHECK 제약조건 업데이트
-- 기존: 'pending', 'completed', 'failed', 'refunded'
-- 변경: 'pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded'
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded'));

-- 2. 기존 데이터 마이그레이션
-- 'completed' -> 'paid'로 변경
UPDATE reservations 
SET payment_status = 'paid' 
WHERE payment_status = 'completed';

-- 3. 체크인 시간 필드 추가 (없는 경우)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS check_in_by UUID REFERENCES users(id);

-- 4. payment_method가 NULL인 기존 예약들 처리
-- 체크인된 예약 중 payment_method가 없는 경우 'cash'로 설정
UPDATE reservations 
SET payment_method = 'cash' 
WHERE status IN ('checked_in', 'completed') 
AND payment_method IS NULL;

-- 5. 인덱스 추가 (성능 개선)
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_method ON reservations(payment_method);
CREATE INDEX IF NOT EXISTS idx_reservations_check_in_at ON reservations(check_in_at);

-- 6. 테이블 코멘트 업데이트
COMMENT ON COLUMN reservations.payment_status IS '결제 상태: pending(대기), paid(완료), failed(실패), cancelled(취소), partial_refund(부분환불), refunded(전체환불)';
COMMENT ON COLUMN reservations.payment_method IS '결제 방법: cash(현금), transfer(계좌이체)';
COMMENT ON COLUMN reservations.check_in_at IS '체크인 처리 시각';
COMMENT ON COLUMN reservations.check_in_by IS '체크인 처리한 관리자';

-- 7. 결제 확인 필드 확인
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES users(id);

COMMENT ON COLUMN reservations.payment_confirmed_at IS '결제 확인 시각';
COMMENT ON COLUMN reservations.payment_confirmed_by IS '결제 확인한 관리자';