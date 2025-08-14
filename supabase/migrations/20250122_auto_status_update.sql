-- 예약 상태 자동 업데이트를 위한 PostgreSQL 트리거
-- 크론잡 없이 데이터베이스 레벨에서 자동으로 상태를 업데이트합니다.

-- 1. 예약 상태 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_reservation_status()
RETURNS void AS $$
DECLARE
  current_kst TIMESTAMP;
  completed_device_ids UUID[];
BEGIN
  -- 현재 KST 시간 계산 (UTC + 9시간)
  current_kst := NOW() AT TIME ZONE 'Asia/Seoul';
  
  -- 체크인된 예약 중 시작 시간이 된 예약을 in_use(대여중)로 변경
  UPDATE reservations
  SET 
    status = 'in_use',
    actual_start_time = (current_kst::time)::text,
    updated_at = NOW()
  WHERE 
    status = 'checked_in'
    AND date = current_kst::date
    AND (date::date + start_time::time) <= current_kst;
  
  -- 종료 시간이 지난 대여중 예약을 완료 상태로 변경하고 기기 ID 수집
  WITH completed AS (
    UPDATE reservations
    SET 
      status = 'completed',
      actual_end_time = (current_kst::time)::text,
      updated_at = NOW()
    WHERE 
      status = 'in_use'
      AND (date::date + end_time::time) < current_kst
    RETURNING device_id
  )
  SELECT array_agg(device_id) INTO completed_device_ids FROM completed;
  
  -- 완료된 예약의 기기 상태를 사용 가능으로 변경
  IF completed_device_ids IS NOT NULL AND array_length(completed_device_ids, 1) > 0 THEN
    UPDATE devices
    SET 
      status = 'available',
      updated_at = NOW()
    WHERE id = ANY(completed_device_ids);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. 예약 조회 시 자동으로 상태를 업데이트하는 뷰
CREATE OR REPLACE VIEW reservations_with_auto_status AS
SELECT 
  r.*,
  CASE 
    -- 체크인된 예약 중 시작 시간이 된 경우 in_use 표시
    WHEN r.status = 'checked_in' 
      AND r.date = (NOW() AT TIME ZONE 'Asia/Seoul')::date
      AND (r.date::date + r.start_time::time) <= (NOW() AT TIME ZONE 'Asia/Seoul')
      THEN 'in_use'::text
    -- 종료 시간이 지난 대여중 예약은 completed 표시
    WHEN r.status = 'in_use' 
      AND (r.date::date + r.end_time::time) < (NOW() AT TIME ZONE 'Asia/Seoul')
      THEN 'completed'::text
    ELSE r.status
  END AS display_status
FROM reservations r;

-- 3. 예약 테이블에 트리거 생성 (INSERT, UPDATE 시 상태 자동 체크)
CREATE OR REPLACE FUNCTION check_and_update_reservation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 예약 조회나 수정 시 전체 상태 업데이트 실행
  PERFORM update_reservation_status();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록
DROP TRIGGER IF EXISTS auto_update_reservation_status ON reservations;
CREATE TRIGGER auto_update_reservation_status
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH STATEMENT
  EXECUTE FUNCTION check_and_update_reservation_status();

-- 4. 주기적 업데이트를 위한 스케줄러 테이블 (선택적)
-- 이 테이블에 주기적으로 INSERT하면 트리거가 발동됩니다
CREATE TABLE IF NOT EXISTS status_update_scheduler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- 5. Edge Function을 통한 주기적 실행 (선택적)
-- Supabase Edge Function에서 5분마다 이 함수를 호출하도록 설정할 수 있습니다
CREATE OR REPLACE FUNCTION trigger_status_update()
RETURNS void AS $$
BEGIN
  -- 스케줄러 테이블에 레코드 삽입하여 트리거 발동
  INSERT INTO status_update_scheduler (executed_at) VALUES (NOW());
  
  -- 오래된 스케줄러 레코드 정리 (7일 이상)
  DELETE FROM status_update_scheduler 
  WHERE executed_at < (NOW() - INTERVAL '7 days');
  
  -- 상태 업데이트 함수 직접 실행
  PERFORM update_reservation_status();
END;
$$ LANGUAGE plpgsql;

-- 6. RLS 정책 설정 (필요한 경우)
ALTER TABLE status_update_scheduler ENABLE ROW LEVEL SECURITY;

-- 관리자만 스케줄러 테이블에 접근 가능
CREATE POLICY "Admins can manage scheduler" ON status_update_scheduler
  FOR ALL
  USING (auth.jwt()->>'role' = 'admin');

-- 7. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reservations_status_date 
  ON reservations(status, date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at 
  ON reservations(created_at) 
  WHERE status = 'pending';

COMMENT ON FUNCTION update_reservation_status() IS '예약 상태를 자동으로 업데이트하는 함수';
COMMENT ON VIEW reservations_with_auto_status IS '조회 시 자동으로 상태가 업데이트되는 예약 뷰';
COMMENT ON TRIGGER auto_update_reservation_status ON reservations IS '예약 테이블 변경 시 상태 자동 업데이트 트리거';