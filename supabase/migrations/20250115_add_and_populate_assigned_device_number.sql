-- 예약 테이블에 배정된 기기 번호 필드 추가
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS assigned_device_number INTEGER;

-- 기존 예약에 대해 device_id가 있으면 device_number 매핑
UPDATE reservations r
SET assigned_device_number = d.device_number
FROM devices d
WHERE r.device_id = d.id
AND r.assigned_device_number IS NULL;

-- device_id가 없는 예약은 1번으로 설정
UPDATE reservations
SET assigned_device_number = 1
WHERE assigned_device_number IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_reservations_assigned_device ON reservations(assigned_device_number, date);

-- 코멘트 추가
COMMENT ON COLUMN reservations.assigned_device_number IS '배정된 기기 번호';