# 새 OAuth 클라이언트 생성 가이드

## 1. 새 OAuth 클라이언트 생성
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 접속
2. **"+ 사용자 인증 정보 만들기"** → **"OAuth 클라이언트 ID"**
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `게임플라자 임시`
5. 승인된 리디렉션 URI 추가:
   ```
   https://gameplaza-v2.vercel.app/api/auth/callback/google
   https://www.gameplaza.kr/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
6. **만들기** 클릭

## 2. 새 Client ID/Secret 받기
생성 완료 후 표시되는:
- Client ID: `새로운_클라이언트_ID`
- Client Secret: `새로운_시크릿`

## 3. 환경 변수 업데이트

### .env.local
```bash
GOOGLE_CLIENT_ID=새로운_클라이언트_ID
GOOGLE_CLIENT_SECRET=새로운_시크릿
```

### Vercel Dashboard
1. [Vercel 환경 변수](https://vercel.com/hohihiho/gameplaza-v2/settings/environment-variables)
2. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 업데이트
3. 재배포

## 4. OAuth 동의 화면 설정
1. 새 클라이언트용 OAuth 동의 화면 설정
2. **테스트 모드**로 설정
3. 테스트 사용자 추가
4. 저장

이렇게 하면 기존 프로덕션 OAuth는 나중에 인증받을 수 있고, 당장은 새 것으로 운영 가능!