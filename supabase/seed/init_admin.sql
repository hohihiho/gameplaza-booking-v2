-- 초기 관리자 설정 스크립트
-- ndz5496@gmail.com을 슈퍼관리자로 등록

-- 1. users 테이블에서 해당 이메일 사용자 찾기
DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT := 'ndz5496@gmail.com';
BEGIN
    -- users 테이블에서 사용자 찾기
    SELECT id INTO v_user_id
    FROM users
    WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '';
        RAISE NOTICE '================================================';
        RAISE NOTICE '⚠️  경고: % 사용자를 찾을 수 없습니다!', v_user_email;
        RAISE NOTICE '';
        RAISE NOTICE '다음 단계를 따라주세요:';
        RAISE NOTICE '1. 브라우저에서 로그인 페이지로 이동';
        RAISE NOTICE '2. %로 구글 로그인', v_user_email;
        RAISE NOTICE '3. 회원가입 완료';
        RAISE NOTICE '4. 이 스크립트를 다시 실행';
        RAISE NOTICE '================================================';
        RAISE NOTICE '';
    ELSE
        -- admins 테이블에 슈퍼관리자로 추가
        INSERT INTO admins (user_id, is_super_admin, created_at, updated_at)
        VALUES (v_user_id, true, NOW(), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            is_super_admin = true,
            updated_at = NOW();
        
        RAISE NOTICE '';
        RAISE NOTICE '================================================';
        RAISE NOTICE '✅ 성공: %가 슈퍼관리자로 등록되었습니다!', v_user_email;
        RAISE NOTICE '   User ID: %', v_user_id;
        RAISE NOTICE '';
        RAISE NOTICE '이제 다음 작업이 가능합니다:';
        RAISE NOTICE '- /admin 페이지 접근';
        RAISE NOTICE '- 다른 관리자 추가/삭제';
        RAISE NOTICE '- 모든 관리자 기능 사용';
        RAISE NOTICE '================================================';
        RAISE NOTICE '';
    END IF;
END $$;

-- 현재 관리자 목록 확인
SELECT 
    u.email,
    a.is_super_admin,
    a.created_at,
    CASE 
        WHEN a.is_super_admin THEN '슈퍼관리자'
        ELSE '일반관리자'
    END as role
FROM admins a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at;