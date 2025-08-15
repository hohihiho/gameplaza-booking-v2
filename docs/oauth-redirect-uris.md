# Google OAuth 리다이렉트 URI 설정

## 필수 리다이렉트 URI

Google Cloud Console에서 OAuth 2.0 클라이언트 ID 설정에 다음 URI들을 모두 추가해야 합니다:

### 프로덕션 환경
```
https://gameplaza-v2.vercel.app/api/auth/callback/google
https://www.gameplaza.kr/api/auth/callback/google
```

### 개발 환경
```
http://localhost:3000/api/auth/callback/google
```

## 설정 방법

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)로 이동
2. OAuth 2.0 클라이언트 ID 선택 (377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com)
3. "승인된 리디렉션 URI" 섹션에 위 URI들 추가
4. 저장

## OAuth 동의 화면 설정

1. [OAuth 동의 화면](https://console.cloud.google.com/apis/credentials/consent)으로 이동
2. 앱 이름: "게임플라자" 또는 "광주 게임플라자"로 설정
3. 사용자 지원 이메일 설정
4. 테스트 모드인 경우:
   - 테스트 사용자에 본인 이메일 추가
   - 또는 앱을 "프로덕션" 모드로 변경

## 문제 해결

### AccessDenied 에러가 발생하는 경우:
1. 리다이렉트 URI가 정확히 일치하는지 확인 (대소문자, 슬래시 포함)
2. OAuth 동의 화면이 테스트 모드인 경우 테스트 사용자 목록 확인
3. Google 계정에서 앱 권한 재설정: https://myaccount.google.com/permissions

### 디버깅
```bash
# OAuth 프로바이더 확인
curl http://localhost:3000/api/auth/providers | jq

# 로그인 URL 직접 확인
curl http://localhost:3000/api/auth/signin
```

## 환경 변수 확인
```bash
# .env.local 또는 .env.production
GOOGLE_CLIENT_ID=377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```