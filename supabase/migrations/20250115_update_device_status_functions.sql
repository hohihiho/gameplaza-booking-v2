-- 체크인 시 기기 상태를 rental로 변경하는 트리거 함수 수정
CREATE OR REPLACE FUNCTION update_device_status_on_checkin()
RETURNS TRIGGER AS $$
BEGIN
  -- 체크인 시 해당 기기를 rental 상태로 변경
  IF NEW.status = 'checked_in' AND OLD.status = 'approved' THEN
    -- assigned_device_number와 device_id를 사용하여 기기 상태 업데이트
    IF NEW.assigned_device_number IS NOT NULL AND NEW.device_id IS NOT NULL THEN
      UPDATE devices 
      SET status = 'in_use'
      WHERE device_number = NEW.assigned_device_number
      AND id IN (
        SELECT id FROM devices WHERE id = NEW.device_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거가 없으면 생성
DROP TRIGGER IF EXISTS update_device_status_on_checkin_trigger ON reservations;
CREATE TRIGGER update_device_status_on_checkin_trigger
AFTER UPDATE OF status ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_device_status_on_checkin();

-- 예약 종료 시간이 지난 기기들을 available로 변경하는 함수
CREATE OR REPLACE FUNCTION check_and_update_expired_rentals()
RETURNS void AS $$
DECLARE
  rec RECORD;
  current_time_kst TIMESTAMP;
BEGIN
  -- 현재 KST 시간 계산
  current_time_kst := NOW() AT TIME ZONE 'Asia/Seoul';
  
  -- 종료 시간이 지난 checked_in 상태의 예약들 찾기
  FOR rec IN 
    SELECT r.id as reservation_id, 
           r.assigned_device_number,
           r.device_id,
           r.date,
           r.end_time
    FROM reservations r
    WHERE r.status = 'checked_in'
    AND (r.date + r.end_time::time)::timestamp < current_time_kst
  LOOP
    -- 예약을 completed로 변경
    UPDATE reservations
    SET status = 'completed',
        actual_end_time = current_time_kst
    WHERE id = rec.reservation_id;
    
    -- 기기를 available로 변경
    IF rec.assigned_device_number IS NOT NULL AND rec.device_id IS NOT NULL THEN
      UPDATE devices 
      SET status = 'available'
      WHERE device_number = rec.assigned_device_number
      AND id = rec.device_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 예약 완료 시 기기 상태를 available로 변경하는 트리거 함수
CREATE OR REPLACE FUNCTION update_device_status_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- 예약이 completed 상태로 변경될 때 기기를 available로 변경
  IF NEW.status = 'completed' AND OLD.status = 'checked_in' THEN
    IF NEW.assigned_device_number IS NOT NULL AND NEW.device_id IS NOT NULL THEN
      UPDATE devices 
      SET status = 'available'
      WHERE device_number = NEW.assigned_device_number
      AND id = NEW.device_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거가 없으면 생성
DROP TRIGGER IF EXISTS update_device_status_on_completion_trigger ON reservations;
CREATE TRIGGER update_device_status_on_completion_trigger
AFTER UPDATE OF status ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_device_status_on_completion();

-- Supabase Edge Function에서 주기적으로 호출할 수 있도록 RPC 함수로 노출
CREATE OR REPLACE FUNCTION public.check_expired_rentals()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT check_and_update_expired_rentals();
$$;