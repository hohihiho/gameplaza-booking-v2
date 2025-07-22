# /commit - 스마트 커밋

현재 변경사항을 분석하여 적절한 커밋 메시지와 함께 커밋합니다.

## 실행 과정

### 1. Git 상태 분석
```bash
# 현재 상태 확인
git status

# 변경사항 확인
git diff
git diff --staged
```

### 2. 변경 사항 분류 및 요약
변경사항을 다음 카테고리로 분류:
- **feat**: 새로운 기능 추가
- **fix**: 버그 수정
- **docs**: 문서 변경
- **style**: 코드 포맷팅, 세미콜론 누락 등
- **refactor**: 코드 리팩토링
- **test**: 테스트 추가/수정
- **chore**: 빌드 과정, 보조 도구 변경

### 3. 커밋 메시지 생성 (한국어)
```
[타입] 간단명료한 제목

- 주요 변경사항 1
- 주요 변경사항 2
- 주요 변경사항 3

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### 4. 관련 이슈 연결
- GitHub 이슈 번호가 있다면 연결
- 관련 PR이나 문서 링크 추가

### 5. 커밋 실행
```bash
git add .
git commit -m "$(cat <<'EOF'
[feat] 예약 시스템 실시간 동기화 기능 추가

- Supabase 실시간 구독으로 예약 상태 동기화
- 중복 예약 방지 로직 강화
- 모바일 UI에서 실시간 상태 표시 개선

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## 커밋 메시지 가이드라인

### 제목 작성 규칙
- 50자 이내로 작성
- 명령문으로 작성 (예: "추가했음" ❌, "추가" ✅)
- 첫 글자는 소문자
- 마침표 사용 안 함

### 본문 작성 규칙
- 72자마다 줄바꿈
- 무엇을 변경했는지보다 왜 변경했는지 설명
- 여러 변경사항이 있으면 불릿 포인트 사용

### 게임플라자 특화 키워드
- **예약**: 예약 시스템 관련
- **모바일**: 모바일 최적화 관련
- **KST**: 시간대 처리 관련
- **실시간**: 실시간 동기화 관련
- **관리자**: 관리자 기능 관련

## 자동 검증

### 커밋 전 체크리스트
- [ ] 테스트가 통과하는가?
- [ ] 린트 에러가 없는가?
- [ ] 타입 체크가 통과하는가?
- [ ] 민감한 정보가 포함되지 않았는가?

### 실행 명령어
```bash
# 테스트 실행
npm test

# 린트 체크
npm run lint

# 타입 체크
npx tsc --noEmit

# 빌드 테스트
npm run build
```

## 커밋 메시지 예시

### 기능 추가
```
[feat] 24시간 예약 시스템 UI 구현

- 새벽 시간(0~5시)을 24~29시로 표시
- 모바일 터치 인터페이스 최적화
- KST 시간대 기준 예약 로직 적용

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### 버그 수정
```
[fix] 예약 충돌 방지 로직 오류 수정

- 동일 시간대 중복 예약 허용 문제 해결
- 실시간 동기화 시 상태 불일치 문제 수정
- 모바일에서 터치 이벤트 중복 실행 방지

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### 리팩토링
```
[refactor] 시간 처리 유틸리티 함수 개선

- KST 시간 변환 로직을 공통 함수로 분리
- 24시간 표시 체계 일관성 개선
- 타입 안전성 강화

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## 주의사항

1. **단일 책임**: 하나의 커밋은 하나의 논리적 변경사항만 포함
2. **원자성**: 커밋은 완전하고 독립적인 변경사항이어야 함
3. **추적성**: 나중에 이 커밋을 찾기 쉽도록 명확한 제목 작성
4. **한국어 우선**: 모든 커밋 메시지는 한국어로 작성