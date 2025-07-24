-- 예약 테이블에 누락된 필드 추가
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS reservation_number VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES devices(id),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS credit_type VARCHAR(20) DEFAULT 'freeplay',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- 기존 데이터 마이그레이션 (rental_time_slot_id에서 날짜와 시간 추출)
UPDATE reservations r
SET 
  date = COALESCE(r.date, rts.date),
  start_time = COALESCE(r.start_time, rts.start_time::time),
  end_time = COALESCE(r.end_time, rts.end_time::time),
  device_id = COALESCE(
    r.device_id,
    (SELECT id FROM devices WHERE device_type_id = r.device_type_id AND device_number = COALESCE(r.assigned_device_number, r.device_number) LIMIT 1)
  ),
  total_amount = COALESCE(r.total_amount, r.total_price),
  user_notes = COALESCE(r.user_notes, r.notes),
  credit_type = COALESCE(r.credit_type, r.credit_option, 'freeplay')
FROM rental_time_slots rts
WHERE r.rental_time_slot_id = rts.id
  AND (r.date IS NULL OR r.start_time IS NULL OR r.end_time IS NULL);

-- 예약 번호 생성 (기존 예약에 대해)
DO $$
DECLARE
  rec RECORD;
  seq_num INTEGER;
  date_str VARCHAR(6);
BEGIN
  FOR rec IN 
    SELECT id, date, created_at 
    FROM reservations 
    WHERE reservation_number IS NULL 
    ORDER BY date, created_at
  LOOP
    -- 날짜별 시퀀스 번호 계산
    SELECT COUNT(*) + 1 INTO seq_num
    FROM reservations
    WHERE date = rec.date
      AND reservation_number IS NOT NULL;
    
    -- YYMMDD 형식으로 날짜 문자열 생성
    date_str := TO_CHAR(rec.date, 'YYMMDD');
    
    -- 예약 번호 업데이트
    UPDATE reservations
    SET reservation_number = date_str || '-' || LPAD(seq_num::text, 3, '0')
    WHERE id = rec.id;
  END LOOP;
END $$;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_device_date ON reservations(device_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status ON reservations(user_id, status);

-- RLS 정책 확인 및 추가
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 예약만 조회 가능
CREATE POLICY IF NOT EXISTS "Users can view own reservations" ON reservations
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 예약만 생성 가능
CREATE POLICY IF NOT EXISTS "Users can create own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 예약만 수정 가능 (pending 상태인 경우만)
CREATE POLICY IF NOT EXISTS "Users can update own pending reservations" ON reservations
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- 관리자는 모든 예약 접근 가능
CREATE POLICY IF NOT EXISTS "Admins can do everything" ON reservations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );