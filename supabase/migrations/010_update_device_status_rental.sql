-- 기기 상태 enum 타입 수정: in_use를 rental로 변경
-- 비전공자 설명: 기기가 대여 중인 상태를 더 명확하게 표현하기 위해 상태명을 변경합니다

-- 1. 먼저 in_use 상태를 가진 기기들을 일시적으로 available로 변경
UPDATE devices 
SET status = 'available' 
WHERE status = 'in_use';

-- 2. 새로운 enum 타입 생성 (rental 포함)
CREATE TYPE device_status_temp AS ENUM ('available', 'rental', 'maintenance', 'unavailable');

-- 3. 기존 컬럼의 타입을 새 타입으로 변경
ALTER TABLE devices 
  ALTER COLUMN status TYPE device_status_temp 
  USING status::text::device_status_temp;

-- 4. 기존 타입 삭제
DROP TYPE device_status;

-- 5. 새 타입을 기존 이름으로 변경
ALTER TYPE device_status_temp RENAME TO device_status;

-- 6. 체크인 시 기기 상태 변경을 위한 함수 생성
CREATE OR REPLACE FUNCTION update_device_status_on_checkin()
RETURNS TRIGGER AS $$
BEGIN
  -- 체크인 시 해당 기기를 rental 상태로 변경
  IF NEW.status = 'checked_in' AND OLD.status = 'approved' THEN
    UPDATE devices 
    SET status = 'in_use'
    WHERE device_number = NEW.assigned_device_number
    AND device_type_id = (
      SELECT device_type_id 
      FROM rental_time_slots 
      WHERE id = NEW.rental_time_slot_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 트리거 생성
DROP TRIGGER IF EXISTS update_device_status_on_checkin_trigger ON reservations;
CREATE TRIGGER update_device_status_on_checkin_trigger
AFTER UPDATE OF status ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_device_status_on_checkin();

-- 8. 예약 종료 시간에 기기 상태를 다시 available로 변경하는 함수
-- 이 함수는 예약 종료 시간이 되면 크론잡이나 별도의 스케줄러에서 호출해야 합니다
CREATE OR REPLACE FUNCTION update_device_status_on_rental_end()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  -- 현재 시간보다 예약 종료 시간이 지난 rental 상태의 기기들을 찾아서 available로 변경
  FOR rec IN 
    SELECT DISTINCT d.id, d.device_number, dt.id as device_type_id
    FROM devices d
    JOIN reservations r ON r.assigned_device_number = d.device_number
    JOIN rental_time_slots rts ON rts.id = r.rental_time_slot_id AND rts.device_type_id = d.device_type_id
    WHERE d.status = 'rental'
    AND r.status = 'checked_in'
    AND CONCAT(rts.date, ' ', rts.end_time)::timestamp < NOW()
  LOOP
    UPDATE devices 
    SET status = 'available'
    WHERE id = rec.id;
    
    -- 해당 예약도 completed 상태로 변경
    UPDATE reservations
    SET status = 'completed'
    WHERE assigned_device_number = rec.device_number
    AND status = 'checked_in'
    AND rental_time_slot_id IN (
      SELECT id FROM rental_time_slots 
      WHERE device_type_id = rec.device_type_id
      AND CONCAT(date, ' ', end_time)::timestamp < NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. 예약 완료 시 기기 상태를 available로 변경하는 트리거
CREATE OR REPLACE FUNCTION update_device_status_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- 예약이 completed 상태로 변경될 때 기기를 available로 변경
  IF NEW.status = 'completed' AND OLD.status = 'checked_in' THEN
    UPDATE devices 
    SET status = 'available'
    WHERE device_number = NEW.assigned_device_number
    AND device_type_id = (
      SELECT device_type_id 
      FROM rental_time_slots 
      WHERE id = NEW.rental_time_slot_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. 트리거 생성
DROP TRIGGER IF EXISTS update_device_status_on_completion_trigger ON reservations;
CREATE TRIGGER update_device_status_on_completion_trigger
AFTER UPDATE OF status ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_device_status_on_completion();