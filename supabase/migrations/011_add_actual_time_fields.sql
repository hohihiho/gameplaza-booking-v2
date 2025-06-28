-- 실제 이용시간 관리를 위한 필드 추가
-- 비전공자 설명: 예약된 시간과 별개로 실제 이용한 시간을 기록하기 위한 필드들을 추가합니다

-- 1. reservations 테이블에 실제 시작/종료 시간 필드 추가
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS time_adjustment_reason TEXT,
ADD COLUMN IF NOT EXISTS adjusted_amount INTEGER;

-- 2. 체크인 시 actual_start_time을 현재 시간으로 설정하는 트리거 함수
CREATE OR REPLACE FUNCTION set_actual_start_time()
RETURNS TRIGGER AS $$
BEGIN
  -- 체크인 상태로 변경될 때 actual_start_time이 없으면 현재 시간으로 설정
  IF NEW.status = 'checked_in' AND OLD.status = 'approved' AND NEW.actual_start_time IS NULL THEN
    NEW.actual_start_time = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 생성
DROP TRIGGER IF EXISTS set_actual_start_time_trigger ON reservations;
CREATE TRIGGER set_actual_start_time_trigger
BEFORE UPDATE OF status ON reservations
FOR EACH ROW
EXECUTE FUNCTION set_actual_start_time();

-- 4. 시간 조정 이력 테이블 생성
CREATE TABLE IF NOT EXISTS time_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  adjusted_by UUID REFERENCES users(id),
  adjustment_type VARCHAR(20) CHECK (adjustment_type IN ('start', 'end', 'both')),
  old_start_time TIMESTAMPTZ,
  new_start_time TIMESTAMPTZ,
  old_end_time TIMESTAMPTZ,
  new_end_time TIMESTAMPTZ,
  reason TEXT NOT NULL,
  old_amount INTEGER,
  new_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS 정책 설정
ALTER TABLE time_adjustments ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "time_adjustments_select_admin" ON time_adjustments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.email IN ('admin@gameplaza.kr', 'ndz5496@gmail.com')
  )
);

-- 관리자만 추가 가능
CREATE POLICY "time_adjustments_insert_admin" ON time_adjustments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.email IN ('admin@gameplaza.kr', 'ndz5496@gmail.com')
  )
);

-- 6. 실제 종료 시간 기준으로 기기 상태를 업데이트하는 함수 수정
CREATE OR REPLACE FUNCTION update_device_status_on_rental_end()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  -- actual_end_time 또는 예약 종료 시간이 지난 rental 상태의 기기들을 찾아서 available로 변경
  FOR rec IN 
    SELECT DISTINCT d.id, d.device_number, dt.id as device_type_id, r.id as reservation_id
    FROM devices d
    JOIN reservations r ON r.assigned_device_number = d.device_number
    JOIN rental_time_slots rts ON rts.id = r.rental_time_slot_id AND rts.device_type_id = d.device_type_id
    WHERE d.status = 'rental'
    AND r.status = 'checked_in'
    AND (
      -- actual_end_time이 있으면 그 시간 기준, 없으면 예약 종료 시간 기준
      (r.actual_end_time IS NOT NULL AND r.actual_end_time < NOW()) OR
      (r.actual_end_time IS NULL AND CONCAT(rts.date, ' ', rts.end_time)::timestamp < NOW())
    )
  LOOP
    -- 기기 상태를 available로 변경
    UPDATE devices 
    SET status = 'available'
    WHERE id = rec.id;
    
    -- 해당 예약을 completed 상태로 변경
    UPDATE reservations
    SET status = 'completed',
        actual_end_time = CASE 
          WHEN actual_end_time IS NULL THEN NOW() 
          ELSE actual_end_time 
        END
    WHERE id = rec.reservation_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. 실제 이용시간 계산 함수
CREATE OR REPLACE FUNCTION calculate_actual_duration(
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
) RETURNS INTERVAL AS $$
BEGIN
  IF start_time IS NULL OR end_time IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN end_time - start_time;
END;
$$ LANGUAGE plpgsql;

-- 8. 조정된 금액 계산 함수
CREATE OR REPLACE FUNCTION calculate_adjusted_amount(
  reservation_id UUID
) RETURNS INTEGER AS $$
DECLARE
  res RECORD;
  actual_hours DECIMAL;
  hourly_rate INTEGER;
BEGIN
  -- 예약 정보와 시간당 요금 가져오기
  SELECT 
    r.*,
    rts.price as base_price,
    EXTRACT(EPOCH FROM (r.actual_end_time - r.actual_start_time)) / 3600 as hours_used
  INTO res
  FROM reservations r
  JOIN rental_time_slots rts ON rts.id = r.rental_time_slot_id
  WHERE r.id = reservation_id;
  
  IF res IS NULL OR res.actual_start_time IS NULL OR res.actual_end_time IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 시간 올림 처리 (분 단위는 올림)
  actual_hours := CEIL(res.hours_used);
  
  -- 시간당 요금 계산
  hourly_rate := res.base_price / EXTRACT(EPOCH FROM (
    SELECT end_time::time - start_time::time 
    FROM rental_time_slots 
    WHERE id = res.rental_time_slot_id
  )) * 3600;
  
  -- 조정된 금액 반환
  RETURN hourly_rate * actual_hours;
END;
$$ LANGUAGE plpgsql;

-- 9. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reservations_actual_times ON reservations(actual_start_time, actual_end_time);
CREATE INDEX IF NOT EXISTS idx_time_adjustments_reservation ON time_adjustments(reservation_id);