-- 슈퍼관리자 계정 생성
-- 2025년 1월 15일

-- UUID 생성 함수 사용
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- 관리자 계정 생성
  admin_id := gen_random_uuid();
  
  -- users 테이블에 관리자 추가
  INSERT INTO users (
    id,
    email,
    name,
    phone,
    nickname,
    role,
    is_blacklisted,
    created_at,
    updated_at
  ) VALUES (
    admin_id,
    'ndz5496@gmail.com',
    '관리자',
    '010-0000-0000',  -- 필요시 실제 번호로 변경
    'ADMIN',
    'admin',
    false,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ 슈퍼관리자 계정 생성 완료!';
  RAISE NOTICE '📧 이메일: ndz5496@gmail.com';
  RAISE NOTICE '🔑 역할: admin';
  RAISE NOTICE '💡 Google OAuth로 로그인하면 자동으로 관리자 권한이 부여됩니다.';
  
  -- 추가 관리자 이메일이 필요하면 여기에 추가
  -- 예: hohihu@gmail.com 같은 다른 이메일도 관리자로 설정 가능
  
EXCEPTION
  WHEN unique_violation THEN
    -- 이미 존재하는 경우 업데이트
    UPDATE users 
    SET 
      role = 'admin',
      name = '관리자',
      nickname = 'ADMIN',
      updated_at = NOW()
    WHERE email = 'ndz5496@gmail.com';
    
    RAISE NOTICE '✅ 기존 계정을 관리자로 업데이트했습니다!';
    RAISE NOTICE '📧 이메일: ndz5496@gmail.com';
END $$;

-- 확인
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'ndz5496@gmail.com';