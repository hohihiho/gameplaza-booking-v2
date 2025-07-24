-- 롤백 스크립트: 20250123 마이그레이션 취소
-- 주의: 이 스크립트는 데이터 손실을 최소화하도록 설계되었습니다

-- 1. 트리거 제거
DROP TRIGGER IF EXISTS set_reservation_number_trigger ON reservations;
DROP FUNCTION IF EXISTS set_reservation_number();

-- 2. 예약 번호 생성 함수 제거
DROP FUNCTION IF EXISTS generate_reservation_number(DATE);

-- 3. RLS 정책 롤백 (필요한 경우 이전 정책으로 복원)
-- 주의: 정책을 변경하기 전에 기존 정책을 백업해두세요

-- 4. 인덱스 제거 (선택적 - 성능에 영향이 없다면 유지해도 됨)
-- DROP INDEX IF EXISTS idx_reservations_reservation_number;

-- 5. 컬럼 제거 (주의: 데이터가 손실됩니다!)
-- 아래 명령어는 매우 위험하므로 반드시 데이터 백업 후 실행하세요
-- ALTER TABLE reservations DROP COLUMN IF EXISTS [column_name];

-- 롤백 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'Rollback script prepared.';
    RAISE NOTICE 'WARNING: Column drops will cause data loss!';
    RAISE NOTICE 'Please backup data before executing column drops.';
END $$;