-- 금액 조정 이력 테이블 생성
-- 비전공자 설명: 관리자가 예약 금액을 조정하거나 환불한 내역을 저장하는 테이블입니다

-- 금액 조정 이력 테이블
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

-- 인덱스 추가
CREATE INDEX idx_amount_adjustments_reservation_id ON amount_adjustments(reservation_id);
CREATE INDEX idx_amount_adjustments_created_at ON amount_adjustments(created_at);

-- 테이블 설명 추가
COMMENT ON TABLE amount_adjustments IS '예약 금액 조정 이력을 저장하는 테이블';
COMMENT ON COLUMN amount_adjustments.adjustment_type IS '조정 유형: partial_refund(일부환불), full_refund(전체환불), discount(할인), penalty(패널티)';
COMMENT ON COLUMN amount_adjustments.original_amount IS '원래 예약 금액';
COMMENT ON COLUMN amount_adjustments.adjusted_amount IS '조정 후 금액';
COMMENT ON COLUMN amount_adjustments.refund_amount IS '환불 금액 (환불이 아닌 경우 0)';
COMMENT ON COLUMN amount_adjustments.refund_method IS '환불 방법: cash(현금), transfer(계좌이체)';