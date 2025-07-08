# Firebase 전화번호 인증 설정 가이드

## 1. Firebase Console 설정

### 1.1 Authentication 활성화
1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 선택
2. 왼쪽 메뉴에서 "Authentication" 클릭
3. "Sign-in method" 탭 선택
4. "전화번호" 인증 방법 활성화

### 1.2 도메인 승인
1. Authentication > Settings > Authorized domains
2. 다음 도메인들 추가:
   - `localhost` (개발용)
   - `gameplaza-kr0.firebaseapp.com` (기본)
   - 실제 서비스 도메인 (예: `gameplaza.kr`)

### 1.3 reCAPTCHA 설정
1. Firebase는 기본적으로 invisible reCAPTCHA 사용
2. 테스트를 위해 Authentication > Settings > App verification에서 테스트 전화번호 추가 가능
   - 예: `+821012345678` / 인증코드: `123456`

## 2. Firebase Admin SDK 설정

### 2.1 서비스 계정 키 생성
1. Firebase Console > 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드

### 2.2 환경변수 설정
다운로드한 JSON 파일에서 다음 정보를 `.env.local`에 추가:
```env
FIREBASE_PROJECT_ID=gameplaza-kr0
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@gameplaza-kr0.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 3. 클라이언트 설정

`.env.local` 파일에 다음 추가:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCmUu1gBrvxAFfQbCwToKIraFgEdBGIt6o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gameplaza-kr0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gameplaza-kr0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gameplaza-kr0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=44559014883
NEXT_PUBLIC_FIREBASE_APP_ID=1:44559014883:web:edab1727ac2d7a965cded6
```

## 4. 테스트 방법

### 4.1 개발 환경에서 테스트
1. Firebase Console에서 테스트 전화번호 추가
2. 회원가입 페이지에서 테스트 전화번호로 인증 시도
3. 설정한 테스트 인증코드 입력

### 4.2 실제 SMS 테스트
1. 실제 전화번호로 인증 시도
2. SMS로 받은 6자리 코드 입력
3. 일일 한도: 무료 플랜은 일일 10건으로 제한

## 5. 주의사항

1. **보안**: 
   - `FIREBASE_PRIVATE_KEY`는 절대 공개 저장소에 커밋하지 마세요
   - `.env.local` 파일은 `.gitignore`에 포함되어 있는지 확인

2. **요금**:
   - 무료: 일일 10건
   - 유료: 건당 약 $0.01 (지역별 상이)

3. **제한사항**:
   - 동일 번호로 시간당 5회 제한
   - 동일 IP로 시간당 20회 제한

## 6. 문제 해결

### reCAPTCHA 오류
- 도메인이 승인 목록에 있는지 확인
- HTTPS 환경에서만 작동 (localhost는 예외)

### SMS 미수신
- 전화번호 형식 확인 (+821012345678)
- Firebase Console에서 SMS 발송 로그 확인
- 일일 한도 초과 여부 확인

### 인증 실패
- Firebase Console에서 인증 로그 확인
- 6분 이내에 인증코드 입력했는지 확인