-- Vercel DB 완전 초기화 스크립트
-- 2025년 1월 15일
-- 주의: 모든 데이터가 삭제됩니다!

-- 1. 예약 관련 데이터 삭제
TRUNCATE TABLE reservations CASCADE;
TRUNCATE TABLE schedule_events CASCADE;
TRUNCATE TABLE special_schedules CASCADE;

-- 2. 기기 관련 데이터 삭제 (CASCADE로 연관 데이터도 함께 삭제)
TRUNCATE TABLE devices CASCADE;
TRUNCATE TABLE device_types CASCADE;
TRUNCATE TABLE device_categories CASCADE;

-- 3. 사용자 데이터 삭제
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE admins CASCADE;
TRUNCATE TABLE admin_logs CASCADE;

-- 4. 기타 데이터 삭제
TRUNCATE TABLE time_slots CASCADE;
TRUNCATE TABLE holidays CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE guide_content CASCADE;
TRUNCATE TABLE content_pages CASCADE;

-- 5. 설정은 유지 (필요시 주석 해제)
-- TRUNCATE TABLE settings CASCADE;

-- 6. 규칙 관련 테이블 삭제
TRUNCATE TABLE reservation_rules CASCADE;
TRUNCATE TABLE machine_rules CASCADE;

-- 7. 대여 관련 테이블 삭제
TRUNCATE TABLE rental_time_slots CASCADE;
TRUNCATE TABLE rental_settings CASCADE;
TRUNCATE TABLE rental_machines CASCADE;

-- 8. 플레이 모드 삭제
TRUNCATE TABLE play_modes CASCADE;

-- 9. 시간 조정 삭제
TRUNCATE TABLE time_adjustments CASCADE;

-- 10. 기기(machines) 테이블도 정리
TRUNCATE TABLE machines CASCADE;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DB 초기화 완료!';
  RAISE NOTICE '모든 테이블이 비워졌습니다.';
  RAISE NOTICE '이제 수동으로 필요한 데이터를 추가하세요.';
  RAISE NOTICE '========================================';
END $$;