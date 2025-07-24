#!/bin/bash

# GitHub 이슈 재구성 스크립트
# 실행 전 확인사항: gh CLI가 설치되어 있고 인증이 완료되어 있어야 함

echo "🔄 게임플라자 백엔드 재구축을 위한 GitHub 이슈 재구성 시작..."

# 1. DDD 관련 이슈 닫기
echo "📌 DDD 관련 이슈 닫기..."
DDD_ISSUES=(60 61 62 63 64 65 66 67 68 69)

for issue in "${DDD_ISSUES[@]}"; do
    echo "  - 이슈 #$issue 닫는 중..."
    gh issue close $issue --comment "백엔드 재구축으로 방향 전환됨. 새로운 NestJS 기반 백엔드로 마이그레이션 예정입니다."
done

# 2. 새 마일스톤 생성
echo "📊 새 마일스톤 생성..."
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/hohihiho/gameplaza-booking-v2/milestones \
  -f title='Backend Rebuild - Phase 1: Foundation' \
  -f description='NestJS 기반 백엔드 재구축 - 기초 인프라 및 코어 모듈' \
  -f due_on='2025-02-14T23:59:59Z'

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/hohihiho/gameplaza-booking-v2/milestones \
  -f title='Backend Rebuild - Phase 2: Core Features' \
  -f description='인증, 예약, 기기 관리 핵심 기능' \
  -f due_on='2025-03-07T23:59:59Z'

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/hohihiho/gameplaza-booking-v2/milestones \
  -f title='Backend Rebuild - Phase 3: Admin Features' \
  -f description='관리자 기능 및 통계' \
  -f due_on='2025-03-21T23:59:59Z'

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/hohihiho/gameplaza-booking-v2/milestones \
  -f title='Backend Rebuild - Phase 4: Advanced & Production' \
  -f description='실시간, 알림, 최적화 및 배포 준비' \
  -f due_on='2025-04-04T23:59:59Z'

# 3. 새 라벨 생성 (필요한 경우)
echo "🏷️ 새 라벨 생성..."
gh label create "backend-rebuild" --description "백엔드 재구축 관련" --color "7B68EE"
gh label create "nestjs" --description "NestJS 프레임워크" --color "E91E63"
gh label create "migration" --description "마이그레이션 관련" --color "FF9800"

# 4. 새 이슈 생성
echo "📝 새 이슈 생성..."

# Phase 1: Foundation 이슈들
gh issue create \
  --title "[Backend] NestJS 프로젝트 초기 설정" \
  --body "## 작업 내용
- NestJS CLI로 프로젝트 생성
- 기본 프로젝트 구조 설정
- ESLint, Prettier 설정
- 환경 변수 설정 (ConfigModule)

## 체크리스트
- [ ] NestJS 프로젝트 생성
- [ ] 모듈 구조 설계
- [ ] 개발 도구 설정
- [ ] README 작성" \
  --label "backend-rebuild,nestjs,P0" \
  --milestone "Backend Rebuild - Phase 1: Foundation"

gh issue create \
  --title "[Backend] Docker 개발 환경 구축" \
  --body "## 작업 내용
- Docker Compose 설정
- PostgreSQL 컨테이너 설정
- Redis 컨테이너 설정 (세션/캐싱)
- 개발 환경 자동화 스크립트

## 체크리스트
- [ ] Dockerfile 작성
- [ ] docker-compose.yml 작성
- [ ] 개발 DB 초기화 스크립트
- [ ] 환경별 설정 분리" \
  --label "backend-rebuild,devops,P0" \
  --milestone "Backend Rebuild - Phase 1: Foundation"

gh issue create \
  --title "[Backend] PostgreSQL 직접 연결 및 TypeORM 설정" \
  --body "## 작업 내용
- TypeORM 설치 및 설정
- 데이터베이스 연결 설정
- Entity 기본 구조 설계
- 마이그레이션 시스템 구축

## 체크리스트
- [ ] TypeORM 설치 및 설정
- [ ] 데이터베이스 모듈 생성
- [ ] 기본 Entity 생성
- [ ] 마이그레이션 스크립트 작성" \
  --label "backend-rebuild,backend,P0" \
  --milestone "Backend Rebuild - Phase 1: Foundation"

# Phase 2: Core Features 이슈들
gh issue create \
  --title "[Backend] 인증 시스템 구현 (Passport.js + JWT)" \
  --body "## 작업 내용
- Passport.js 설정
- Google OAuth 2.0 전략 구현
- JWT 토큰 발급/검증 시스템
- Refresh Token 구현

## 체크리스트
- [ ] AuthModule 생성
- [ ] Google OAuth 전략 구현
- [ ] JWT 서비스 구현
- [ ] 인증 가드 구현
- [ ] 테스트 작성" \
  --label "backend-rebuild,auth,P0" \
  --milestone "Backend Rebuild - Phase 2: Core Features"

gh issue create \
  --title "[Backend] 예약 시스템 핵심 기능 구현" \
  --body "## 작업 내용
- 예약 CRUD API
- 24시간 룰 비즈니스 로직
- KST 시간대 처리
- 예약 가능성 검증

## 체크리스트
- [ ] ReservationModule 생성
- [ ] Entity 및 DTO 정의
- [ ] 서비스 로직 구현
- [ ] 컨트롤러 구현
- [ ] 비즈니스 룰 검증
- [ ] 테스트 작성" \
  --label "backend-rebuild,domain: reservation,P0" \
  --milestone "Backend Rebuild - Phase 2: Core Features"

gh issue create \
  --title "[Backend] 기기 관리 시스템 구현" \
  --body "## 작업 내용
- 기기 CRUD API
- 카테고리/기종 관리
- 기기 상태 관리
- 대여 설정 관리

## 체크리스트
- [ ] DeviceModule 생성
- [ ] Entity 관계 설정
- [ ] 서비스 로직 구현
- [ ] 관리자 API 구현
- [ ] 테스트 작성" \
  --label "backend-rebuild,domain: device,P0" \
  --milestone "Backend Rebuild - Phase 2: Core Features"

# Phase 3: Admin Features 이슈들
gh issue create \
  --title "[Backend] 체크인 시스템 구현" \
  --body "## 작업 내용
- 체크인 프로세스 API
- 결제 확인 워크플로우
- 시간/금액 조정 기능
- 상태 관리 및 이력

## 체크리스트
- [ ] CheckinModule 생성
- [ ] 체크인 워크플로우 구현
- [ ] 결제 확인 로직
- [ ] 조정 기능 구현
- [ ] 이력 관리
- [ ] 테스트 작성" \
  --label "backend-rebuild,backend,P1" \
  --milestone "Backend Rebuild - Phase 3: Admin Features"

gh issue create \
  --title "[Backend] 대시보드 및 통계 API" \
  --body "## 작업 내용
- 실시간 현황 API
- 기간별 통계 집계
- 기기별/고객별 분석
- 성능 최적화 (캐싱)

## 체크리스트
- [ ] AnalyticsModule 생성
- [ ] 집계 쿼리 최적화
- [ ] 캐싱 전략 구현
- [ ] API 엔드포인트 구현
- [ ] 테스트 작성" \
  --label "backend-rebuild,domain: analytics,P1" \
  --milestone "Backend Rebuild - Phase 3: Admin Features"

# Phase 4: Advanced Features 이슈들
gh issue create \
  --title "[Backend] Socket.io 실시간 기능 구현" \
  --body "## 작업 내용
- Socket.io 통합
- 실시간 이벤트 시스템
- 예약/기기 상태 동기화
- 클라이언트 연결 관리

## 체크리스트
- [ ] WebSocket Gateway 구현
- [ ] 이벤트 정의 및 구현
- [ ] 인증/인가 처리
- [ ] 연결 상태 관리
- [ ] 테스트 작성" \
  --label "backend-rebuild,domain: realtime,P1" \
  --milestone "Backend Rebuild - Phase 4: Advanced & Production"

gh issue create \
  --title "[Backend] 데이터 마이그레이션 도구 개발" \
  --body "## 작업 내용
- Supabase → PostgreSQL 마이그레이션 스크립트
- 데이터 검증 도구
- 롤백 전략
- 점진적 마이그레이션 지원

## 체크리스트
- [ ] 마이그레이션 서비스 구현
- [ ] 배치 처리 로직
- [ ] 데이터 검증 도구
- [ ] 진행률 모니터링
- [ ] 롤백 스크립트" \
  --label "backend-rebuild,migration,P0" \
  --milestone "Backend Rebuild - Phase 4: Advanced & Production"

gh issue create \
  --title "[Backend] API 문서화 및 클라이언트 SDK 생성" \
  --body "## 작업 내용
- OpenAPI 3.0 스펙 생성
- Swagger UI 설정
- 타입스크립트 클라이언트 자동 생성
- API 버저닝 전략

## 체크리스트
- [ ] Swagger 모듈 설정
- [ ] API 문서 작성
- [ ] 클라이언트 SDK 생성 스크립트
- [ ] 사용 가이드 작성" \
  --label "backend-rebuild,docs,P1" \
  --milestone "Backend Rebuild - Phase 4: Advanced & Production"

echo "✅ GitHub 이슈 재구성 완료!"
echo "📊 생성된 마일스톤과 이슈를 확인하세요: https://github.com/hohihiho/gameplaza-booking-v2/issues"