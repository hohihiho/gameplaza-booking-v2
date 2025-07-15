-- leejinseok94@gmail.com 사용자를 슈퍼관리자로 등록

-- 1. 먼저 해당 이메일로 사용자가 있는지 확인하고 없으면 생성
INSERT INTO users (id, email, name, nickname, phone, role)
VALUES (
  gen_random_uuid(),
  'leejinseok94@gmail.com',
  '이진석',
  '이진석',
  '',
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin';

-- 2. 해당 사용자를 슈퍼관리자로 등록
WITH user_info AS (
  SELECT id FROM users WHERE email = 'leejinseok94@gmail.com'
)
INSERT INTO admins (user_id, is_super_admin, permissions)
SELECT 
  id,
  true,
  '{"reservations": true, "users": true, "devices": true, "cms": true, "settings": true}'::jsonb
FROM user_info
ON CONFLICT (user_id) DO UPDATE
SET 
  is_super_admin = true,
  permissions = '{"reservations": true, "users": true, "devices": true, "cms": true, "settings": true}'::jsonb;

-- 3. 슈퍼관리자 권한 확인
SELECT 
  u.email,
  u.name,
  a.is_super_admin,
  a.permissions
FROM users u
JOIN admins a ON u.id = a.user_id
WHERE u.email = 'leejinseok94@gmail.com';