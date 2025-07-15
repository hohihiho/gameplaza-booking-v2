-- schedule_events 테이블의 created_by 외래키 제약조건을 CASCADE에서 SET NULL로 변경
-- 사용자 탈퇴 시에도 운영일정이 삭제되지 않도록 수정

-- 기존 외래키 제약조건 확인 및 제거
DO $$
BEGIN
    -- 외래키 제약조건 이름 찾기 및 제거
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'schedule_events' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%created_by%'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE schedule_events DROP CONSTRAINT ' || constraint_name || ';'
            FROM information_schema.table_constraints
            WHERE table_name = 'schedule_events' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%created_by%'
            LIMIT 1
        );
    END IF;
END $$;

-- 새로운 외래키 제약조건 추가 (SET NULL)
ALTER TABLE schedule_events
ADD CONSTRAINT schedule_events_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- 코멘트 추가
COMMENT ON COLUMN schedule_events.created_by IS '일정을 생성한 사용자 ID (사용자 삭제 시 NULL로 설정됨)';