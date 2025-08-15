# 🚨 Google OAuth AccessDenied 에러 해결 가이드

## 현재 상황
- **에러**: `AccessDenied` - Google OAuth 로그인 시도 시 발생
- **Client ID**: `377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com`
- **영향**: 모든 사용자가 로그인할 수 없음

## ✅ 즉시 수행해야 할 작업

### 1. Google Cloud Console에서 리다이렉트 URI 추가 (가장 중요!)

1. [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials) 접속
2. OAuth 2.0 클라이언트 ID 목록에서 해당 Client ID 클릭
3. **"승인된 리디렉션 URI"** 섹션으로 스크롤
4. 다음 URI들을 **모두** 추가 (복사해서 붙여넣기):

```
https://gameplaza-v2.vercel.app/api/auth/callback/google
https://www.gameplaza.kr/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

5. **저장** 버튼 클릭 (중요!)

### 2. OAuth 동의 화면 설정 확인

1. [OAuth 동의 화면](https://console.cloud.google.com/apis/credentials/consent) 접속
2. 현재 상태 확인:
   - **게시 상태**: "테스트" 또는 "프로덕션"
   - **앱 이름**: "게임플라자"로 설정되어 있는지 확인

#### 테스트 모드인 경우:
- **테스트 사용자** 섹션에서 **"사용자 추가"** 클릭
- 로그인하려는 Google 계정 이메일 추가
- 최대 100명까지 추가 가능

#### 프로덕션 모드로 변경하려면:
- **"앱 게시"** 버튼 클릭
- 검증 과정을 거쳐야 하지만, 일반 OAuth는 즉시 사용 가능

### 3. Vercel 환경 변수 확인

1. [Vercel Dashboard](https://vercel.com/hohihiho/gameplaza-v2/settings/environment-variables) 접속
2. 다음 환경 변수가 설정되어 있는지 확인:

```bash
GOOGLE_CLIENT_ID=377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXTAUTH_URL=https://gameplaza-v2.vercel.app
NEXTAUTH_SECRET=[설정되어 있어야 함]
```

3. 변경사항이 있다면 **"Save"** 후 재배포

### 4. 브라우저 캐시 정리

1. Chrome 설정 → 개인정보 보호 및 보안 → 인터넷 사용 기록 삭제
2. 또는 시크릿/프라이빗 모드에서 테스트

### 5. Google 계정 권한 초기화

1. [Google 계정 권한 관리](https://myaccount.google.com/permissions) 접속
2. "게임플라자" 또는 관련 앱이 있다면 **제거**
3. 다시 로그인 시도

## 🔍 문제가 지속되는 경우

### 추가 확인 사항:

1. **프로젝트 ID 확인**
   - Google Cloud Console에서 올바른 프로젝트를 선택했는지 확인
   - 프로젝트 ID가 Client ID와 일치하는지 확인

2. **API 활성화 확인**
   - [API 라이브러리](https://console.cloud.google.com/apis/library)에서 "Google+ API" 또는 "Google Identity" API가 활성화되어 있는지 확인

3. **도메인 소유권 확인** (프로덕션 모드)
   - gameplaza.kr 도메인이 검증되어 있는지 확인

## 📝 테스트 방법

1. 로컬 테스트:
```bash
npm run dev
# http://localhost:3000/login 접속
```

2. 프로덕션 테스트:
```
https://www.gameplaza.kr/login
```

## 🆘 긴급 연락처

문제가 해결되지 않으면:
1. Google Cloud Support에 문의
2. Vercel Support에 문의
3. 개발팀에 연락

## 📅 작업 기록

- 2025-01-22: OAuth 클라이언트 ID 변경 (Firebase → 독립 프로젝트)
- 2025-01-22: AccessDenied 에러 발생 및 디버깅 시작

---

**중요**: 위 1번 작업(리다이렉트 URI 추가)이 가장 중요합니다. 이것만 제대로 설정되어도 대부분 해결됩니다!