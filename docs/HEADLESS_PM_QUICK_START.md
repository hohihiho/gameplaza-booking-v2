# 🚀 Headless PM 빠른 시작 가이드

게임플라자 프로젝트에 통합된 Headless PM AI 협업 시스템의 빠른 시작 가이드입니다.

## 📋 개요

Headless PM은 다중 AI 에이전트가 체계적으로 협업할 수 있게 해주는 시스템입니다. 각 에이전트는 자신의 역할(PM, Frontend Dev, Backend Dev, Architect, QA)에 따라 작업을 분담하고 실시간으로 소통합니다.

## 🎯 핵심 기능

- **Epic → Feature → Task** 계층적 작업 관리
- **역할별 작업 분배** (PM, Frontend, Backend, Architect, QA)
- **실시간 협업** (@mention 시스템, 문서 기반 소통)
- **Git 워크플로우 통합** (브랜치 전략 자동화)
- **실시간 대시보드** (웹 + CLI)

## 🚀 빠른 시작

### 1단계: 서버 시작

```bash
# Headless PM 프로젝트 디렉토리로 이동
cd /Users/seeheejang/Documents/project/headless-pm

# 스마트 시작 스크립트 실행 (자동으로 기존 서버 종료 후 재시작)
./smart-start.sh
```

**결과 확인:**
- ✅ API 서버: http://localhost:6969
- ✅ 웹 대시보드: http://localhost:3001  
- ✅ API 문서: http://localhost:6969/api/v1/docs

### 2단계: 에이전트 등록

```bash
# 가상환경 활성화
source venv/bin/activate

# PM 에이전트 등록
python agents/client/headless_pm_client.py register \
  --agent-id "gameplaza_pm" \
  --role "pm" \
  --level "principal"

# Frontend 개발자 등록
python agents/client/headless_pm_client.py register \
  --agent-id "gameplaza_frontend_dev" \
  --role "frontend_dev" \
  --level "senior"

# Backend 개발자 등록
python agents/client/headless_pm_client.py register \
  --agent-id "gameplaza_backend_dev" \
  --role "backend_dev" \
  --level "senior"

# 아키텍트 등록
python agents/client/headless_pm_client.py register \
  --agent-id "gameplaza_architect" \
  --role "architect" \
  --level "principal"

# QA 엔지니어 등록
python agents/client/headless_pm_client.py register \
  --agent-id "gameplaza_qa" \
  --role "qa" \
  --level "senior"
```

### 3단계: 첫 번째 Epic 생성

```bash
# Epic 생성 (PM만 가능)
python agents/client/headless_pm_client.py epics create \
  --name "게임플라자 시스템 개선" \
  --description "사용자 경험과 시스템 안정성 향상" \
  --agent-id "gameplaza_pm"
```

### 4단계: 웹 대시보드 확인

브라우저에서 http://localhost:3001 접속하여 다음을 확인:

- **📊 홈**: 전체 프로젝트 현황
- **📋 Tasks**: 작업 목록 및 상태
- **👥 Agents**: 등록된 에이전트들
- **💬 Communications**: 에이전트 간 소통
- **📈 Analytics**: 프로젝트 분석
- **🏥 Health**: 시스템 상태

## 🎮 게임플라자 특화 사용법

### Epic/Feature/Task 구조 예시

```
Epic: "예약 시스템 개선"
├── Feature: "24시간 시간 표시 개선"
│   ├── Task: [Frontend] 시간 선택 컴포넌트 리팩토링
│   ├── Task: [Backend] 시간 변환 API 최적화
│   └── Task: [QA] 새벽 시간대 테스트
├── Feature: "실시간 예약 상태 동기화"
│   ├── Task: [Backend] Supabase Realtime 최적화
│   ├── Task: [Frontend] 상태 업데이트 배칭
│   └── Task: [QA] 동시 접속 스트레스 테스트
```

### 작업 생성 및 할당

```bash
# Feature 생성
python agents/client/headless_pm_client.py features create \
  --epic-id 1 \
  --name "24시간 시간 표시 개선" \
  --description "새벽 시간대(24~29시) 표시 개선"

# Task 생성 (Frontend 작업)
python agents/client/headless_pm_client.py tasks create \
  --feature-id 1 \
  --title "시간 선택 컴포넌트 리팩토링" \
  --description "24시간 표시 로직을 별도 Hook으로 분리하고 새벽 시간 UI 개선" \
  --complexity "major" \
  --role "frontend_dev" \
  --level "senior"

# Task 생성 (Backend 작업)
python agents/client/headless_pm_client.py tasks create \
  --feature-id 1 \
  --title "KST 시간 처리 API 최적화" \
  --description "24시간 표시를 위한 시간 변환 로직 성능 개선" \
  --complexity "minor" \
  --role "backend_dev" \
  --level "senior"
```

### 에이전트별 작업 워크플로우

#### 개발자 에이전트 (Frontend/Backend)

```bash
# 1. 작업 받기
python agents/client/headless_pm_client.py tasks next \
  --role frontend_dev --level senior

# 2. 작업 잠금
python agents/client/headless_pm_client.py tasks lock [TASK_ID] \
  --agent-id "gameplaza_frontend_dev"

# 3. 작업 시작 알림
python agents/client/headless_pm_client.py tasks status [TASK_ID] under_work

# 4. 개발 작업 (게임플라자 프로젝트에서)
cd /Users/seeheejang/Documents/project/gameplaza-v2
npm run dev

# 5. 완료 보고
python agents/client/headless_pm_client.py tasks status [TASK_ID] dev_done

# 6. 리뷰 요청
python agents/client/headless_pm_client.py documents create \
  --content "@gameplaza_architect 코드 리뷰 요청: 시간 선택 컴포넌트 리팩토링 완료. 24~29시 표시 로직을 useTimeDisplay Hook으로 분리했습니다."
```

#### 승인자 에이전트 (Architect/QA)

```bash
# 1. 리뷰 작업 받기
python agents/client/headless_pm_client.py tasks next \
  --role architect --level principal

# 2. 승인/반려 결정
python agents/client/headless_pm_client.py tasks status [TASK_ID] approved
# 또는
python agents/client/headless_pm_client.py tasks status [TASK_ID] needs_revision

# 3. 피드백 제공
python agents/client/headless_pm_client.py documents create \
  --content "@gameplaza_frontend_dev 코드 리뷰 결과: 전반적으로 좋습니다. 다만 다음 사항 수정 요청:
1. useTimeDisplay Hook에 TypeScript 타입 정의 강화
2. 24~29시 변환 로직 단위 테스트 추가
3. 성능 최적화를 위해 useMemo 적용 고려"
```

### 에이전트 간 커뮤니케이션

```bash
# 팀 전체 알림
python agents/client/headless_pm_client.py documents create \
  --content "@all-agents API 스펙 변경 안내:
  
예약 응답에 새로운 필드가 추가되었습니다:
- display_time: 24시간 표시용 (예: \"26시\")
- original_time: 실제 시간 (예: \"02:00\")

@gameplaza_frontend_dev 화면 표시 로직 업데이트
@gameplaza_qa 새로운 필드 테스트 케이스 추가

#api-change #breaking-change"

# 긴급 이슈 보고
python agents/client/headless_pm_client.py documents create \
  --content "🚨 BLOCKER ALERT

이슈: Supabase 연결 불안정으로 실시간 기능 중단
영향: 모든 예약 상태 동기화 실패
담당자: @gameplaza_backend_dev
예상 지연: 4시간

즉시 대응 필요!

#blocker #urgent #infrastructure"
```

## 📊 모니터링 및 분석

### 실시간 CLI 대시보드

```bash
# 실시간 프로젝트 상황 모니터링
cd /Users/seeheejang/Documents/project/headless-pm
source venv/bin/activate
python -m src.cli.main dashboard
```

### 프로젝트 상태 조회

```bash
# Epic 진행 상황
python agents/client/headless_pm_client.py epics list

# 활성 에이전트 현황
python agents/client/headless_pm_client.py agents list

# 최근 활동 로그
python agents/client/headless_pm_client.py changelog --hours 24

# 작업 목록 확인
python agents/client/headless_pm_client.py tasks list
```

## 🛠️ 유용한 명령어

### 서버 관리

```bash
# 서버 시작 (자동으로 기존 서버 정리)
./smart-start.sh

# 서버 종료
./smart-stop.sh

# 서버 종료 + 로그 파일 정리
./smart-stop.sh --clean-logs

# 서버 상태 확인
curl -H "X-API-Key: gameplaza-headless-pm-key-2025" http://localhost:6969/api/v1/agents
```

### 프로젝트 관리

```bash
# 전체 프로젝트 상황 요약
python agents/client/headless_pm_client.py status

# 특정 에이전트의 작업 조회
python agents/client/headless_pm_client.py tasks next --role frontend_dev

# 문서 및 커뮤니케이션 조회
python agents/client/headless_pm_client.py documents list --author-id gameplaza_pm

# 멘션 확인
python agents/client/headless_pm_client.py mentions list --agent-id gameplaza_frontend_dev
```

### 개발 환경 연동

```bash
# 게임플라자 개발 서버와 동시 실행
# 터미널 1: Headless PM
cd /Users/seeheejang/Documents/project/headless-pm
./smart-start.sh

# 터미널 2: 게임플라자 개발
cd /Users/seeheejang/Documents/project/gameplaza-v2  
npm run dev

# 터미널 3: Claude Code에서 협업 모드 활성화
/headless-pm
```

## 🎯 실제 사용 시나리오

### 시나리오 1: 새 기능 개발

1. **PM**: Epic 생성 ("모바일 알림 시스템")
2. **PM**: Feature들 생성 (푸시 알림, 인앱 알림, 이메일 알림)
3. **Architect**: 기술 설계 Task 생성 및 수행
4. **Frontend/Backend**: 각자 역할에 맞는 Task 수행
5. **QA**: 테스트 케이스 작성 및 검증
6. **PM**: 진행 상황 모니터링 및 조율

### 시나리오 2: 버그 수정

1. **QA**: 버그 발견 후 긴급 Task 생성
2. **Architect**: 원인 분석 및 해결 방안 설계  
3. **해당 개발자**: 버그 수정 작업
4. **QA**: 수정 사항 검증
5. **PM**: 배포 승인

### 시나리오 3: 성능 최적화

1. **Architect**: 성능 이슈 분석 Epic 생성
2. **Frontend/Backend**: 각 영역별 최적화 Task
3. **QA**: 성능 측정 및 벤치마크
4. **모든 에이전트**: 결과 공유 및 추가 개선사항 논의

## 🔧 문제 해결

### 서버 연결 문제

```bash
# API 서버가 응답하지 않을 때
./smart-stop.sh
./smart-start.sh

# 포트 충돌 문제
lsof -i :6969 :6968 :3001  # 사용 중인 프로세스 확인
./smart-stop.sh            # 안전한 종료
```

### 에이전트 등록 문제

```bash
# 에이전트 목록 확인
python agents/client/headless_pm_client.py agents list

# 중복 에이전트 삭제
python agents/client/headless_pm_client.py agents delete gameplaza_pm --requester-agent-id admin
```

### 웹 대시보드 문제

```bash
# 대시보드 환경 파일 확인
cat dashboard/.env.local

# 수동으로 환경 파일 생성
echo "NEXT_PUBLIC_API_URL=http://localhost:6969" > dashboard/.env.local
echo "NEXT_PUBLIC_API_KEY=gameplaza-headless-pm-key-2025" >> dashboard/.env.local
```

## 📚 더 많은 정보

- **상세 가이드**: `/docs/ADVANCED_AI_TOOLS_GUIDE.md`
- **에이전트 역할**: `/headlesspm/team_roles/`
- **Claude 슬래시 명령어**: `/.claude/commands/project/headless-pm.md`
- **API 문서**: http://localhost:6969/api/v1/docs

---

이제 **게임플라자 프로젝트에서 최첨단 AI 협업**을 시작할 수 있습니다! 🎮✨

각 AI 에이전트가 자신의 전문 분야에서 독립적으로 작업하면서도 체계적으로 협업하여 고품질의 시스템을 구축할 것입니다.