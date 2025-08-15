# Google OAuth 설정 가이드

## Google OAuth 앱 이름 변경 방법

### 1. Google Cloud Console 접속
- [Google Cloud Console](https://console.cloud.google.com) 접속
- 프로젝트 선택 (현재 사용 중인 프로젝트)

### 2. OAuth 동의 화면 수정
1. 왼쪽 메뉴에서 **APIs & Services** → **OAuth consent screen** 클릭
2. **EDIT APP** 버튼 클릭
3. 다음 정보 수정:
   - **App name**: `광주 게임플라자` 또는 `GamePlaza`
   - **User support email**: `ndz5496@gmail.com`
   - **App logo**: (선택사항) 로고 이미지 업로드
   - **Application home page**: `https://gameplaza-v2.vercel.app`
   - **Application privacy policy link**: `https://gameplaza-v2.vercel.app/privacy`
   - **Application terms of service link**: `https://gameplaza-v2.vercel.app/terms`
   - **Authorized domains**: `gameplaza-v2.vercel.app` 추가
   - **Developer contact information**: `ndz5496@gmail.com`

4. **SAVE AND CONTINUE** 클릭
5. Scopes 페이지: 그대로 두고 **SAVE AND CONTINUE**
6. Test users 페이지: 필요시 테스트 사용자 추가
7. Summary 페이지: 확인 후 **BACK TO DASHBOARD**

### 3. 리다이렉트 URI 확인
1. **APIs & Services** → **Credentials** 클릭
2. OAuth 2.0 Client IDs에서 현재 사용 중인 클라이언트 클릭
3. Authorized redirect URIs에 다음이 포함되어 있는지 확인:
   - `https://gameplaza-v2.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`

### 4. 발행 상태 확인
- OAuth consent screen에서 **Publishing status** 확인
- "Testing" 상태면 제한된 사용자만 로그인 가능
- "In production" 상태로 변경하려면 **PUBLISH APP** 클릭

## 현재 OAuth 클라이언트 정보
- **Client ID**: `377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com`
- **Client Secret**: `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`
- **프로젝트 ID**: 새로 생성한 프로젝트 (Firebase와 분리됨)

## 주의사항
- App name 변경 후 즉시 반영되지 않을 수 있음 (캐시로 인해 최대 몇 시간 소요)
- 로그인 화면에서 "vercel.app"이 아닌 "광주 게임플라자"로 표시됨
- 발행 상태가 "Testing"이면 100명 이하의 테스트 사용자만 로그인 가능