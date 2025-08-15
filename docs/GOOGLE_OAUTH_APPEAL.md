# Google OAuth 검토 이의 제기 가이드

## 이의 제기 방법

### 1. Google Cloud Support 케이스 생성
https://console.cloud.google.com/support/cases

### 2. 이의 제기 내용 (복사해서 사용)

**제목**: OAuth 동의 화면 검토 오류 - 잘못된 거부 사유에 대한 이의 제기

**내용**:
```
안녕하세요,

OAuth 동의 화면 검토에서 부당한 거부를 받아 이의를 제기합니다.

## 거부 사유:
1. "홈페이지에 개인정보처리방침 링크가 없습니다"
2. "개인정보처리방침 URL이 홈페이지 URL과 동일합니다"

## 실제 설정 (Google Cloud Console):
- 애플리케이션 홈페이지: https://www.gameplaza.kr
- 개인정보처리방침: https://www.gameplaza.kr/privacy
- 서비스 약관: https://www.gameplaza.kr/terms

## 증명:
1. 홈페이지(https://www.gameplaza.kr)에 접속하면 하단 Footer에 개인정보처리방침 링크가 명확히 표시됩니다.

2. 개인정보처리방침 페이지(https://www.gameplaza.kr/privacy)는 독립된 페이지로 다음 내용을 포함합니다:
   - 수집하는 개인정보 항목 (Google OAuth 포함)
   - 개인정보 사용 목적
   - 보유 기간
   - 제3자 제공 정책
   - 사용자 권리
   - 연락처 정보

3. 모든 URL이 정상 작동하며 404 에러 없음

## 요청사항:
검토 결과가 명백히 잘못되었으므로 재검토를 요청합니다.

Client ID: 377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com

감사합니다.
```

### 3. 첨부할 스크린샷 (필수!)

1. **OAuth 동의 화면 설정 페이지**
   - URL 섹션이 보이도록
   - 각 URL이 다름을 증명

2. **홈페이지 전체 스크린샷**
   - Footer의 개인정보처리방침 링크가 보이도록
   - URL 바에 https://www.gameplaza.kr 표시

3. **개인정보처리방침 페이지**
   - URL 바에 https://www.gameplaza.kr/privacy 표시
   - 내용이 보이도록

4. **브라우저 개발자 도구**
   - Footer HTML 코드에서 `href="/privacy"` 부분 하이라이트

## 추가 옵션

### A. OAuth Verification Request Form
https://support.google.com/cloud/contact/oauth_app_verification
- "Appeal a decision" 선택
- 위 내용과 스크린샷 제출

### B. Google Groups에 문의
https://groups.google.com/g/oauth2-dev
- 공개적으로 문제 제기
- 다른 개발자들의 지원 받기

### C. Twitter/X에서 Google Cloud에 멘션
- @GoogleCloud 계정에 문제 제기
- 공개적 압박으로 빠른 해결 유도

## 예상 소요 시간
- Support 케이스: 2-3일
- 재검토: 1-2일
- 총 3-5일

## 임시 해결책 (즉시 필요한 경우)

새 OAuth 클라이언트를 테스트 모드로 생성:
1. 새 OAuth 클라이언트 ID 생성
2. 테스트 모드 설정
3. 테스트 사용자 100명 추가
4. 환경 변수 교체

이렇게 하면 검토 대기 없이 즉시 사용 가능합니다.