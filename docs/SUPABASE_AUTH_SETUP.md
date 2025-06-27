# Supabase Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "사용자 인증 정보" 이동
4. "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션" 선택
6. 이름: "게임플라자" 입력
7. 승인된 리디렉션 URI 추가:
   ```
   https://rupeyejnfurlcpgneekg.supabase.co/auth/v1/callback
   ```

## 2. Supabase Dashboard 설정

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 "Authentication" → "Providers" 이동
4. "Google" 찾아서 활성화
5. Google Cloud Console에서 복사한 정보 입력:
   - Client ID
   - Client Secret
6. "Save" 클릭

## 3. 로컬 개발 환경 설정

`.env.local` 파일에 추가 (이미 설정됨):
```env
NEXT_PUBLIC_SUPABASE_URL=https://rupeyejnfurlcpgneekg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 4. 테스트

1. 개발 서버 실행: `npm run dev`
2. `/login` 페이지 접속
3. "Google로 로그인" 버튼 클릭
4. Google 계정으로 로그인
5. 첫 로그인 시 `/signup` 페이지로 리다이렉트
6. 회원가입 완료 후 홈페이지로 이동

## 5. 배포 시 추가 설정

Vercel 등 배포 플랫폼에서:
1. 환경 변수 설정
2. Google OAuth 리디렉션 URI에 실제 도메인 추가:
   ```
   https://your-domain.com/auth/callback
   ```

## 주의사항

- Google OAuth Client Secret은 절대 클라이언트 코드에 노출하면 안됨
- Supabase Dashboard에서만 설정
- 프로덕션 환경에서는 반드시 HTTPS 사용