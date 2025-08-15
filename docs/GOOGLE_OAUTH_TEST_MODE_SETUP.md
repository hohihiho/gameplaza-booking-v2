# Google OAuth 테스트 모드 설정 가이드

## 현재 문제
- AccessDenied 에러 발생
- OAuth 동의 화면이 거부됨

## 해결 방법

### 1. Google Cloud Console에서 확인할 사항

1. **[Google Cloud Console](https://console.cloud.google.com/) 접속**

2. **프로젝트 선택**
   - 상단에서 "GamePlaza" 프로젝트 선택
   - Client ID: `377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com`

3. **OAuth 동의 화면 설정 확인**
   - 왼쪽 메뉴에서 "APIs & Services" → "OAuth consent screen" 클릭
   
   **확인할 항목:**
   - Publishing status: **"Testing"** (중요!)
   - User type: "External"
   
   만약 "Production"으로 되어 있다면:
   - "BACK TO TESTING" 버튼 클릭
   - 테스트 모드로 전환

4. **테스트 사용자 추가**
   - OAuth consent screen 페이지에서 "Test users" 섹션
   - "ADD USERS" 버튼 클릭
   - 본인의 Gmail 계정 추가 (예: ndz5496@gmail.com)
   - 최대 100명까지 추가 가능

### 2. 테스트 모드 장점
- 검증 없이 즉시 사용 가능
- 100명까지 테스트 사용자 추가 가능
- 개발/테스트에 충분
- AccessDenied 에러 해결

### 3. 설정 후 테스트
1. 브라우저 캐시/쿠키 삭제
2. 시크릿 모드에서 테스트
3. https://gameplaza-v2.vercel.app/login 접속
4. Google 로그인 시도

### 4. 여전히 문제가 있다면

#### 옵션 A: 새 OAuth 클라이언트 생성
```
1. APIs & Services → Credentials
2. "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "GamePlaza Test"
5. Authorized redirect URIs:
   - https://gameplaza-v2.vercel.app/api/auth/callback/google
   - http://localhost:3000/api/auth/callback/google (개발용)
6. Create 클릭
7. 새로운 Client ID와 Secret을 환경변수에 업데이트
```

#### 옵션 B: 기존 프로젝트 확인
```
1. APIs & Services → Credentials
2. OAuth 2.0 Client IDs 섹션에서 현재 클라이언트 확인
3. 클라이언트 클릭하여 설정 확인
4. Authorized redirect URIs 확인:
   - https://gameplaza-v2.vercel.app/api/auth/callback/google
```

### 5. Vercel 환경변수 확인
https://vercel.com/[your-team]/gameplaza-v2/settings/environment-variables

```
GOOGLE_CLIENT_ID=377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 6. 로컬 테스트
```bash
# .env.local 파일 확인
GOOGLE_CLIENT_ID=377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# 로컬에서 테스트
npm run dev
# http://localhost:3000/login 에서 테스트
```

## 중요 사항
- **테스트 모드는 영구적으로 사용 가능** (100명 제한)
- 실제 서비스 운영 시에만 Production 모드 필요
- Production 모드는 Google 검증 필요 (최대 6주 소요)

## 추가 도움말
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 동의 화면 설정 가이드](https://support.google.com/cloud/answer/10311615)