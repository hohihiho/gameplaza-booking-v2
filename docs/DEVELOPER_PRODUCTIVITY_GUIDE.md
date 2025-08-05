# 🚀 개발자 생산성 도구 가이드

개발 효율성을 극대화하는 자동화 도구들입니다!

## 🎯 빠른 시작

### 전체 도구 목록 보기
```bash
npm run dev:tools
```

### 핵심 6대 도구
```bash
npm run git:smart      # 🌿 스마트 Git 워크플로우
npm run review:ai      # 🤖 AI 코드 리뷰
npm run dashboard      # 📊 실시간 개발 대시보드
npm run test:generate  # 🧪 테스트 자동 생성
npm run docs:generate  # 📚 문서 자동 생성
npm run deploy         # 🚀 스마트 배포 파이프라인
```

---

## 🛠️ 도구별 상세 가이드

### 1. 🌿 스마트 Git 워크플로우

**용도**: Git 작업을 자동화하여 일관성 있는 워크플로우 제공

#### 기본 사용법
```bash
# 대화형 메뉴
npm run git:smart

# 개별 기능
npm run git:branch     # 브랜치 생성
npm run git:commit     # 스마트 커밋
npm run git:pr         # PR 생성
```

#### 주요 기능
- ✅ **브랜치 자동 명명**: `feature/2025-01-22-user-auth` 형식
- ✅ **커밋 메시지 자동 생성**: 변경사항 분석하여 의미 있는 메시지 생성
- ✅ **PR 자동 생성**: 제목과 본문 자동 생성 (GitHub CLI 필요)
- ✅ **변경사항 분석**: 추가/수정/삭제된 파일 자동 분석

#### 워크플로우 예시
```bash
# 1. 새 기능 개발 시작
npm run git:branch
> "feature" 선택
> "사용자 인증 시스템" 입력
> ✅ feature/2025-01-22-user-auth 브랜치 생성

# 2. 코드 작성 후 커밋
npm run git:commit
> 변경사항 자동 분석
> "feat: 사용자 인증 컴포넌트 추가" 자동 생성
> ✅ 스마트 커밋 완료

# 3. PR 생성
npm run git:pr
> PR 제목/본문 자동 생성
> ✅ GitHub PR 생성 완료
```

---

### 2. 🤖 AI 코드 리뷰어

**용도**: 코드 품질, 보안, 성능을 자동으로 분석하고 개선사항 제안

#### 사용법
```bash
# 현재 브랜치와 main 비교하여 리뷰
npm run review:ai

# 특정 브랜치와 비교
npm run review:ai develop
```

#### 검사 항목
- 🔐 **보안 검사**: SQL Injection, XSS, 민감정보 노출 등
- ⚡ **성능 검사**: 비효율적인 반복문, DOM 조회 등
- ✨ **코드 품질**: 함수 길이, TODO/FIXME, var 사용 등
- ⚛️ **React 특화**: useEffect, useState 패턴 등
- 🔄 **Next.js 특화**: Image, Link 컴포넌트 사용 등

#### 리뷰 결과
- 📄 **마크다운 보고서**: `docs/code-review-report.md`에 저장
- 🏆 **품질 점수**: 0-100점으로 코드 품질 평가
- 💡 **구체적 제안**: 파일별, 라인별 개선 방법 제시

#### 실제 사용 예시
```bash
npm run review:ai

# 출력 예시:
🤖 AI 코드 리뷰 보고서

📊 요약
- 리뷰된 파일: 12개
- 발견된 이슈: 8개  
- 심각한 이슈: 2개
- 코드 품질 점수: 75/100

🔍 발견된 이슈
🚨 이슈 #1
파일: `app/login/page.tsx:45`
문제: 비밀번호가 콘솔에 로그될 수 있습니다
제안: console.log에서 민감한 정보를 제거하세요

💡 개선 제안
🚨 긴급 수정 필요
2개의 심각한 보안 이슈가 발견되었습니다.
```

---

### 3. 📊 실시간 개발 대시보드

**용도**: 개발 진행률, 에러, 성능을 실시간으로 모니터링

#### 사용법
```bash
npm run dashboard
# 자동으로 브라우저에서 http://localhost:3001 열림
```

#### 대시보드 구성
1. **📈 개발 진행률**
   - 전체/완료 파일 수
   - 진행률 %
   - TODO/FIXME 개수

2. **🚨 에러 현황**
   - TypeScript 에러
   - ESLint 경고
   - 최근 에러 로그

3. **⚡ 성능 지표**
   - 빌드 시간
   - 테스트 실행 시간
   - 번들 크기
   - 메모리 사용량

4. **🌿 Git 현황**
   - 현재 브랜치
   - 오늘 커밋 수
   - 미커밋 변경사항
   - 마지막 커밋

5. **✨ 코드 품질**
   - 테스트 커버리지
   - 코드 복잡도
   - 중복 코드 수
   - 유지보수성 지수

#### 실시간 기능
- 🔄 **자동 업데이트**: 파일 변경 시 자동으로 메트릭 업데이트
- 📡 **WebSocket 연결**: 실시간 데이터 동기화
- 👀 **파일 감시**: 코드 변경 시 5초 후 자동 분석

---

### 4. 🧪 테스트 자동 생성

**용도**: 컴포넌트, API, 유틸리티 함수에 대한 테스트를 자동으로 생성

#### 사용법
```bash
# 변경된 파일들의 테스트 자동 생성 및 실행
npm run test:generate

# 테스트 생성만 (실행하지 않음)
npm run test:generate:only
```

#### 지원하는 테스트 유형
- ⚛️ **React 컴포넌트**: 렌더링, Props, 상호작용 테스트
- 🌐 **API 라우트**: GET/POST/PUT/DELETE 요청/응답 테스트
- 📄 **Next.js 페이지**: 라우팅, 데이터 로딩 테스트
- 🔧 **유틸리티 함수**: 정상/경계/에러 케이스 테스트

#### 생성되는 테스트 파일
- 컴포넌트: `__tests__/ComponentName.test.tsx`
- API: `__tests__/api-name.api.test.js`  
- 페이지: `__tests__/page-name.page.test.tsx`
- 유틸: `__tests__/util-name.util.test.js`

#### 테스트 보고서
- 📄 **상세 보고서**: `docs/test-generation-report.md`
- 📊 **커버리지 분석**: 자동 생성 및 개선점 제안
- 💡 **TODO 완성 가이드**: 생성된 테스트의 완성 방법

---

### 5. 📚 문서 자동 생성

**용도**: API, 컴포넌트, 타입 정의의 문서를 자동으로 생성

#### 사용법
```bash
# 변경된 파일들의 문서 자동 생성
npm run docs:generate

# 문서 서버 시작 (포트 3003)
npm run docs:serve
```

#### 생성되는 문서 유형

1. **📡 API 문서**
   - 엔드포인트별 상세 문서
   - 요청/응답 예시
   - cURL, JavaScript 사용법

2. **⚛️ 컴포넌트 문서**
   - Props 테이블
   - 사용법 예시
   - Storybook 스토리 자동 생성

3. **📋 TypeScript 타입 문서**
   - 인터페이스, 타입, 열거형
   - 속성별 상세 설명
   - 사용 예시

#### 문서 구조
```
docs/auto-generated/
├── README.md           # 전체 인덱스
├── api/               # API 문서들
├── components/        # 컴포넌트 문서들
└── types/            # 타입 문서들
```

#### Storybook 통합
- 컴포넌트 발견 시 자동으로 Storybook 스토리 생성
- `stories/ComponentName.stories.ts` 파일 생성
- 다양한 Props 시나리오 포함

---

### 6. 🚀 스마트 배포 파이프라인

**용도**: 자동화된 빌드, 테스트, 배포 프로세스

#### 사용법
```bash
# 배포 환경 목록 확인
npm run deploy:list

# 개발 환경 배포 (자동)
npm run deploy:dev

# 스테이징 환경 배포 (승인 불필요)
npm run deploy:staging  

# 프로덕션 환경 배포 (승인 필요)
npm run deploy:prod
```

#### 배포 단계
1. **🔍 사전 검사**
   - Git 상태, Node.js 버전
   - 환경 변수, 디스크 공간

2. **📦 종속성 설치**
   - npm ci 또는 npm install

3. **🔍 코드 품질 검사**
   - ESLint, TypeScript 검사
   - 테스트 실행 (환경별)

4. **🔐 보안 검사**
   - npm audit
   - 하드코딩된 시크릿 검사

5. **🏗️ 빌드**
   - Next.js 빌드
   - 빌드 시간/크기 측정

6. **⚡ 성능 검사**
   - 번들 크기 분석
   - 성능 지표 확인

7. **🚀 배포**
   - 환경별 배포 실행

8. **🔍 배포 후 검사**
   - URL 접근성 확인
   - 빌드 파일 검증

#### 환경별 설정

| 환경 | 자동 모드 | 테스트 필요 | 승인 필요 |
|------|-----------|-------------|-----------|
| Development | ✅ | ❌ | ❌ |
| Staging | ❌ | ✅ | ❌ |
| Production | ❌ | ✅ | ✅ |

#### 배포 보고서
- 📄 **상세 보고서**: `docs/deployment-report.md`
- ⏱️ **단계별 소요 시간**: 성능 최적화 가이드
- ⚠️ **경고/오류 사항**: 문제 해결 방법 제시

---

## 🔄 통합 워크플로우

### 일일 개발 루틴

#### 🌅 개발 시작 시
```bash
# 1. 대시보드 실행 (백그라운드)
npm run dashboard &

# 2. 환경 정리
npm run fix:all

# 3. 자동 개발 서버 시작
npm run dev:auto
```

#### 💻 개발 중
```bash
# 기능 개발 시작
npm run git:branch

# 코드 작성...

# 테스트 자동 생성
npm run test:generate

# 중간 점검
npm run review:ai

# 문서 생성
npm run docs:generate

# 커밋
npm run git:commit
```

#### 🏁 개발 완료 시
```bash
# 최종 리뷰
npm run review:ai

# 테스트 및 문서 최종 검토
npm run test:generate
npm run docs:generate

# PR 생성
npm run git:pr

# 개발 환경 배포 테스트
npm run deploy:dev

# 정리
npm run fix:all
```

#### 🚀 배포 단계
```bash
# 스테이징 배포
npm run deploy:staging

# 스테이징 환경 검증 후

# 프로덕션 배포 (승인 필요)
npm run deploy:prod
```

### 🚨 문제 발생 시 대응

#### 에러 발생
```bash
# 1. 자동 분석
npm run error:track
# (에러 메시지 붙여넣기)

# 2. 자동 수정 시도
npm run fix:all

# 3. 대시보드에서 상태 확인
npm run dashboard
```

#### 성능 이슈
```bash
# 1. AI 리뷰로 성능 문제 찾기
npm run review:ai

# 2. 대시보드에서 성능 지표 모니터링
npm run dashboard

# 3. 빌드 최적화
npm run build
```

---

## 🎛️ 커스터마이징

### AI 리뷰어 규칙 추가
`scripts/ai-code-reviewer.js`의 `reviewRules` 객체에 새 규칙 추가:

```javascript
security: [
  {
    pattern: /your-pattern/gi,
    severity: 'high',
    message: '문제 설명',
    suggestion: '개선 방안'
  }
]
```

### 대시보드 메트릭 추가
`scripts/dev-dashboard.js`의 메트릭 업데이트 함수 수정:

```javascript
async updateCustomMetrics() {
  // 새로운 메트릭 수집 로직
  this.metrics.custom = {
    // 새 메트릭들
  };
}
```

### Git 워크플로우 커스터마이징
`scripts/smart-git.js`의 `branchTypes`, `commitTypes` 수정:

```javascript
branchTypes: {
  'feature': '새로운 기능',
  'hotfix': '긴급 수정',
  'custom': '커스텀 타입'  // 추가
}
```

---

## 📈 성과 측정

### 생산성 지표
- ⏱️ **개발 시간 단축**: 자동화로 반복 작업 시간 절약
- 🐛 **버그 감소**: AI 리뷰로 사전에 이슈 발견
- 📊 **코드 품질 향상**: 일관된 코딩 표준 적용
- 🔄 **워크플로우 표준화**: 팀 전체 동일한 프로세스

### 실제 효과 (예상)
- Git 작업 시간: **70% 단축** (수동 → 자동화)
- 코드 리뷰 시간: **50% 단축** (사전 AI 검토)
- 버그 발견율: **30% 향상** (자동 분석)
- 개발 집중도: **향상** (반복 작업 자동화)

---

## 🔧 문제 해결

### 자주 발생하는 문제

#### GitHub CLI 없음
```bash
# GitHub CLI 설치
brew install gh
# 또는
npm install -g @github/cli

# 인증
gh auth login
```

#### WebSocket 연결 실패
```bash
# 포트 확인
lsof -i :3002

# 방화벽 확인
# macOS: 시스템 환경설정 > 보안 및 개인정보보호 > 방화벽
```

#### 권한 오류
```bash
# 스크립트 권한 부여
chmod +x scripts/*.js
chmod +x scripts/*.sh
```

---

## 💡 팁 & 트릭

### 1. 키보드 단축키 설정
`.bashrc` 또는 `.zshrc`에 알리아스 추가:

```bash
alias gs="npm run git:smart"
alias gr="npm run review:ai"  
alias gd="npm run dashboard"
alias gf="npm run fix:all"
```

### 2. VS Code 통합
`.vscode/tasks.json`에 작업 추가:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Smart Git",
      "type": "shell", 
      "command": "npm run git:smart",
      "group": "build"
    }
  ]
}
```

### 3. 자동 실행 설정
개발 시작 시 자동으로 도구들 실행:

```bash
# package.json의 dev 스크립트 수정
"dev": "npm run dashboard & npm run dev:auto"
```

---

## 🎯 결론

이 생산성 도구들로:
- **반복 작업 자동화** → 개발에만 집중
- **코드 품질 자동 관리** → 버그 사전 방지  
- **실시간 모니터링** → 문제 조기 발견
- **일관된 워크플로우** → 팀 협업 효율성 향상

**개발이 즐거워집니다!** 🚀✨