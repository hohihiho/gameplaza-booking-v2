# 🚀 게임플라자 고급 AI 도구 사용 가이드

> 📅 **최종 업데이트**: 2025년 1월 22일
> 🔄 **주요 변경사항**: Headless PM 제거, 아키텍처 개선 사항 반영

이 문서는 게임플라자 프로젝트에 통합된 모든 고급 AI 도구들의 설치, 설정, 사용법을 상세히 설명합니다.

## 📋 목차

1. [시스템 개요](#-시스템-개요)
2. [MCP 서버 시스템](#-mcp-서버-시스템)
3. [SuperClaude Framework](#-superclaude-framework)
4. [통합 워크플로우](#-통합-워크플로우)
5. [문제 해결](#-문제-해결)

---

## 🎯 시스템 개요

### 통합된 AI 도구 스택

```
┌─────────────────────────────────────────────────┐
│            Claude Code (메인 인터페이스)           │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              MCP 서버 시스템 (7개)               │
│  ├── Shrimp Task Manager (작업 관리)            │
│  ├── Context7 (최신 문서 검색)                   │
│  ├── Supabase (데이터베이스 관리)                │
│  ├── Sequential Thinking (체계적 사고)           │
│  ├── Filesystem (파일 관리)                     │
│  ├── Playwright (브라우저 자동화)                │
│  └── Memory (지속적 메모리)                      │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           SuperClaude Framework                 │
│  ├── /think - 체계적 사고 모드                  │
│  ├── /research - 기술 조사 모드                 │
│  ├── /automate - 브라우저 자동화                │
│  └── /remember - 프로젝트 메모리                │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         에이전트 페르소나 시스템                  │
│  ├── Frontend Developer                        │
│  ├── Backend Developer                         │
│  ├── UI/UX Designer                           │
│  ├── Security Expert                          │
│  ├── QA Engineer                              │
│  ├── Architect (SuperClaude)                  │
│  └── Scribe (SuperClaude)                      │
└─────────────────────────────────────────────────┘
```

### 핵심 기능
- **🧠 체계적 사고**: Sequential Thinking으로 복잡한 문제 단계별 해결
- **📚 최신 정보**: Context7으로 실시간 기술 문서 검색
- **🤖 자동화**: Playwright로 브라우저/모바일 테스트 자동화
- **💾 지속성**: Memory MCP로 프로젝트 컨텍스트 유지
- **👥 협업**: 에이전트 페르소나 시스템으로 전문가 모드 활용
- **📊 관리**: Shrimp Task Manager로 체계적 작업 추적

---

## 🔧 MCP 서버 시스템

### 현재 설치된 MCP 서버들 (7개)

#### 1. **Shrimp Task Manager** ⭐⭐⭐⭐⭐
```json
// 위치: ~/.claude/claude_desktop_config.json
"shrimp-task-manager": {
  "command": "node",
  "args": ["/Users/seeheejang/Library/Application Support/Claude/mcp-shrimp-task-manager/dist/index.js"],
  "env": {
    "LANGUAGE": "ko",
    "WEB_PORT": "7001", 
    "ENABLE_GUI": "true",
    "THEME": "auto"
  }
}
```

**기능**: 
- 작업 생성, 추적, 완료 관리
- 한국어 인터페이스
- 웹 GUI (http://localhost:7001)
- 프로젝트 계획 및 분석

**사용법**:
```bash
# Claude Code에서 직접 사용
"새로운 기능 개발을 위한 작업 계획을 세워줘"
"현재 진행 중인 작업들을 보여줘"
"이 작업을 완료로 표시해줘"
```

#### 2. **Context7** ⭐⭐⭐⭐⭐
```json
"context7": {
  "command": "npx",
  "args": ["-y", "@context7/mcp-server@latest"]
}
```

**기능**:
- 최신 라이브러리 문서 검색
- 코드 예시 및 베스트 프랙티스
- 실시간 기술 정보 업데이트

**사용법**:
```bash
# Claude Code에서
"Next.js 14 모바일 최적화 방법을 Context7에서 검색해줘"
"React 실시간 구독 패턴의 최신 문서를 찾아줘"
```

#### 3. **Supabase MCP** ⭐⭐⭐⭐
```json
"supabase": {
  "command": "npx",
  "args": ["@supabase/mcp-server@latest"],
  "env": {
    "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}",
    "SUPABASE_PROJECT_REF": "${SUPABASE_PROJECT_REF}"
  }
}
```

**기능**:
- 데이터베이스 스키마 관리
- SQL 쿼리 실행
- 실시간 구독 설정
- RLS 정책 관리

**사용법**:
```bash
# Claude Code에서
"Supabase에서 예약 테이블의 구조를 확인해줘"
"새로운 마이그레이션을 생성해줘"
```

#### 4. **Sequential Thinking** ⭐⭐⭐⭐
```json
"sequential-thinking": {
  "command": "/Users/seeheejang/.claude/mcp-sequential-thinking/venv/bin/python",
  "args": ["-m", "sequential_thinking"],
  "env": {
    "PYTHONPATH": "/Users/seeheejang/.claude/mcp-sequential-thinking"
  }
}
```

**기능**:
- 5단계 체계적 사고 프로세스
- 복잡한 문제 단계별 분해
- 사고 과정 추적 및 요약

**사용법**:
```bash
# /think 슬래시 명령어로 사용
/think "예약 시스템의 동시 접속 충돌 해결 방안"
```

#### 5. **Filesystem MCP** ⭐⭐⭐⭐
```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y", "@modelcontextprotocol/server-filesystem",
    "/Users/seeheejang/Documents/project",
    "/Users/seeheejang/.claude",
    "/Users/seeheejang/Desktop"
  ]
}
```

**기능**:
- 파일 시스템 직접 접근
- 프로젝트 구조 분석
- 파일 내용 검색 및 수정

#### 6. **Playwright MCP** ⭐⭐⭐⭐
```json
"playwright": {
  "command": "npx",
  "args": ["-y", "@playwright/mcp"]
},
"playwright-advanced": {
  "command": "npx", 
  "args": ["-y", "@executeautomation/playwright-mcp-server"]
}
```

**기능**:
- 브라우저 자동화 테스트
- 모바일 디바이스 시뮬레이션
- E2E 테스트 시나리오 실행

**사용법**:
```bash
# /automate 슬래시 명령어로 사용
/automate
```

#### 7. **Memory MCP** ⭐⭐⭐
```json
"memory": {
  "command": "/Users/seeheejang/.claude/claude-memory-mcp/venv/bin/python",
  "args": ["-m", "memory_mcp.server"],
  "env": {
    "MEMORY_FILE_PATH": "/Users/seeheejang/.claude/memory.json"
  }
}
```

**기능**:
- 프로젝트 결정사항 기록
- 컨텍스트 지속성 관리
- 중요한 학습 내용 저장

**사용법**:
```bash
# /remember 슬래시 명령어로 사용
/remember
```

### MCP 서버 재시작 방법

```bash
# Claude Desktop 재시작 (모든 MCP 서버 새로고침)
# 1. Claude Desktop 종료
# 2. Claude Desktop 재실행
# 3. 또는 설정에서 MCP 서버 재로드
```

---

## 🎨 SuperClaude Framework

### 슬래시 명령어 시스템

SuperClaude Framework의 핵심인 슬래시 명령어들이 게임플라자 프로젝트에 맞춰 커스터마이징되었습니다.

#### `/think` - 체계적 사고 모드 🧠

**위치**: `.claude/commands/development/think.md`

**기능**: Sequential Thinking MCP를 활용한 5단계 체계적 문제 해결

**사용법**:
```bash
/think "예약 시스템의 동시 접속자 충돌 방지 방법"
/think "모바일에서 24시간 시간 선택 UI 개선 방안"
/think "KST 시간 처리를 위한 최적의 라이브러리 선택"
```

**5단계 프로세스**:
1. **Problem Definition** - 문제 정의 및 제약 조건
2. **Research** - 조사 및 정보 수집
3. **Analysis** - 분석 및 평가
4. **Synthesis** - 종합 및 통합
5. **Conclusion** - 결론 및 액션 플랜

#### `/research` - 기술 조사 모드 🔍

**위치**: `.claude/commands/development/research.md`

**기능**: Context7과 웹 검색을 활용한 체계적 기술 조사

**사용법**:
```bash
/research "Next.js 14 모바일 성능 최적화"
/research "React 실시간 구독 패턴 2025"
/research "Supabase RLS 보안 베스트 프랙티스"
```

**조사 영역**:
- 최신 라이브러리 동향
- 베스트 프랙티스
- 성능 최적화 기법
- 보안 가이드라인
- 모바일 최적화 전략

#### `/automate` - 브라우저 자동화 모드 🎭

**위치**: `.claude/commands/development/automate.md`

**기능**: Playwright MCP를 활용한 브라우저 자동화 테스트

**사용법**:
```bash
/automate
```

**자동화 기능**:
- 사용자 플로우 테스트
- 모바일 브라우저 테스트
- 24시간 시간 선택 UI 테스트
- 실시간 동기화 테스트
- 성능 측정

#### `/remember` - 프로젝트 메모리 관리 💾

**위치**: `.claude/commands/project/remember.md`

**기능**: Claude Memory MCP를 활용한 프로젝트 지식 관리

**사용법**:
```bash
/remember
```

**메모리 카테고리**:
- 기술적 결정사항
- 비즈니스 규칙
- 사용자 피드백
- 성능 최적화 사례
- 보안 고려사항

### 에이전트 시스템

#### 기존 에이전트 (Single Mode)
**위치**: `/docs/agents/`
- `frontend-developer.md`
- `backend-developer.md`
- `ui-ux-designer.md`
- `security-expert.md`
- `qa-engineer.md`

#### SuperClaude 에이전트 (Enhanced Mode)
**위치**: `.claude/commands/agent/`
- `architect.md` - 시스템 아키텍트 전문가
- `scribe.md` - 문서화 전문가

**사용법**:
```bash
# 아키텍트 에이전트 활성화
"시스템 아키텍트 관점에서 이 설계를 검토해줘"

# 문서화 전문가 활성화  
"이 기능에 대한 사용자 가이드를 작성해줘"
```

---

## 🤖 에이전트 페르소나 시스템

### 개요
게임플라자 프로젝트는 다양한 전문가 에이전트 페르소나를 활용하여 고품질 개발을 수행합니다. 각 에이전트는 특정 역할에 특화된 전문성을 가지고 있습니다.

### 에이전트 역할 및 전문성

#### 기본 에이전트 (Single Mode)
**위치**: `/docs/agents/`

1. **Frontend Developer** (`frontend-developer.md`)
   - React/TypeScript 전문가
   - 모바일 퍼스트 UI/UX 구현
   - 성능 최적화 및 접근성
   - PWA 및 실시간 동기화

2. **Backend Developer** (`backend-developer.md`)
   - Supabase/PostgreSQL 전문가
   - API 설계 및 데이터 모델링
   - 예약 시스템 로직 구현
   - 실시간 데이터 동기화

3. **UI/UX Designer** (`ui-ux-designer.md`)
   - 모바일 사용자 경험 전문가
   - 접근성 및 사용성 최적화
   - 디자인 시스템 및 컴포넌트 설계
   - 사용자 테스트 및 피드백 분석

4. **Security Expert** (`security-expert.md`)
   - 보안 감사 및 취약점 분석
   - 인증/인가 시스템 설계
   - 데이터 보호 및 암호화
   - OWASP 가이드라인 준수

5. **QA Engineer** (`qa-engineer.md`)
   - 테스트 전략 및 자동화
   - 성능 테스트 및 부하 테스트
   - 모바일 기기 호환성 테스트
   - 버그 추적 및 품질 보증

#### SuperClaude 에이전트 (Enhanced Mode)
**위치**: `.claude/commands/agent/`

1. **Architect** (`architect.md`)
   - 시스템 전체 아키텍처 설계
   - 기술 스택 선택 및 평가
   - 성능 및 확장성 최적화
   - 코드 리뷰 및 베스트 프랙티스

2. **Scribe** (`scribe.md`)
   - 기술 문서화 전문가
   - API 문서 및 사용자 가이드
   - 코드 주석 및 README 작성
   - 프로세스 및 워크플로우 문서화

### 에이전트 활용 방법

#### 1. 특정 에이전트 호출
```bash
# 명시적 호출
"Frontend Developer 에이전트로 이 컴포넌트 검토해줘"
"Security Expert 관점에서 이 API 보안 분석해줘"
"Architect로서 시스템 설계 검토해줘"

# 슬래시 명령어 사용
/agent:architect
/agent:scribe
```

#### 2. 자동 활성화 트리거
각 에이전트는 특정 키워드나 작업에 따라 자동 활성화됩니다:
- React 코드 작성 → Frontend Developer
- Supabase 쿼리 → Backend Developer
- 보안 감사 → Security Expert
- 문서 작성 → Scribe

#### 3. 다중 에이전트 협업
```bash
# 예시: 새로운 기능 개발
"Frontend와 Backend 에이전트가 함께 예약 API 설계해줘"
"모든 에이전트가 이 기능 검토해줘"
```

### 게임플라자 특화 전문성

각 에이전트는 게임플라자 프로젝트의 특수성을 이해하고 있습니다:

- **모바일 퍼스트 (99% 사용자)**: 모바일 기기에서의 사용성 최우선
- **KST 시간대**: 모든 시간 처리는 한국 표준시 기준
- **24시간 표시**: 새벽 0~5시는 24~29시로 표시
- **실시간 동기화**: 예약/기기 상태의 실시간 업데이트
- **접근성**: WCAG 2.1 AA 기준 준수

---

## 🔄 통합 워크플로우

### 일상적인 개발 워크플로우

#### 1. 개발 세션 시작
```bash
# 1. Claude Desktop 실행 (MCP 서버 자동 시작)

# 2. 게임플라자 개발 서버 시작
cd /Users/seeheejang/Documents/project/gameplaza-v2
npm run dev
```

#### 2. AI 도구를 활용한 문제 해결
```bash
# Claude Code에서:

# Step 1: 체계적 사고로 문제 분석
/think "예약 시스템의 성능 이슈 해결 방안"

# Step 2: 최신 기술 동향 조사
/research "React 성능 최적화 2025"

# Step 3: 중요한 결정사항 기록
/remember

# Step 4: 자동화 테스트 실행
/automate

# Step 5: 에이전트 활용
"Frontend Developer로서 이 컴포넌트 최적화해줘"
```

#### 3. 작업 관리 및 추적

**Shrimp Task Manager 활용**:
```bash
# 작업 계획 수립
"이번 스프린트의 작업 계획을 세워줘"

# 진행 상황 추적
"현재 진행 중인 작업 상태를 보여줘"

# 완료 처리
"예약 시스템 리팩토링 작업을 완료로 표시해줘"
```

### 프로젝트 메모리 관리

#### 중요한 결정사항 기록
```bash
# Claude Code에서 /remember 사용
/remember

# 또는 직접 Memory MCP 활용
"이번에 결정한 24시간 시간 표시 정책을 Memory에 저장해줘:
- 새벽 시간(0~5시)은 24~29시로 표시
- 연속성을 위해 익일 새벽 표시
- KST 시간대 고정 사용"
```

#### 프로젝트 컨텍스트 복원
```bash
# 새로운 세션 시작 시
"이전에 저장된 게임플라자 프로젝트 메모리를 불러와서 현재 상황을 요약해줘"

# 특정 주제 검색
"KST 시간 처리와 관련된 이전 결정사항들을 찾아줘"
```

---

## 🔧 문제 해결

### 자주 발생하는 문제들

#### 1. MCP 서버 연결 문제

**증상**: 슬래시 명령어가 작동하지 않음
```bash
# 해결책
# 1. Claude Desktop 재시작
# 2. MCP 서버 설정 확인
cat ~/.claude/claude_desktop_config.json

# 3. 수동으로 MCP 서버 재시작
# Claude Desktop → 설정 → 개발자 → MCP 서버 재로드
```

#### 2. Shrimp Task Manager 웹 GUI 접속 불가

**증상**: http://localhost:7001 접속 실패
```bash
# 해결책
# 1. Claude Desktop 재시작
# 2. 포트 충돌 확인
lsof -i :7001

# 3. 환경 변수 확인
# ~/.claude/claude_desktop_config.json에서
# "WEB_PORT": "7001" 설정 확인
```

#### 3. 가상환경 활성화 문제

**증상**: Python 모듈을 찾을 수 없음
```bash
# Sequential Thinking 가상환경
source /Users/seeheejang/.claude/mcp-sequential-thinking/venv/bin/activate

# Memory MCP 가상환경  
source /Users/seeheejang/.claude/claude-memory-mcp/venv/bin/activate
```

### 성능 최적화

#### 1. MCP 서버 응답 속도 개선
```bash
# 불필요한 MCP 서버 비활성화
# ~/.claude/claude_desktop_config.json에서 사용하지 않는 서버 제거

# 예: Playwright를 사용하지 않는 경우
# "playwright": { ... } 섹션 제거 또는 주석 처리
```

#### 2. 메모리 사용량 최적화
```bash
# 대용량 파일 처리 시
# Filesystem MCP 대신 Glob/Grep 도구 사용 권장
```

### 백업 및 복구

#### 1. MCP 설정 백업
```bash
# 설정 파일 백업
cp ~/.claude/claude_desktop_config.json ~/.claude/claude_desktop_config.backup.json

# 복구
cp ~/.claude/claude_desktop_config.backup.json ~/.claude/claude_desktop_config.json
```

#### 2. 프로젝트 메모리 백업
```bash
# Memory MCP 데이터 백업
cp ~/.claude/memory.json ~/.claude/memory.backup.json

# 복구
cp ~/.claude/memory.backup.json ~/.claude/memory.json
```

---

## 📚 추가 리소스

### 공식 문서
- **MCP 프로토콜**: https://modelcontextprotocol.io/
- **Supabase MCP**: https://github.com/supabase/mcp-server-supabase
- **Context7**: https://context7.ai/

### 게임플라자 관련 문서
- **프로젝트 규칙**: `/CLAUDE.md`
- **기술 스택**: `/docs/technical/tech_stack_detail.md`
- **에이전트 시스템**: `/docs/agents/`
- **개발 가이드**: `/docs/development/`

### 설정 파일 위치
```bash
# MCP 서버 설정
~/.claude/claude_desktop_config.json

# SuperClaude 슬래시 명령어
/Users/seeheejang/Documents/project/gameplaza-v2/.claude/commands/

# 프로젝트 메모리
~/.claude/memory.json

# Shrimp Task Manager 웹 GUI
http://localhost:7001
```

---

## 🎯 다음 단계

### 1. 시스템 활용도 높이기
- 모든 슬래시 명령어 (`/think`, `/research`, `/automate`, `/remember`) 적극 활용
- 에이전트 페르소나를 통한 전문적인 코드 리뷰
- Memory MCP로 중요한 학습 내용과 결정사항 지속적 기록

### 2. 워크플로우 자동화
- GitHub Actions와 연동
- 자동화된 테스트 파이프라인 구축
- 코드 리뷰 프로세스 자동화

### 3. 팀 협업 확대
- 프로젝트 진행 상황 실시간 공유
- 베스트 프랙티스 문서화
- 지식 공유 세션 정기화

---

이제 게임플라자 프로젝트에서 **최첨단 AI 협업 환경**을 완전히 활용할 수 있습니다! 🚀

각 도구들이 서로 유기적으로 연결되어 개발 효율성과 코드 품질을 극대화할 것입니다.