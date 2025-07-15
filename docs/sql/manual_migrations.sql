-- 수동으로 실행해야 하는 마이그레이션 SQL
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 시간 조정 이력 테이블 생성
CREATE TABLE IF NOT EXISTS time_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  adjusted_by UUID NOT NULL REFERENCES users(id),
  adjustment_type TEXT NOT NULL DEFAULT 'both' CHECK (adjustment_type IN ('start', 'end', 'both')),
  old_start_time TIMESTAMP WITH TIME ZONE,
  new_start_time TIMESTAMP WITH TIME ZONE,
  old_end_time TIMESTAMP WITH TIME ZONE,
  new_end_time TIMESTAMP WITH TIME ZONE,
  reason TEXT NOT NULL,
  old_amount INTEGER,
  new_amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_adjustments_reservation_id ON time_adjustments(reservation_id);
CREATE INDEX idx_time_adjustments_created_at ON time_adjustments(created_at);

-- 2. 금액 조정 이력 테이블 생성
CREATE TABLE IF NOT EXISTS amount_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  adjusted_by UUID NOT NULL REFERENCES users(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('partial_refund', 'full_refund', 'discount', 'penalty')),
  original_amount INTEGER NOT NULL,
  adjusted_amount INTEGER NOT NULL,
  refund_amount INTEGER DEFAULT 0,
  reason TEXT NOT NULL,
  refund_method TEXT CHECK (refund_method IN ('cash', 'transfer', NULL)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_amount_adjustments_reservation_id ON amount_adjustments(reservation_id);
CREATE INDEX idx_amount_adjustments_created_at ON amount_adjustments(created_at);

-- 3. 예약 테이블에 필요한 필드 추가
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS adjusted_amount INTEGER;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 기존 예약들의 adjusted_amount를 total_amount로 초기화
UPDATE reservations 
SET adjusted_amount = total_amount 
WHERE adjusted_amount IS NULL;

-- 4. payment_status에 새로운 상태 추가 (CHECK 제약조건 업데이트)
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'confirmed', 'partial_refund', 'refunded'));

-- 5. 테이블 및 컬럼 설명 추가
COMMENT ON TABLE time_adjustments IS '예약 시간 조정 이력을 저장하는 테이블';
COMMENT ON TABLE amount_adjustments IS '예약 금액 조정 이력을 저장하는 테이블';
COMMENT ON COLUMN reservations.adjusted_amount IS '조정된 최종 금액 (시간 조정이나 금액 조정 후의 금액)';
COMMENT ON COLUMN reservations.payment_status IS '결제 상태: pending(대기중), confirmed(확인됨), partial_refund(부분환불), refunded(전체환불)';
COMMENT ON COLUMN reservations.cancelled_at IS '취소 처리 시각';
COMMENT ON COLUMN reservations.cancelled_by IS '취소 처리한 관리자';
COMMENT ON COLUMN reservations.cancellation_reason IS '취소 사유';