# 🚀 게임플라자 고급 AI 도구 사용 가이드

이 문서는 게임플라자 프로젝트에 통합된 모든 고급 AI 도구들의 설치, 설정, 사용법을 상세히 설명합니다.

## 📋 목차

1. [시스템 개요](#-시스템-개요)
2. [MCP 서버 시스템](#-mcp-서버-시스템)
3. [SuperClaude Framework](#-superclaude-framework)
4. [Headless PM 협업 시스템](#-headless-pm-협업-시스템)
5. [통합 워크플로우](#-통합-워크플로우)
6. [문제 해결](#-문제-해결)

---

## 🎯 시스템 개요

### 통합된 AI 도구 스택

```
┌─────────────────────────────────────────────────┐
│            Claude Code (메인 인터페이스)           │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              MCP 서버 시스템                      │
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
│  ├── /remember - 프로젝트 메모리                │
│  └── /headless-pm - AI 협업 모드                │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│            Headless PM 협업 시스템                │
│  ├── PM (프로젝트 매니저)                        │
│  ├── Frontend Dev (React/TypeScript)           │
│  ├── Backend Dev (Supabase/API)               │
│  ├── Architect (시스템 설계)                    │
│  └── QA (품질 보증)                            │
└─────────────────────────────────────────────────┘
```

### 핵심 기능
- **🧠 체계적 사고**: Sequential Thinking으로 복잡한 문제 단계별 해결
- **📚 최신 정보**: Context7으로 실시간 기술 문서 검색
- **🤖 자동화**: Playwright로 브라우저/모바일 테스트 자동화
- **💾 지속성**: Memory MCP로 프로젝트 컨텍스트 유지
- **👥 협업**: Headless PM으로 다중 AI 에이전트 조율
- **📊 관리**: Shrimp Task Manager로 체계적 작업 추적

---

## 🔧 MCP 서버 시스템

### 현재 설치된 MCP 서버들

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

#### `/headless-pm` - AI 협업 모드 👥

**위치**: `.claude/commands/project/headless-pm.md`

**기능**: Headless PM 시스템을 통한 다중 AI 에이전트 협업

**사용법**:
```bash
/headless-pm
```

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

## 🤖 Headless PM 협업 시스템

### 시스템 아키텍처

Headless PM은 다중 AI 에이전트가 체계적으로 협업할 수 있는 REST API 기반 시스템입니다.

```
┌─────────────────────────────────────────────────┐
│                 Headless PM                     │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ API Server  │  │ MCP Server  │  │ Dashboard  │ │
│  │ :6969      │  │ :6968       │  │ :3001      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │            SQLite Database              │ │
│  │ Epic → Feature → Task 계층 구조            │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
┌───▼───┐         ┌─────▼─────┐         ┌───▼───┐
│  PM   │         │Frontend   │         │Backend│
│Agent  │         │Developer  │         │Developer│
└───────┘         └───────────┘         └───────┘
    │                   │                   │
┌───▼───┐         ┌─────▼─────┐         ┌───▼───┐
│Architect│       │    QA     │         │ 기타  │
│Agent   │         │ Engineer  │         │Agent  │
└───────┘         └───────────┘         └───────┘
```

### 설치 및 실행

#### 1. Headless PM 서버 시작

```bash
# 서버 시작 (별도 터미널에서)
cd /Users/seeheejang/Documents/project/headless-pm
source venv/bin/activate
./start.sh

# 실행 확인
# ✅ API Server: http://localhost:6969
# ✅ MCP Server: http://localhost:6968  
# ✅ Web Dashboard: http://localhost:3001
```

#### 2. 웹 대시보드 접속

```bash
# 브라우저에서 접속
open http://localhost:3001

# 또는 API 문서 확인
open http://localhost:6969/api/v1/docs
```

### 게임플라자 전용 AI 에이전트

#### 에이전트 역할 정의
**위치**: `/headlesspm/team_roles/`

1. **`gameplaza_pm.md`** - 프로젝트 매니저
   - Epic/Feature/Task 생성 및 관리
   - 에이전트 간 작업 조율
   - 진행 상황 모니터링

2. **`gameplaza_frontend_dev.md`** - 프론트엔드 개발자
   - React + TypeScript PWA 개발
   - 모바일 퍼스트 UI 구현
   - 실시간 상태 동기화

3. **`gameplaza_backend_dev.md`** - 백엔드 개발자
   - Supabase + Next.js API 개발
   - 예약 시스템 로직 구현
   - 데이터베이스 스키마 관리

4. **`gameplaza_architect.md`** - 시스템 아키텍트
   - 전체 시스템 설계
   - 코드 리뷰 및 승인
   - 기술적 의사결정

5. **`gameplaza_qa.md`** - QA 엔지니어
   - 기능/성능 테스트
   - 모바일 UX 검증
   - 품질 보증

### 협업 워크플로우

#### 1. 에이전트 등록
```bash
cd /Users/seeheejang/Documents/project/gameplaza-v2/headlesspm

# PM 에이전트 등록
python headless_pm_client.py register \
  --agent-id "gameplaza_pm" \
  --role "pm" \
  --level "principal"

# Frontend 개발자 등록
python headless_pm_client.py register \
  --agent-id "gameplaza_frontend_dev" \
  --role "frontend_dev" \
  --level "senior"

# Backend 개발자 등록
python headless_pm_client.py register \
  --agent-id "gameplaza_backend_dev" \
  --role "backend_dev" \
  --level "senior"

# 아키텍트 등록
python headless_pm_client.py register \
  --agent-id "gameplaza_architect" \
  --role "architect" \
  --level "principal"

# QA 엔지니어 등록  
python headless_pm_client.py register \
  --agent-id "gameplaza_qa" \
  --role "qa" \
  --level "senior"
```

#### 2. Epic/Feature/Task 관리

```bash
# Epic 생성 (PM만 가능)
python headless_pm_client.py epics create \
  --name "예약 시스템 개선" \
  --description "사용자 예약 플로우 전반적 개선" \
  --agent-id "gameplaza_pm"

# Feature 생성
python headless_pm_client.py features create \
  --epic-id [EPIC_ID] \
  --name "24시간 시간 선택 UI" \
  --description "새벽 시간대(24~29시) 표시 개선"

# Task 생성
python headless_pm_client.py tasks create \
  --feature-id [FEATURE_ID] \
  --title "시간 선택 컴포넌트 리팩토링" \
  --description "24시간 표시 로직을 별도 Hook으로 분리" \
  --complexity "major" \
  --role "frontend_dev" \
  --level "senior"
```

#### 3. 작업 실행 패턴

**개발자 에이전트 워크플로우**:
```bash
# 1. 작업 받기
python headless_pm_client.py tasks next --role frontend_dev --level senior

# 2. 작업 잠금
python headless_pm_client.py tasks lock [TASK_ID] --agent-id "gameplaza_frontend_dev"

# 3. 작업 시작
python headless_pm_client.py tasks status [TASK_ID] under_work

# 4. 개발 작업 (게임플라자 프로젝트에서)
cd /Users/seeheejang/Documents/project/gameplaza-v2
npm run dev

# 5. 완료 보고
python headless_pm_client.py tasks status [TASK_ID] dev_done

# 6. 리뷰 요청
python headless_pm_client.py documents create \
  --content "@gameplaza_architect 코드 리뷰 요청: 시간 선택 컴포넌트 리팩토링 완료"
```

#### 4. 에이전트 간 커뮤니케이션

```bash
# @mention 시스템 활용
python headless_pm_client.py documents create --content "
@gameplaza_frontend_dev API 스펙 변경 안내:
- 예약 응답 형식이 변경되었습니다
- 새로운 필드: display_time (24시간 표시용)

@gameplaza_qa 통합 테스트 요청

#api-change #breaking-change
"
```

#### 5. 실시간 모니터링

```bash
# CLI 대시보드 (실시간)
cd /Users/seeheejang/Documents/project/headless-pm
python -m src.cli.main dashboard

# 진행 상황 확인
python headless_pm_client.py epics list        # Epic 진행률
python headless_pm_client.py agents list       # 활성 에이전트
python headless_pm_client.py changelog         # 최근 활동
```

---

## 🔄 통합 워크플로우

### 일상적인 개발 워크플로우

#### 1. 개발 세션 시작
```bash
# 1. Claude Desktop 실행 (MCP 서버 자동 시작)

# 2. Headless PM 서버 시작 (별도 터미널)
cd /Users/seeheejang/Documents/project/headless-pm
source venv/bin/activate
./start.sh

# 3. 게임플라자 개발 서버 시작 (별도 터미널)
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

# Step 5: 팀 협업 모드로 작업 분배
/headless-pm
```

#### 3. 다중 에이전트 협업 시나리오

**시나리오**: 새로운 기능 개발

1. **PM 에이전트** → Epic/Feature/Task 생성
2. **Architect 에이전트** → 기술적 설계 및 검토
3. **Frontend 에이전트** → UI 컴포넌트 개발
4. **Backend 에이전트** → API 및 데이터베이스 작업
5. **QA 에이전트** → 테스트 및 품질 검증

```bash
# 실제 사용 예시
cd /Users/seeheejang/Documents/project/gameplaza-v2/headlesspm

# PM이 새 Epic 생성
python headless_pm_client.py epics create \
  --name "실시간 알림 시스템" \
  --description "예약 상태 변경 시 실시간 푸시 알림" \
  --agent-id "gameplaza_pm"

# Architect가 설계 Task 생성
python headless_pm_client.py tasks create \
  --title "실시간 알림 아키텍처 설계" \
  --complexity "major" \
  --role "architect"

# Frontend가 UI Task 수행
python headless_pm_client.py tasks next --role frontend_dev

# QA가 테스트 시나리오 작성
python headless_pm_client.py tasks create \
  --title "알림 시스템 테스트 시나리오" \
  --complexity "minor" \
  --role "qa"
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

#### 2. Headless PM 서버 실행 실패

**증상**: Connection refused 에러
```bash
# 문제 확인
curl -X GET "http://localhost:6969/api/v1/docs"

# 해결책
cd /Users/seeheejang/Documents/project/headless-pm
source venv/bin/activate

# 포트 충돌 확인
lsof -i :6969
lsof -i :6968  
lsof -i :3001

# 강제 종료 후 재시작
pkill -f headless-pm
./start.sh
```

#### 3. Shrimp Task Manager 웹 GUI 접속 불가

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

#### 4. 가상환경 활성화 문제

**증상**: Python 모듈을 찾을 수 없음
```bash
# Headless PM 가상환경 활성화
cd /Users/seeheejang/Documents/project/headless-pm
source venv/bin/activate

# Sequential Thinking 가상환경 (별도)
source /Users/seeheejang/.claude/mcp-sequential-thinking/venv/bin/activate

# Memory MCP 가상환경 (별도)  
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

#### 2. Headless PM 데이터베이스 최적화
```bash
cd /Users/seeheejang/Documents/project/headless-pm
source venv/bin/activate

# 데이터베이스 정리
python -m src.cli.main reset  # ⚠️ 모든 데이터 삭제
python -m src.cli.main init   # 초기화
```

### 백업 및 복구

#### 1. MCP 설정 백업
```bash
# 설정 파일 백업
cp ~/.claude/claude_desktop_config.json ~/.claude/claude_desktop_config.backup.json

# 복구
cp ~/.claude/claude_desktop_config.backup.json ~/.claude/claude_desktop_config.json
```

#### 2. Headless PM 데이터 백업
```bash
# SQLite 데이터베이스 백업
cd /Users/seeheejang/Documents/project/headless-pm
cp headless-pm.db headless-pm.backup.db

# 복구
cp headless-pm.backup.db headless-pm.db
```

#### 3. 프로젝트 메모리 백업
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
- **Headless PM**: https://github.com/madviking/headless-pm

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

# Headless PM 에이전트 역할
/Users/seeheejang/Documents/project/gameplaza-v2/headlesspm/team_roles/

# 프로젝트 메모리
~/.claude/memory.json

# Headless PM 데이터베이스
/Users/seeheejang/Documents/project/headless-pm/headless-pm.db
```

---

## 🎯 다음 단계

### 1. 시스템 활용도 높이기
- 모든 슬래시 명령어 (`/think`, `/research`, `/automate`, `/remember`, `/headless-pm`) 적극 활용
- Headless PM으로 복잡한 기능을 에이전트별로 분담 개발
- Memory MCP로 중요한 학습 내용과 결정사항 지속적 기록

### 2. 워크플로우 자동화
- GitHub Actions와 Headless PM 연동
- 자동화된 테스트 파이프라인 구축
- 코드 리뷰 프로세스 자동화

### 3. 팀 협업 확대
- 추가 에이전트 역할 정의 (DevOps, Security 등)
- 실제 팀원들과 Headless PM 공유 사용
- 프로젝트 진행 상황 실시간 공유

---

이제 게임플라자 프로젝트에서 **최첨단 AI 협업 환경**을 완전히 활용할 수 있습니다! 🚀

각 도구들이 서로 유기적으로 연결되어 개발 효율성과 코드 품질을 극대화할 것입니다.