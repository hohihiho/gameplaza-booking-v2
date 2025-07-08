-- 현재 관리자 상태 확인 및 복구 스크립트

-- 1. ndz5496@gmail.com 사용자 확인
SELECT 'User Check:' as step;
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'ndz5496@gmail.com';

-- 2. 현재 관리자 목록 확인
SELECT 'Admin List:' as step;
SELECT a.*, u.email 
FROM admins a
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- 3. ndz5496@gmail.com이 users 테이블에 있는지 확인하고 슈퍼관리자로 설정
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- users 테이블에서 사용자 ID 찾기
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'ndz5496@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        -- admins 테이블에 슈퍼관리자로 추가/업데이트
        INSERT INTO admins (user_id, role)
        VALUES (v_user_id, 'super_admin')
        ON CONFLICT (user_id) 
        DO UPDATE SET role = 'super_admin', updated_at = CURRENT_TIMESTAMP;
        
        RAISE NOTICE 'Super admin set for ndz5496@gmail.com (user_id: %)', v_user_id;
    ELSE
        -- Supabase users 테이블에서 찾기 (auth.users가 아닌 public.users)
        SELECT id INTO v_user_id
        FROM users
        WHERE email = 'ndz5496@gmail.com';
        
        IF v_user_id IS NOT NULL THEN
            INSERT INTO admins (user_id, role)
            VALUES (v_user_id, 'super_admin')
            ON CONFLICT (user_id) 
            DO UPDATE SET role = 'super_admin', updated_at = CURRENT_TIMESTAMP;
            
            RAISE NOTICE 'Super admin set from public.users for ndz5496@gmail.com (user_id: %)', v_user_id;
        ELSE
            RAISE NOTICE 'User ndz5496@gmail.com not found in any users table';
        END IF;
    END IF;
END $$;

-- 4. 결과 확인
SELECT 'Final Check:' as step;
SELECT a.*, 
       COALESCE(au.email, u.email) as email,
       CASE 
           WHEN au.email IS NOT NULL THEN 'auth.users'
           WHEN u.email IS NOT NULL THEN 'public.users'
           ELSE 'not found'
       END as user_source
FROM admins a
LEFT JOIN auth.users au ON a.user_id = au.id
LEFT JOIN users u ON a.user_id = u.id
WHERE a.role = 'super_admin';