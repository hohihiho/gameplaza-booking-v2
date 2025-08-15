# 🌿 브랜치 전략 가이드

## 📊 브랜치 구조

```
main (프로덕션)
├── develop (개발 통합)
│   ├── feature/notification-system (알림 시스템)
│   ├── feature/admin-dashboard (관리자 대시보드)
│   ├── feature/statistics-report (통계 리포트)
│   └── feature/user-profile (사용자 프로필)
├── fix/* (버그 수정)
└── hotfix/* (긴급 수정)
```

## 🚀 생성된 브랜치

### 1. **develop**
- 개발 통합 브랜치
- 모든 기능 브랜치가 머지되는 곳
- 테스트 완료 후 main으로 머지

### 2. **feature/notification-system**
- 예약 알림 기능
- 푸시 알림, 이메일 알림
- 예약 리마인더

### 3. **feature/admin-dashboard**
- 관리자 대시보드
- 실시간 모니터링
- 사용자 관리

### 4. **feature/statistics-report**
- 통계 및 리포트
- 이용 현황 분석
- 데이터 시각화

### 5. **feature/user-profile**
- 사용자 프로필 페이지
- 예약 히스토리
- 설정 관리

## 💻 사용 방법

### 새 기능 개발 시작
```bash
# develop 브랜치에서 시작
git checkout develop
git pull origin develop

# 기능 브랜치로 이동
git checkout feature/notification-system

# 작업 후 커밋
git add .
git commit -m "feat: 알림 기능 구현"

# 푸시
git push origin feature/notification-system
```

### PR(Pull Request) 생성
1. GitHub에서 PR 생성
2. `feature/* → develop` 머지
3. 코드 리뷰
4. 테스트 통과 후 머지

### 프로덕션 배포
```bash
# develop 테스트 완료 후
git checkout main
git merge develop
git push origin main
# → Vercel 자동 배포
```

## 🔄 브랜치 라이프사이클

1. **feature 브랜치 생성** → 기능 개발
2. **develop에 PR** → 통합 테스트
3. **main에 머지** → 프로덕션 배포
4. **브랜치 삭제** → 완료된 feature 정리

## ⚡ 긴급 수정 (Hotfix)

```bash
# main에서 직접 생성
git checkout main
git checkout -b hotfix/critical-bug

# 수정 후 main과 develop에 모두 머지
git checkout main
git merge hotfix/critical-bug

git checkout develop
git merge hotfix/critical-bug
```

## 🎯 Vercel Preview 배포

각 브랜치는 자동으로 Preview URL 생성:
- `develop` → `gameplaza-v2-develop.vercel.app`
- `feature/admin-dashboard` → `gameplaza-v2-feature-admin-dashboard.vercel.app`

## 📝 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드 업무, 패키지 매니저 설정
```

## 🚨 주의사항

1. **main 브랜치에 직접 푸시 금지** (hotfix 제외)
2. **develop 브랜치는 항상 배포 가능한 상태 유지**
3. **feature 브랜치는 작은 단위로 자주 커밋**
4. **PR 전 충돌 해결 필수**
5. **머지 후 브랜치 삭제**