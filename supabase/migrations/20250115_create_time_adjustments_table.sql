-- 시간 조정 이력 테이블 생성
-- 비전공자 설명: 관리자가 실제 이용 시간을 조정한 내역을 저장하는 테이블입니다

-- 시간 조정 이력 테이블
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

-- 인덱스 추가
CREATE INDEX idx_time_adjustments_reservation_id ON time_adjustments(reservation_id);
CREATE INDEX idx_time_adjustments_created_at ON time_adjustments(created_at);

-- 테이블 설명 추가
COMMENT ON TABLE time_adjustments IS '예약 시간 조정 이력을 저장하는 테이블';
COMMENT ON COLUMN time_adjustments.adjustment_type IS '조정 유형: start(시작시간만), end(종료시간만), both(둘다)';
COMMENT ON COLUMN time_adjustments.old_start_time IS '조정 전 시작 시간';
COMMENT ON COLUMN time_adjustments.new_start_time IS '조정 후 시작 시간';
COMMENT ON COLUMN time_adjustments.old_end_time IS '조정 전 종료 시간';
COMMENT ON COLUMN time_adjustments.new_end_time IS '조정 후 종료 시간';
COMMENT ON COLUMN time_adjustments.old_amount IS '조정 전 금액';
COMMENT ON COLUMN time_adjustments.new_amount IS '조정 후 금액';