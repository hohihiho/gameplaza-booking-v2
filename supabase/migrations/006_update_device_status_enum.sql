-- 기기 상태 enum 타입 수정
-- broken을 unavailable로 변경

-- 먼저 broken 상태를 가진 기기들을 unavailable로 업데이트
UPDATE devices 
SET status = 'unavailable' 
WHERE status = 'broken';

-- enum 타입 재생성 (PostgreSQL에서는 enum 값을 직접 수정할 수 없음)
-- 새로운 타입 생성
CREATE TYPE device_status_new AS ENUM ('available', 'in_use', 'maintenance', 'unavailable');

-- 기존 컬럼의 타입 변경
ALTER TABLE devices 
  ALTER COLUMN status TYPE device_status_new 
  USING status::text::device_status_new;

-- 기존 타입 삭제
DROP TYPE device_status;

-- 새 타입을 기존 이름으로 변경
ALTER TYPE device_status_new RENAME TO device_status;