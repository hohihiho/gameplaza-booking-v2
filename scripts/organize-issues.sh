#!/bin/bash
# GitHub Issues 자동 정리 스크립트

echo "🎯 게임플라자 이슈 정리 시작..."

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${BLUE}📊 현재 이슈 상태 분석${NC}"

# 전체 이슈 개수
TOTAL_OPEN=$(gh issue list --state open --limit 200 | wc -l | xargs)
TOTAL_CLOSED=$(gh issue list --state closed --limit 200 | wc -l | xargs)

echo "열린 이슈: $TOTAL_OPEN개"
echo "닫힌 이슈: $TOTAL_CLOSED개"

echo -e "\n${BLUE}🏷️ 우선순위별 이슈 정리${NC}"

# 높은 우선순위 이슈들에 ready 라벨 추가
echo -e "${YELLOW}높은 우선순위 이슈 처리 중...${NC}"

# DDD 관련 핵심 이슈들
CORE_ISSUES="60 61 63 69"
for issue in $CORE_ISSUES; do
  echo "이슈 #$issue 에 ready 라벨 추가..."
  gh issue edit $issue --add-label "status: ready" 2>/dev/null || true
done

echo -e "\n${BLUE}🎯 도메인별 라벨 추가${NC}"

# 도메인별 라벨 매핑
declare -A DOMAIN_MAPPING=(
  ["61"]="domain: reservation"
  ["62"]="domain: reservation"  
  ["63"]="domain: time"
  ["64"]="domain: auth"
  ["65"]="domain: device"
  ["66"]="domain: schedule"
  ["67"]="domain: analytics"
  ["68"]="domain: realtime"
)

for issue in "${!DOMAIN_MAPPING[@]}"; do
  label="${DOMAIN_MAPPING[$issue]}"
  echo "이슈 #$issue 에 $label 추가..."
  gh issue edit $issue --add-label "$label" 2>/dev/null || true
done

echo -e "\n${BLUE}📝 이슈 설명 업데이트${NC}"

# 첫 번째 이슈(#60)에 상세 설명 추가
gh issue comment 60 --body "## 🎯 작업 계획

### 1. 프로젝트 구조 생성
\`\`\`
src/
├── domain/           # 도메인 모델
├── application/      # 유스케이스
├── infrastructure/   # 외부 연동
└── presentation/     # API/UI
\`\`\`

### 2. DI 컨테이너 설정
- tsyringe 또는 inversify 도입
- 의존성 주입 패턴 구현

### 3. 기본 도메인 모델 정의
- Entity, ValueObject 베이스 클래스
- Repository 인터페이스

**예상 소요시간**: 2일
**담당자**: @hohihiho" 2>/dev/null || true

echo -e "\n${BLUE}🔄 기존 이슈 정리${NC}"

# 오래된 P0 이슈들 업데이트
OLD_ISSUES="50 54 55 56 57"
for issue in $OLD_ISSUES; do
  echo "이슈 #$issue 에 'needs-review' 라벨 추가..."
  gh issue edit $issue --add-label "needs-review" 2>/dev/null || true
done

echo -e "\n${BLUE}📊 정리 결과${NC}"

# 우선순위별 집계
echo -e "\n${GREEN}우선순위별 이슈:${NC}"
echo "🔴 Critical: $(gh issue list --label "priority: critical" --state open | wc -l | xargs)개"
echo "🟠 High: $(gh issue list --label "priority: high" --state open | wc -l | xargs)개"
echo "🟡 Medium: $(gh issue list --label "priority: medium" --state open | wc -l | xargs)개"
echo "🟢 Low: $(gh issue list --label "priority: low" --state open | wc -l | xargs)개"

echo -e "\n${GREEN}상태별 이슈:${NC}"
echo "🎯 Ready: $(gh issue list --label "status: ready" --state open | wc -l | xargs)개"
echo "🚧 In Progress: $(gh issue list --label "status: in-progress" --state open | wc -l | xargs)개"
echo "👀 Review: $(gh issue list --label "status: review" --state open | wc -l | xargs)개"
echo "🚫 Blocked: $(gh issue list --label "status: blocked" --state open | wc -l | xargs)개"

echo -e "\n${GREEN}✅ 이슈 정리 완료!${NC}"
echo "이제 GitHub Projects 보드에서 칼럼별로 정리하세요."