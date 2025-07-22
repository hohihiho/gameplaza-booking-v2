# /headless-pm - AI 에이전트 협업 모드

Headless PM 시스템을 활용하여 다중 AI 에이전트 협업을 수행합니다.

## 🤖 AI 협업 시스템 전문가 역할

### 핵심 협업 영역
- **Epic/Feature/Task 관리**: 프로젝트를 체계적 계층으로 분해
- **역할별 작업 분배**: Frontend, Backend, Architect, QA 에이전트 조율
- **실시간 진행 모니터링**: 작업 상태 추적 및 블로커 해결
- **자동화된 워크플로우**: Git 브랜치 전략과 연동된 작업 흐름

### 게임플라자 특화 협업
- **모바일 퍼스트 개발**: 99% 모바일 사용자 대응 작업 분배
- **실시간 시스템**: Supabase Realtime 기반 동시 개발
- **KST 시간 정책**: 24시간 표시 체계 일관성 유지
- **품질 우선**: 코드 리뷰 → 테스트 → 배포 파이프라인

## 🎯 에이전트 역할 시스템

### 개발 에이전트
```bash
# Frontend Developer
gameplaza_frontend_dev  - React/TypeScript PWA 개발
                       - 모바일 UI/UX 구현
                       - 실시간 상태 동기화

# Backend Developer  
gameplaza_backend_dev   - Supabase/API 개발
                       - 예약 시스템 로직
                       - 데이터베이스 설계

# System Architect
gameplaza_architect     - 전체 아키텍처 설계
                       - 코드 리뷰 및 승인
                       - 기술적 의사결정

# QA Engineer
gameplaza_qa           - 기능/성능 테스트
                       - 모바일 UX 검증
                       - 품질 보증
```

### 관리 에이전트
```bash
# Project Manager
gameplaza_pm           - 전체 프로젝트 조율
                       - Epic/Feature 생성
                       - 진행 상황 관리
```

## 🎯 협업 워크플로우

### 1. 프로젝트 초기화
```bash
# Headless PM 서버 시작
cd /Users/seeheejang/Documents/project/headless-pm
source venv/bin/activate
./start.sh

# 대시보드 접속
# API 문서: http://localhost:6969/api/v1/docs
# 웹 대시보드: http://localhost:3001
# CLI 대시보드: python -m src.cli.main dashboard
```

### 2. 에이전트 등록 및 활성화
```bash
# PM 에이전트 시작
cd /Users/seeheejang/Documents/project/gameplaza-v2/headlesspm
python headless_pm_client.py register --agent-id "gameplaza_pm" --role "pm" --level "principal"

# Frontend 에이전트 시작  
python headless_pm_client.py register --agent-id "gameplaza_frontend_dev" --role "frontend_dev" --level "senior"

# Backend 에이전트 시작
python headless_pm_client.py register --agent-id "gameplaza_backend_dev" --role "backend_dev" --level "senior"

# Architect 에이전트 시작
python headless_pm_client.py register --agent-id "gameplaza_architect" --role "architect" --level "principal"

# QA 에이전트 시작
python headless_pm_client.py register --agent-id "gameplaza_qa" --role "qa" --level "senior"
```

### 3. Epic/Feature/Task 관리
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

# Task 생성 및 할당
python headless_pm_client.py tasks create \
  --feature-id [FEATURE_ID] \
  --title "시간 선택 컴포넌트 리팩토링" \
  --description "24시간 표시 로직을 별도 Hook으로 분리" \
  --complexity "major" \
  --role "frontend_dev" \
  --level "senior"
```

## 📋 게임플라자 Epic 구조

### Epic 1: 사용자 경험 개선
```
├── Feature: 24시간 시간 표시 개선
│   ├── [Frontend] 시간 선택 컴포넌트 리팩토링
│   ├── [Backend] 시간 변환 API 최적화
│   └── [QA] 새벽 시간대 테스트 시나리오
├── Feature: 모바일 터치 인터페이스 향상
│   ├── [Frontend] 터치 타겟 크기 최적화
│   ├── [Frontend] 스와이프 제스처 추가
│   └── [QA] 다양한 모바일 디바이스 테스트
```

### Epic 2: 실시간 성능 최적화
```
├── Feature: 예약 상태 실시간 동기화
│   ├── [Backend] Supabase Realtime 최적화
│   ├── [Frontend] 상태 업데이트 배칭
│   └── [QA] 동시 접속 스트레스 테스트
├── Feature: API 응답 속도 개선
│   ├── [Backend] 데이터베이스 쿼리 최적화
│   ├── [Architect] 캐싱 전략 설계
│   └── [QA] 성능 지표 측정
```

### Epic 3: 관리자 기능 확장
```
├── Feature: 실시간 대시보드
│   ├── [Frontend] 관리자 대시보드 UI
│   ├── [Backend] 실시간 통계 API
│   └── [QA] 관리자 권한 테스트
├── Feature: 자동 스케줄링
│   ├── [Backend] 자동 일정 생성 로직
│   ├── [Frontend] 스케줄 관리 인터페이스
│   └── [QA] 스케줄링 알고리즘 검증
```

## 🔄 작업 실행 패턴

### 개발자 에이전트 워크플로우
```bash
# 1. 작업 받기
python headless_pm_client.py tasks next --role [ROLE] --level [LEVEL]

# 2. 작업 잠금
python headless_pm_client.py tasks lock [TASK_ID] --agent-id "[AGENT_ID]"

# 3. 작업 시작 알림
python headless_pm_client.py tasks status [TASK_ID] under_work

# 4. 개발 작업 수행
cd /Users/seeheejang/Documents/project/gameplaza-v2
npm run dev  # 개발 서버 시작

# 5. 완료 보고
python headless_pm_client.py tasks status [TASK_ID] dev_done

# 6. 코드 리뷰 요청
python headless_pm_client.py documents create --content "@gameplaza_architect 코드 리뷰 요청: [작업 내용]"
```

### 승인자 에이전트 워크플로우  
```bash
# 1. 리뷰 작업 받기
python headless_pm_client.py tasks next --role architect --level principal

# 2. 코드 검토 수행
cd /Users/seeheejang/Documents/project/gameplaza-v2
npm run type-check  # TypeScript 검사
npm run lint       # 코드 스타일 검사
npm run test       # 테스트 실행

# 3. 승인/반려 결정
python headless_pm_client.py tasks status [TASK_ID] approved
# 또는
python headless_pm_client.py tasks status [TASK_ID] needs_revision
```

## 📊 모니터링 및 분석

### 실시간 대시보드 활용
```bash
# CLI 대시보드 (실시간 모니터링)
cd /Users/seeheejang/Documents/project/headless-pm
source venv/bin/activate
python -m src.cli.main dashboard

# 웹 대시보드 (시각적 분석)
# http://localhost:3001 접속
# - 프로젝트 개요
# - Epic 진행 상황
# - 에이전트 활동
# - 최근 커뮤니케이션
```

### 진행 상황 보고
```bash
# 주간 진행 리포트 생성
python headless_pm_client.py changelog --days 7

# Epic별 완료율 확인
python headless_pm_client.py epics list

# 에이전트별 작업 현황
python headless_pm_client.py agents list
```

## 🗣️ 에이전트 간 커뮤니케이션

### @mention 시스템 활용
```bash
# 특정 에이전트에게 메시지 전송
python headless_pm_client.py documents create --content "
@gameplaza_frontend_dev API 스펙 변경 안내:
- 예약 응답 형식이 변경되었습니다
- 새로운 필드: display_time (24시간 표시용)
- 기존 start_time은 그대로 유지

@gameplaza_qa 통합 테스트 요청

#api-change #breaking-change
"
```

### 팀 회의 및 동기화
```bash
# 일일 스탠드업 (문서 기반)
python headless_pm_client.py documents create --content "
📅 일일 스탠드업 - $(date)

@all-agents 오늘의 진행 상황 공유:

어제 완료:
오늘 계획:
블로커:
도움 요청:

#daily-standup
"
```

## 🚨 이슈 관리 시스템

### 블로커 해결 프로세스
```bash
# 긴급 이슈 보고
python headless_pm_client.py documents create --content "
🚨 BLOCKER ALERT

이슈: Supabase 연결 불안정
영향: 모든 실시간 기능 중단
담당자: @gameplaza_backend_dev
예상 지연: 4시간

즉시 대응 필요!

#blocker #urgent #infrastructure
"
```

### 우선순위 재조정
```bash
# 긴급 작업 생성
python headless_pm_client.py tasks create \
  --title "긴급: Supabase 연결 안정화" \
  --description "실시간 구독 재연결 로직 추가" \
  --complexity "minor" \
  --role "backend_dev" \
  --level "senior"
```

## 💡 효과적인 협업 팁

### 작업 분배 최적화
- **병렬 작업**: 독립적인 컴포넌트는 동시 개발
- **의존성 관리**: API 스펙 확정 후 Frontend 개발 시작
- **코드 리뷰**: 주요 기능은 Architect 검토 필수
- **테스트 우선**: QA 에이전트와 사전 테스트 시나리오 논의

### 커뮤니케이션 규칙
- **태그 시스템**: #urgent, #breaking-change, #review-needed
- **명확한 @mention**: 구체적인 요청 사항 명시
- **상태 업데이트**: 작업 진행률을 정기적으로 공유
- **문서화**: 중요한 결정사항은 문서로 기록

---

**목표**: AI 에이전트들이 효율적으로 협업하여 고품질 게임플라자 시스템 완성

지금 바로 AI 협업을 시작하려면:
```bash
# 1. Headless PM 서버 시작
cd /Users/seeheejang/Documents/project/headless-pm && ./start.sh

# 2. PM 에이전트로 첫 Epic 생성
cd /Users/seeheejang/Documents/project/gameplaza-v2/headlesspm
python headless_pm_client.py epics create --name "첫 번째 Epic" --description "설명" --agent-id "gameplaza_pm"
```