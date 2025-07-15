# 🔧 관리자 설정 가이드

## 초기 관리자 등록 방법

### 1. 사전 준비
1. ndz5496@gmail.com 계정으로 구글 로그인하여 회원가입 완료
2. 프로필 설정까지 완료

### 2. 관리자 권한 부여

#### 방법 1: Seed 스크립트 실행 (권장)
```bash
# Supabase CLI를 통해 실행
supabase db seed -f supabase/seed/init_admin.sql
```

#### 방법 2: Supabase Dashboard에서 직접 실행
1. Supabase Dashboard → SQL Editor
2. 아래 SQL 실행:
```sql
-- ndz5496@gmail.com을 슈퍼관리자로 설정
INSERT INTO admins (user_id, is_super_admin)
SELECT id, true 
FROM users 
WHERE email = 'ndz5496@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET is_super_admin = true;
```

### 3. 확인 방법
```sql
-- 관리자 목록 확인
SELECT u.email, a.is_super_admin, a.created_at
FROM admins a
JOIN users u ON a.user_id = u.id;
```

### 4. 관리자 페이지 접근
- URL: `/admin`
- 로그인한 계정이 관리자로 등록되어 있어야 접근 가능

## 추가 관리자 등록

초기 관리자 설정 후에는 관리자 페이지에서 직접 추가 가능:
1. `/admin/admins` 페이지 접근
2. "새 관리자 추가" 클릭
3. 이메일로 사용자 검색 후 추가

## 문제 해결

### "사용자를 찾을 수 없습니다" 오류
1. 해당 이메일로 먼저 회원가입 필요
2. 구글 로그인 → 프로필 설정 완료
3. 스크립트 재실행

### 관리자 페이지 접근 불가
1. 로그아웃 후 다시 로그인
2. 브라우저 캐시 삭제
3. 관리자 테이블 확인