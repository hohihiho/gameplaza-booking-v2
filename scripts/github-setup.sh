#!/bin/bash
# GitHub 프로젝트 초기 설정 스크립트

echo "🎯 게임플라자 GitHub 프로젝트 설정 시작..."

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 리포지토리 정보
OWNER="hohihiho"
REPO="gameplaza-booking-v2"

echo -e "\n${BLUE}📌 라벨 생성 중...${NC}"

# 기존 기본 라벨 삭제 (선택사항)
# gh label delete "bug" --yes 2>/dev/null
# gh label delete "documentation" --yes 2>/dev/null
# gh label delete "duplicate" --yes 2>/dev/null
# gh label delete "enhancement" --yes 2>/dev/null
# gh label delete "good first issue" --yes 2>/dev/null
# gh label delete "help wanted" --yes 2>/dev/null
# gh label delete "invalid" --yes 2>/dev/null
# gh label delete "question" --yes 2>/dev/null
# gh label delete "wontfix" --yes 2>/dev/null

# 타입 라벨
gh label create "type: feature" --color "0e8a16" --description "새로운 기능" 2>/dev/null
gh label create "type: bug" --color "d73a4a" --description "버그 수정" 2>/dev/null
gh label create "type: refactor" --color "0075ca" --description "코드 개선" 2>/dev/null
gh label create "type: docs" --color "0052cc" --description "문서화" 2>/dev/null
gh label create "type: test" --color "fbca04" --description "테스트" 2>/dev/null
gh label create "type: chore" --color "fef2c0" --description "기타 작업" 2>/dev/null

# 우선순위 라벨
gh label create "priority: critical" --color "b60205" --description "즉시 해결 필요" 2>/dev/null
gh label create "priority: high" --color "d93f0b" --description "높은 우선순위" 2>/dev/null
gh label create "priority: medium" --color "fbca04" --description "중간 우선순위" 2>/dev/null
gh label create "priority: low" --color "c2e0c6" --description "낮은 우선순위" 2>/dev/null

# 상태 라벨
gh label create "status: ready" --color "0e8a16" --description "작업 준비됨" 2>/dev/null
gh label create "status: in-progress" --color "0075ca" --description "진행 중" 2>/dev/null
gh label create "status: review" --color "5319e7" --description "리뷰 중" 2>/dev/null
gh label create "status: blocked" --color "d73a4a" --description "차단됨" 2>/dev/null

# 도메인 라벨
gh label create "domain: reservation" --color "006b75" --description "예약 시스템" 2>/dev/null
gh label create "domain: auth" --color "f9a825" --description "인증/인가" 2>/dev/null
gh label create "domain: device" --color "22a2c4" --description "기기 관리" 2>/dev/null
gh label create "domain: analytics" --color "5319e7" --description "통계/분석" 2>/dev/null
gh label create "domain: realtime" --color "28a745" --description "실시간 동기화" 2>/dev/null

# 기타 유용한 라벨
gh label create "good first issue" --color "7057ff" --description "초보자에게 좋은 이슈" 2>/dev/null
gh label create "help wanted" --color "008672" --description "도움 필요" 2>/dev/null
gh label create "mobile" --color "eb6420" --description "모바일 관련" 2>/dev/null
gh label create "performance" --color "d4c5f9" --description "성능 개선" 2>/dev/null
gh label create "security" --color "ee0701" --description "보안 관련" 2>/dev/null

echo -e "${GREEN}✅ 라벨 생성 완료!${NC}"

echo -e "\n${BLUE}🏁 마일스톤 생성 중...${NC}"

# 마일스톤 생성
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/$OWNER/$REPO/milestones \
  -f title='DDD 아키텍처 전환' \
  -f description='도메인 주도 설계로 전체 아키텍처 리팩토링' \
  -f due_on='2025-08-31T00:00:00Z' \
  -f state='open' 2>/dev/null

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/$OWNER/$REPO/milestones \
  -f title='MVP 출시' \
  -f description='최소 기능 제품 출시' \
  -f due_on='2025-09-30T00:00:00Z' \
  -f state='open' 2>/dev/null

echo -e "${GREEN}✅ 마일스톤 생성 완료!${NC}"

echo -e "\n${BLUE}📋 이슈 템플릿 생성 중...${NC}"

# .github/ISSUE_TEMPLATE 디렉토리 생성
mkdir -p .github/ISSUE_TEMPLATE

# 기능 개발 템플릿
cat > .github/ISSUE_TEMPLATE/feature.md << 'EOF'
---
name: 기능 개발
about: 새로운 기능 제안
title: '[Feature] '
labels: 'type: feature'
assignees: ''
---

## 📋 개요
<!-- 기능에 대한 간단한 설명 -->

## 🎯 목표
- [ ] 구체적인 목표 1
- [ ] 구체적인 목표 2

## 📐 기술 사양
- **영향받는 컴포넌트**: 
- **필요한 API**: 
- **데이터베이스 변경사항**: 

## ✅ 완료 조건
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트

## 🔗 관련 이슈
<!-- 
- Related to #
- Blocks #
- Blocked by #
-->
EOF

# 버그 리포트 템플릿
cat > .github/ISSUE_TEMPLATE/bug.md << 'EOF'
---
name: 버그 리포트
about: 버그 발견 시 사용
title: '[Bug] '
labels: 'type: bug'
assignees: ''
---

## 🐛 버그 설명
<!-- 버그에 대한 명확한 설명 -->

## 🔄 재현 방법
1. 
2. 
3. 

## 💡 예상 동작
<!-- 올바른 동작 설명 -->

## 🖼️ 스크린샷
<!-- 가능하다면 스크린샷 첨부 -->

## 🌍 환경
- **브라우저**: 
- **OS**: 
- **기기**: 
- **버전**: 
EOF

echo -e "${GREEN}✅ 이슈 템플릿 생성 완료!${NC}"

echo -e "\n${BLUE}🎯 DDD 리팩토링 이슈 생성 중...${NC}"

# DDD 이슈들 생성
declare -a issues=(
  "프로젝트 구조 및 의존성 주입 컨테이너 설정|DDD 기반 프로젝트 구조 생성 및 의존성 주입(DI) 컨테이너 구현. 도메인별 디렉토리 구조를 생성하고, 의존성 관리를 위한 IoC 컨테이너를 설정합니다.|type: refactor,priority: high"
  "예약 도메인 모델 및 인터페이스 정의|예약 도메인의 엔티티, 값 객체, 리포지토리 인터페이스, 유스케이스 인터페이스를 TDD 방식으로 정의합니다.|type: refactor,domain: reservation,priority: high"
  "예약 생성 유스케이스 TDD 구현|예약 생성 유스케이스를 TDD 방식으로 구현합니다. 기존 createReservation 로직을 작은 단위로 분해하여 테스트 가능한 구조로 만듭니다.|type: refactor,domain: reservation,type: test"
  "시간 도메인 모델 및 서비스 구현|KST 고정, 24-29시 표시, 영업일 처리를 담당하는 시간 도메인을 구현합니다. 기존 시간 유틸리티를 도메인 서비스로 승격시킵니다.|type: refactor,priority: high"
  "인증/인가 도메인 구현|사용자 인증 및 권한 관리를 담당하는 도메인을 구현합니다. 기존 인증 미들웨어를 도메인 서비스로 리팩토링합니다.|type: refactor,domain: auth,priority: medium"
  "기기 관리 도메인 구현|3단계 계층 구조(카테고리 > 타입 > 기기)를 가진 기기 관리 도메인을 구현합니다.|type: refactor,domain: device"
  "운영 일정 도메인 구현|영업시간, 휴무일, 특별 이벤트 등 운영 일정을 관리하는 도메인을 구현합니다.|type: refactor,priority: medium"
  "통계 및 분석 도메인 구현|예약, 매출, 기기 사용률 등의 통계를 계산하고 분석하는 도메인을 구현합니다.|type: refactor,domain: analytics,priority: low"
  "실시간 동기화 도메인 구현|Supabase Realtime을 활용한 실시간 동기화 도메인을 구현합니다. 도메인 이벤트를 실시간으로 전파합니다.|type: refactor,domain: realtime"
  "API 라우트 마이그레이션 및 통합 테스트|기존 API 라우트를 새로운 도메인 유스케이스 호출로 마이그레이션하고, 전체 시스템의 통합 테스트를 작성합니다.|type: refactor,type: test,priority: high"
)

for issue_data in "${issues[@]}"; do
  IFS='|' read -r title body labels <<< "$issue_data"
  echo -e "${YELLOW}📝 생성 중: $title${NC}"
  
  gh issue create \
    --title "$title" \
    --body "$body" \
    --label "$labels" \
    --milestone "DDD 아키텍처 전환" 2>/dev/null
    
  sleep 1  # API 제한 방지
done

echo -e "${GREEN}✅ 이슈 생성 완료!${NC}"

echo -e "\n${BLUE}📊 GitHub Project 생성 안내${NC}"
echo "GitHub Projects는 웹에서 직접 생성해야 합니다:"
echo "1. https://github.com/$OWNER/$REPO/projects 접속"
echo "2. 'New project' 클릭"
echo "3. 'Board' 템플릿 선택"
echo "4. 프로젝트명: '게임플라자 개발 보드'"
echo "5. 칼럼 구성: Backlog → Ready → In Progress → In Review → Done"

echo -e "\n${GREEN}🎉 모든 설정이 완료되었습니다!${NC}"
echo -e "${BLUE}이제 'gh issue list'로 생성된 이슈를 확인하세요.${NC}"