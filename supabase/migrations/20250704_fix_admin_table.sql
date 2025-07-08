-- admins 테이블 구조 확인 및 수정

-- 1. 현재 admins 테이블 구조 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'admins';

-- 2. admins 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 3. role 컬럼이 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'admins' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE admins ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'admin';
    END IF;
END $$;

-- 4. RLS 활성화
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성 (이미 있으면 무시)
DO $$
BEGIN
    -- SELECT 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admins' 
        AND policyname = 'Anyone can view admins'
    ) THEN
        CREATE POLICY "Anyone can view admins" ON admins FOR SELECT USING (true);
    END IF;
END $$;

-- 6. ndz5496@gmail.com을 슈퍼관리자로 설정
INSERT INTO admins (user_id, role)
SELECT id, 'super_admin' 
FROM users 
WHERE email = 'ndz5496@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'super_admin', updated_at = CURRENT_TIMESTAMP;

-- 7. 결과 확인
SELECT a.*, u.email 
FROM admins a
JOIN users u ON a.user_id = u.id
WHERE u.email = 'ndz5496@gmail.com';