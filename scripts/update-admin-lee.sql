-- 이진석 관리자 이메일 수정
-- 2025년 1월 15일

DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- 기존 hohihu@gmail.com 삭제
  DELETE FROM users WHERE email = 'hohihu@gmail.com';
  
  -- 올바른 이메일로 새로 생성
  admin_id := gen_random_uuid();
  
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
    'leejinseok94@gmail.com',  -- 이진석님 실제 이메일
    '이진석',
    '010-0000-0000',
    '이진석',
    'admin',
    false,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ 이진석 관리자 계정 생성 완료!';
  RAISE NOTICE '📧 이메일: leejinseok94@gmail.com';
  RAISE NOTICE '🔑 역할: admin';
  
EXCEPTION
  WHEN unique_violation THEN
    -- 이미 존재하는 경우 업데이트
    UPDATE users 
    SET 
      role = 'admin',
      name = '이진석',
      nickname = '이진석',
      updated_at = NOW()
    WHERE email = 'leejinseok94@gmail.com';
    
    RAISE NOTICE '✅ 기존 계정을 관리자로 업데이트했습니다!';
    RAISE NOTICE '📧 이메일: leejinseok94@gmail.com';
END $$;

-- 모든 관리자 확인
SELECT id, email, name, role, created_at 
FROM users 
WHERE role = 'admin'
ORDER BY created_at;