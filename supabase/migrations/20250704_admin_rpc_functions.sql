-- 사용자 이메일 조회 함수 (관리자만 사용 가능)
CREATE OR REPLACE FUNCTION get_user_emails(user_ids UUID[])
RETURNS TABLE(id UUID, email TEXT) 
SECURITY DEFINER
AS $$
BEGIN
  -- 관리자인지 확인
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- 이메일로 사용자 찾기 함수 (슈퍼관리자만 사용 가능)
CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT)
SECURITY DEFINER
AS $$
BEGIN
  -- 슈퍼관리자인지 확인
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE au.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- RPC 함수 권한 설정
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO authenticated;