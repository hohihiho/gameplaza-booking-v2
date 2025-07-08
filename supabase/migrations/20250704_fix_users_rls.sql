-- users 테이블 RLS 정책 확인 및 수정

-- 현재 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- users 테이블 RLS 활성화 (이미 활성화되어 있을 수 있음)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 SELECT 정책이 너무 제한적일 수 있으므로 확인
-- 임시로 모든 사용자가 모든 사용자를 볼 수 있도록 설정
CREATE POLICY "Anyone can view all users" ON users
  FOR SELECT
  USING (true);

-- 또는 자기 자신의 정보는 항상 볼 수 있도록
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid()::text = id::text OR email = current_setting('request.jwt.claims', true)::json->>'email');

-- INSERT 정책 - 회원가입 시 필요
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text OR email = current_setting('request.jwt.claims', true)::json->>'email');

-- UPDATE 정책 - 자기 정보만 수정
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text OR email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (auth.uid()::text = id::text OR email = current_setting('request.jwt.claims', true)::json->>'email');