# Google OAuth 설정 가이드

## Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택 또는 생성
3. APIs & Services > Credentials로 이동
4. OAuth 2.0 Client IDs에서 클라이언트 수정

## 승인된 리디렉션 URI 추가

개발 환경:
- `http://localhost:3000/api/auth/callback/google`

프로덕션 환경:
- `https://gameplaza.kr/api/auth/callback/google`

## OAuth 동의 화면 설정

1. OAuth consent screen으로 이동
2. 앱 이름: "광주 게임플라자"
3. 사용자 지원 이메일 설정
4. 앱 로고 업로드 (선택사항)
5. 승인된 도메인 추가: `gameplaza.kr`

## 환경 변수

```env
GOOGLE_CLIENT_ID=44559014883-248e8a3kb4meo4peee4ga8vr5190566m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 주의사항

- 리디렉션 URI는 정확히 일치해야 함
- 프로덕션 배포 시 NEXTAUTH_URL 변경 필요
- OAuth 동의 화면의 앱 이름이 로그인 화면에 표시됨