-- 체크인된 예약의 시작 시간이 되면 기기 상태를 in_use로 변경하는 함수
CREATE OR REPLACE FUNCTION update_device_status_on_rental_start()
RETURNS void AS $$
DECLARE
  rec RECORD;
  current_time_kst TIMESTAMP;
  current_hour INTEGER;
  current_minute INTEGER;
  reservation_start_time TIME;
BEGIN
  -- 현재 KST 시간 계산
  current_time_kst := NOW() AT TIME ZONE 'Asia/Seoul';
  current_hour := EXTRACT(HOUR FROM current_time_kst);
  current_minute := EXTRACT(MINUTE FROM current_time_kst);
  
  -- checked_in 상태이면서 시작 시간이 된 예약들 찾기
  FOR rec IN 
    SELECT r.id as reservation_id, 
           r.assigned_device_number,
           r.device_id,
           r.date,
           r.start_time,
           d.status as device_status
    FROM reservations r
    JOIN devices d ON d.id = r.device_id
    WHERE r.status = 'checked_in'
    AND r.date = CURRENT_DATE
    AND d.status = 'reserved'
  LOOP
    reservation_start_time := rec.start_time::time;
    
    -- 현재 시간이 예약 시작 시간 이후인지 확인
    IF (current_hour > EXTRACT(HOUR FROM reservation_start_time)) OR 
       (current_hour = EXTRACT(HOUR FROM reservation_start_time) AND current_minute >= EXTRACT(MINUTE FROM reservation_start_time)) THEN
      
      -- 기기를 in_use로 변경
      UPDATE devices 
      SET status = 'in_use'
      WHERE id = rec.device_id;
      
      -- 예약의 actual_start_time 업데이트
      UPDATE reservations
      SET actual_start_time = current_time_kst
      WHERE id = rec.reservation_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RPC 함수로 노출 (크론잡에서 호출)
CREATE OR REPLACE FUNCTION public.check_rental_start_times()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT update_device_status_on_rental_start();
$$;

-- 예약 종료 시간 변경 시 영업일정 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION handle_reservation_time_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 종료 시간이 변경되었고, 예약이 활성 상태인 경우
  IF (NEW.end_time IS DISTINCT FROM OLD.end_time) AND 
     NEW.status IN ('approved', 'checked_in') THEN
    
    -- 변경 사항을 로그로 남기기 (나중에 영업일정 확인용)
    INSERT INTO reservation_time_changes (
      reservation_id,
      old_end_time,
      new_end_time,
      changed_at,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.end_time,
      NEW.end_time,
      NOW() AT TIME ZONE 'Asia/Seoul',
      NEW.updated_by
    );
    
    -- 예약이 체크인 상태이고 새로운 종료 시간이 현재 시간보다 이전이면
    -- 즉시 예약을 완료 처리
    IF NEW.status = 'checked_in' THEN
      DECLARE
        current_time_kst TIMESTAMP;
        new_end_timestamp TIMESTAMP;
      BEGIN
        current_time_kst := NOW() AT TIME ZONE 'Asia/Seoul';
        new_end_timestamp := (NEW.date + NEW.end_time::time)::timestamp;
        
        IF new_end_timestamp < current_time_kst THEN
          -- 예약을 즉시 완료 처리
          UPDATE reservations
          SET status = 'completed',
              actual_end_time = NEW.end_time::time
          WHERE id = NEW.id;
          
          -- 기기를 available로 변경
          IF NEW.assigned_device_number IS NOT NULL AND NEW.device_id IS NOT NULL THEN
            UPDATE devices 
            SET status = 'available'
            WHERE id = NEW.device_id;
          END IF;
        END IF;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 예약 시간 변경 로그 테이블 생성
CREATE TABLE IF NOT EXISTS reservation_time_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  old_end_time TIME,
  new_end_time TIME NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 트리거 생성
DROP TRIGGER IF EXISTS handle_reservation_time_change_trigger ON reservations;
CREATE TRIGGER handle_reservation_time_change_trigger
AFTER UPDATE OF end_time ON reservations
FOR EACH ROW
EXECUTE FUNCTION handle_reservation_time_change();

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reservation_time_changes_reservation_id ON reservation_time_changes(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_time_changes_changed_at ON reservation_time_changes(changed_at);

-- 기존 update_device_status_on_checkin 함수 수정
-- 체크인 시 기기를 reserved 상태로만 변경
CREATE OR REPLACE FUNCTION update_device_status_on_checkin()
RETURNS TRIGGER AS $$
BEGIN
  -- 체크인 시 해당 기기를 reserved 상태로 변경 (실제 사용은 예약 시간이 되어야 함)
  IF NEW.status = 'checked_in' AND OLD.status = 'approved' THEN
    IF NEW.assigned_device_number IS NOT NULL AND NEW.device_id IS NOT NULL THEN
      UPDATE devices 
      SET status = 'reserved'
      WHERE device_number = NEW.assigned_device_number
      AND id = NEW.device_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;