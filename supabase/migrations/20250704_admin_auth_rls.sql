-- 관리자 테이블 생성 (이미 있다면 무시)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 관리자 테이블 RLS 활성화
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 관리자만 관리자 목록을 볼 수 있음
CREATE POLICY "Admins can view admin list" ON admins 
  FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- 관리자 확인 함수 생성
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 개발용 정책 삭제
DROP POLICY IF EXISTS "Anyone can insert play modes" ON play_modes;
DROP POLICY IF EXISTS "Anyone can update play modes" ON play_modes;
DROP POLICY IF EXISTS "Anyone can delete play modes" ON play_modes;

DROP POLICY IF EXISTS "Anyone can insert device types" ON device_types;
DROP POLICY IF EXISTS "Anyone can update device types" ON device_types;
DROP POLICY IF EXISTS "Anyone can delete device types" ON device_types;

DROP POLICY IF EXISTS "Anyone can insert devices" ON devices;
DROP POLICY IF EXISTS "Anyone can update devices" ON devices;
DROP POLICY IF EXISTS "Anyone can delete devices" ON devices;

DROP POLICY IF EXISTS "Anyone can insert rental settings" ON rental_settings;
DROP POLICY IF EXISTS "Anyone can update rental settings" ON rental_settings;
DROP POLICY IF EXISTS "Anyone can delete rental settings" ON rental_settings;

-- play_modes 테이블 - 관리자만 수정 가능
CREATE POLICY "Admins can insert play modes" ON play_modes 
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update play modes" ON play_modes 
  FOR UPDATE 
  USING (is_admin()) 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete play modes" ON play_modes 
  FOR DELETE 
  USING (is_admin());

-- device_types 테이블 - 관리자만 수정 가능
CREATE POLICY "Admins can insert device types" ON device_types 
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update device types" ON device_types 
  FOR UPDATE 
  USING (is_admin()) 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete device types" ON device_types 
  FOR DELETE 
  USING (is_admin());

-- devices 테이블 - 관리자만 수정 가능
CREATE POLICY "Admins can insert devices" ON devices 
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update devices" ON devices 
  FOR UPDATE 
  USING (is_admin()) 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete devices" ON devices 
  FOR DELETE 
  USING (is_admin());

-- rental_settings 테이블 - 관리자만 수정 가능
CREATE POLICY "Admins can insert rental settings" ON rental_settings 
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update rental settings" ON rental_settings 
  FOR UPDATE 
  USING (is_admin()) 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete rental settings" ON rental_settings 
  FOR DELETE 
  USING (is_admin());

-- 슈퍼관리자 설정 (ndz5496@gmail.com)
-- 이 쿼리는 해당 이메일로 가입한 사용자가 있을 때만 실행됩니다
INSERT INTO admins (user_id, role) 
SELECT id, 'super_admin' FROM auth.users 
WHERE email = 'ndz5496@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- 관리자 권한 레벨 체크 함수
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 관리자 테이블 수정 권한 (슈퍼관리자만 가능)
CREATE POLICY "Super admins can insert admins" ON admins 
  FOR INSERT 
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update admins" ON admins 
  FOR UPDATE 
  USING (is_super_admin()) 
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can delete admins" ON admins 
  FOR DELETE 
  USING (is_super_admin() AND user_id != auth.uid()); -- 자기 자신은 삭제 불가