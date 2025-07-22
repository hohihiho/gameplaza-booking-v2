-- 예약 충돌 방지를 위한 원자적 트랜잭션 함수들
-- 실행 날짜: 2025-07-22
-- 목적: 동시 예약 방지 및 데이터 일관성 보장

-- ============================================
-- 1. 슬롯 잠금 함수 (FOR UPDATE)
-- ============================================
CREATE OR REPLACE FUNCTION lock_rental_slot_for_update(p_slot_id UUID)
RETURNS TABLE(
  id UUID,
  device_id UUID,
  date DATE,
  start_time TIME,
  end_time TIME,
  is_reserved BOOLEAN,
  reservation_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.id,
    rs.device_id,
    rs.date,
    rs.start_time,
    rs.end_time,
    rs.is_reserved,
    rs.reservation_id
  FROM rental_slots rs
  WHERE rs.id = p_slot_id
  FOR UPDATE; -- 행 수준 잠금
END;
$$;

-- ============================================
-- 2. 원자적 예약 생성 함수
-- ============================================
CREATE OR REPLACE FUNCTION create_reservation_atomic(
  p_user_id UUID,
  p_slot_id UUID,
  p_device_id UUID
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  device_id UUID,
  rental_slot_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  version INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id UUID;
  v_slot_available BOOLEAN;
BEGIN
  -- 트랜잭션 격리 수준 설정
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  
  -- 1. 슬롯 잠금 및 가용성 확인
  SELECT NOT is_reserved INTO v_slot_available
  FROM rental_slots
  WHERE id = p_slot_id
  FOR UPDATE;
  
  -- 슬롯을 찾을 수 없는 경우
  IF v_slot_available IS NULL THEN
    RAISE EXCEPTION 'Slot not found: %', p_slot_id;
  END IF;
  
  -- 이미 예약된 경우
  IF NOT v_slot_available THEN
    RAISE EXCEPTION 'Slot already reserved: %', p_slot_id;
  END IF;
  
  -- 2. 예약 생성
  INSERT INTO reservations (
    user_id,
    device_id,
    rental_slot_id,
    status,
    created_at,
    version
  ) VALUES (
    p_user_id,
    p_device_id,
    p_slot_id,
    'confirmed',
    NOW(),
    1
  ) RETURNING reservations.id INTO v_reservation_id;
  
  -- 3. 슬롯 상태 업데이트
  UPDATE rental_slots
  SET 
    is_reserved = TRUE,
    reservation_id = v_reservation_id,
    updated_at = NOW()
  WHERE id = p_slot_id;
  
  -- 4. 결과 반환
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.device_id,
    r.rental_slot_id,
    r.status,
    r.created_at,
    r.version
  FROM reservations r
  WHERE r.id = v_reservation_id;
END;
$$;

-- ============================================
-- 3. 예약 취소 원자적 처리
-- ============================================
CREATE OR REPLACE FUNCTION cancel_reservation_atomic(
  p_reservation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot_id UUID;
  v_status TEXT;
BEGIN
  -- 트랜잭션 격리 수준 설정
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  
  -- 1. 예약 확인 및 잠금
  SELECT rental_slot_id, status INTO v_slot_id, v_status
  FROM reservations
  WHERE id = p_reservation_id 
    AND user_id = p_user_id
  FOR UPDATE;
  
  -- 예약을 찾을 수 없는 경우
  IF v_slot_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 이미 취소된 경우
  IF v_status = 'cancelled' THEN
    RETURN FALSE;
  END IF;
  
  -- 2. 예약 상태 업데이트
  UPDATE reservations
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_reservation_id;
  
  -- 3. 슬롯 상태 복원
  UPDATE rental_slots
  SET 
    is_reserved = FALSE,
    reservation_id = NULL,
    updated_at = NOW()
  WHERE id = v_slot_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 4. 동시 예약 체크 함수
-- ============================================
CREATE OR REPLACE FUNCTION check_concurrent_reservations(
  p_user_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- 같은 시간대에 이미 예약이 있는지 확인
  RETURN NOT EXISTS (
    SELECT 1
    FROM reservations r
    JOIN rental_slots rs ON r.rental_slot_id = rs.id
    WHERE r.user_id = p_user_id
      AND r.status IN ('pending', 'confirmed')
      AND rs.date = p_date
      AND (
        (rs.start_time <= p_start_time AND rs.end_time > p_start_time) OR
        (rs.start_time < p_end_time AND rs.end_time >= p_end_time) OR
        (rs.start_time >= p_start_time AND rs.end_time <= p_end_time)
      )
  );
END;
$$;

-- ============================================
-- 5. 배치 슬롯 가용성 확인
-- ============================================
CREATE OR REPLACE FUNCTION check_slots_availability(
  p_slot_ids UUID[]
)
RETURNS TABLE(
  slot_id UUID,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id AS slot_id,
    NOT is_reserved AS is_available
  FROM rental_slots
  WHERE id = ANY(p_slot_ids);
END;
$$;

-- ============================================
-- 6. 예약 버전 관리 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_reservation_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 트리거 생성
DROP TRIGGER IF EXISTS reservation_version_trigger ON reservations;
CREATE TRIGGER reservation_version_trigger
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_version();

-- ============================================
-- 7. 예약 상태 변경 로그 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS reservation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_reservation_logs_reservation_id ON reservation_logs(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_logs_created_at ON reservation_logs(created_at DESC);

-- ============================================
-- 8. 예약 상태 변경 로그 트리거
-- ============================================
CREATE OR REPLACE FUNCTION log_reservation_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO reservation_logs (
    reservation_id,
    user_id,
    action,
    old_status,
    new_status,
    metadata
  ) VALUES (
    NEW.id,
    NEW.user_id,
    TG_OP,
    OLD.status,
    NEW.status,
    jsonb_build_object(
      'device_id', NEW.device_id,
      'slot_id', NEW.rental_slot_id,
      'timestamp', NOW()
    )
  );
  RETURN NEW;
END;
$$;

-- 트리거 생성
DROP TRIGGER IF EXISTS reservation_change_log_trigger ON reservations;
CREATE TRIGGER reservation_change_log_trigger
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION log_reservation_changes();

-- ============================================
-- 필요한 컬럼 추가 (없는 경우)
-- ============================================
-- version 컬럼 추가
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

-- cancelled_at 컬럼 추가
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- ============================================
-- 권한 설정
-- ============================================
GRANT EXECUTE ON FUNCTION lock_rental_slot_for_update TO authenticated;
GRANT EXECUTE ON FUNCTION create_reservation_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_reservation_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION check_concurrent_reservations TO authenticated;
GRANT EXECUTE ON FUNCTION check_slots_availability TO authenticated;

-- ============================================
-- 실행 완료 메시지
-- ============================================
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요.
-- 실행 후 예약 생성/취소가 원자적으로 처리되는지 테스트하세요.