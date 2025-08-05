# 🛠️ 게임플라자 자동화 도구들

개발 중 자주 발생하는 문제들을 자동으로 해결하는 도구들입니다.

## 🚀 빠른 시작

### 1. 개발 서버 자동 재시작
```bash
# npm 스크립트로 실행 (추천)
npm run dev:auto

# 또는 직접 실행
./scripts/auto-dev.sh
```

**기능:**
- 3000번 포트 충돌 자동 해결
- 서버 크래시 시 자동 재시작 (최대 5회)
- 실시간 로그 및 상태 표시

### 2. 원클릭 문제 해결
```bash
# 인터랙티브 메뉴
npm run fix

# 전체 자동 수정
npm run fix:all

# 개별 수정
npm run fix:port    # 포트 충돌만
npm run fix:cache   # 캐시 정리만
npm run fix:deps    # 의존성 재설치만
```

**자동 수정 항목:**
- ✅ 포트 3000 충돌 해결
- ✅ Next.js/TypeScript 캐시 정리
- ✅ ESLint 자동 수정
- ✅ Prettier 코드 포맷팅
- ✅ 환경 변수 검증
- ✅ Git 상태 정리
- ✅ 디스크 공간 확인

### 3. 오류 자동 분석
```bash
# 실시간 오류 모니터링
npm run error:track

# 최근 오류 로그 확인
npm run error:recent

# 특정 오류 분석
node scripts/error-tracker.js analyze "오류 메시지를 여기에"
```

**지원하는 오류 유형:**
- 🔧 포트 충돌 (EADDRINUSE) → 자동 해결
- 📦 모듈 없음 (MODULE_NOT_FOUND) → 자동 설치
- 🎨 ESLint 오류 → 자동 수정
- 🔐 Supabase 연결 오류 → 설정 검증
- 📝 TypeScript 오류 → 해결책 제안

## 📋 사용 시나리오

### 시나리오 1: 개발 서버가 자꾸 죽을 때
```bash
# 기존 방식: 매번 수동으로...
lsof -ti:3000 | xargs kill -9
npm run dev

# 새로운 방식: 한 번만 실행
npm run dev:auto
```

### 시나리오 2: 빌드 오류가 발생했을 때
```bash
# 1. 전체 자동 수정 실행
npm run fix:all

# 2. 개발 서버 재시작
npm run dev
```

### 시나리오 3: 복잡한 오류 메시지가 나왔을 때
```bash
# 오류 메시지를 복사해서 붙여넣기
npm run error:track
# 터미널에 오류 메시지 붙여넣기 → 자동 분석 및 해결책 제안
```

### 시나리오 4: 새로운 패키지 설치 후 문제가 생겼을 때
```bash
# 캐시와 의존성 완전 초기화
npm run fix:deps
npm run fix:cache
```

## 🔍 도구별 상세 설명

### auto-dev.sh
**목적:** 개발 서버 자동 관리  
**특징:**
- 포트 충돌 자동 감지 및 해결
- 서버 크래시 모니터링
- 최대 5회 자동 재시작
- 컬러풀한 로그 출력

**사용법:**
```bash
./scripts/auto-dev.sh
# 또는
npm run dev:auto
```

### quick-fix.sh
**목적:** 일반적인 개발 문제 원클릭 해결  
**특징:**
- 인터랙티브 메뉴 제공
- 개별 수정 가능
- 안전한 Git stash 기능
- 환경 설정 검증

**사용법:**
```bash
# 메뉴 방식
./scripts/quick-fix.sh

# 명령어 방식
./scripts/quick-fix.sh [port|deps|cache|ts|lint|format|git|env|disk|all]
```

### error-tracker.js
**목적:** 오류 자동 분석 및 해결책 제안  
**특징:**
- 실시간 오류 모니터링
- 오류 패턴 자동 인식
- 자동 수정 기능 (가능한 경우)
- 상세한 로그 기록

**사용법:**
```bash
# 실시간 모니터링
node scripts/error-tracker.js

# 로그 확인
node scripts/error-tracker.js recent [개수]

# 오류 분석
node scripts/error-tracker.js analyze "오류 메시지"
```

## 🎯 일일 개발 워크플로우

### 개발 시작 시
```bash
# 1. 환경 정리 및 확인
npm run fix:all

# 2. 자동 개발 서버 시작
npm run dev:auto
```

### 오류 발생 시
```bash
# 1. 오류 분석 (터미널 따로 열어서)
npm run error:track

# 2. 오류 메시지 붙여넣기 → 자동 분석

# 3. 제안된 해결책 적용 또는 자동 수정 실행
```

### 작업 종료 시
```bash
# Git 상태 정리 (필요시)
npm run fix git

# 또는 전체 정리
npm run fix:all
```

## 🔧 커스터마이징

### 새로운 오류 패턴 추가
`scripts/error-tracker.js`의 `errorPatterns` 객체에 추가:

```javascript
'NEW_ERROR_TYPE': {
  pattern: /새로운 오류 패턴 정규식/,
  solution: '해결 방법 설명',
  autoFix: (match) => this.customFixFunction(match)
}
```

### 자동 수정 기능 추가
`scripts/quick-fix.sh`에 새로운 함수 추가:

```bash
fix_custom_issue() {
    info "🔧 커스텀 문제 해결 중"
    # 해결 로직
    log "✅ 커스텀 문제 해결 완료"
}
```

## 📊 로그 및 모니터링

모든 도구들은 다음 위치에 로그를 저장합니다:
- `logs/error-tracker.log` - 오류 분석 로그
- `logs/auto-dev.log` - 개발 서버 로그 (선택적)

## 🚨 문제 해결

### 스크립트가 실행되지 않을 때
```bash
# 실행 권한 확인
ls -la scripts/

# 권한 부여
chmod +x scripts/*.sh
chmod +x scripts/*.js
```

### Node.js 모듈 에러
```bash
# 의존성 재설치
npm run fix:deps
```

### 포트 충돌이 계속 발생할 때
```bash
# 수동으로 모든 Node 프로세스 종료
pkill -f node
npm run fix:port
```

## 💡 팁

1. **개발 시작 시 항상 `npm run dev:auto` 사용**
2. **오류 발생 시 우선 `npm run fix:all` 실행**
3. **복잡한 오류는 `error-tracker`로 분석 후 해결**
4. **정기적으로 캐시 정리 (`npm run fix:cache`)**
5. **환경 변수 변경 후 `npm run fix env`로 검증**

---

이 도구들로 개발 시 발생하는 반복적인 문제들을 자동화하여 더 생산적인 개발에 집중하세요! 🚀