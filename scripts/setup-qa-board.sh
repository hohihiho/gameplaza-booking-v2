#!/bin/bash

# GitHub CLI를 사용한 QA 프로젝트 보드 설정 스크립트
# 사전 요구사항: gh CLI 설치 및 인증

echo "🎯 QA 프로젝트 보드 설정 시작..."

# 리포지토리 정보
OWNER="your-github-username"
REPO="gameplaza-v2"

# 프로젝트 보드 생성
echo "📋 QA 보드 생성 중..."
PROJECT_ID=$(gh api graphql -f query='
  mutation($projectName: String!, $repositoryId: ID!) {
    createProjectV2(input: {
      ownerId: $repositoryId,
      title: $projectName
    }) {
      projectV2 {
        id
      }
    }
  }' -f repositoryId="$(gh api repos/$OWNER/$REPO --jq .node_id)" -f projectName="QA Dashboard" --jq '.data.createProjectV2.projectV2.id')

echo "✅ 프로젝트 보드 생성 완료: $PROJECT_ID"

# 커스텀 필드 추가
echo "🏷️ 커스텀 필드 추가 중..."

# 심각도 필드
gh api graphql -f query='
  mutation($projectId: ID!) {
    addProjectV2ItemFieldValue(input: {
      projectId: $projectId,
      fieldName: "Severity",
      fieldType: SINGLE_SELECT,
      options: ["Critical", "High", "Medium", "Low"]
    }) {
      projectV2Item {
        id
      }
    }
  }' -f projectId="$PROJECT_ID"

# 테스트 환경 필드
gh api graphql -f query='
  mutation($projectId: ID!) {
    addProjectV2ItemFieldValue(input: {
      projectId: $projectId,
      fieldName: "Environment",
      fieldType: SINGLE_SELECT,
      options: ["Production", "Staging", "Development", "Local"]
    }) {
      projectV2Item {
        id
      }
    }
  }' -f projectId="$PROJECT_ID"

# 테스트 상태 필드
gh api graphql -f query='
  mutation($projectId: ID!) {
    addProjectV2ItemFieldValue(input: {
      projectId: $projectId,
      fieldName: "Test Status",
      fieldType: SINGLE_SELECT,
      options: ["Not Started", "In Progress", "Passed", "Failed", "Blocked"]
    }) {
      projectV2Item {
        id
      }
    }
  }' -f projectId="$PROJECT_ID"

echo "✅ 커스텀 필드 추가 완료"

# 뷰(View) 설정
echo "👁️ 뷰 설정 중..."

# 심각도별 뷰
gh api graphql -f query='
  mutation($projectId: ID!) {
    createProjectV2View(input: {
      projectId: $projectId,
      name: "By Severity",
      layout: BOARD,
      groupByField: "Severity"
    }) {
      view {
        id
      }
    }
  }' -f projectId="$PROJECT_ID"

# 테스트 상태별 뷰
gh api graphql -f query='
  mutation($projectId: ID!) {
    createProjectV2View(input: {
      projectId: $projectId,
      name: "By Test Status",
      layout: BOARD,
      groupByField: "Test Status"
    }) {
      view {
        id
      }
    }
  }' -f projectId="$PROJECT_ID"

echo "✅ 뷰 설정 완료"

# 라벨 생성
echo "🏷️ QA 관련 라벨 생성 중..."

# 라벨 배열
labels=(
  "qa:critical:FF0000"
  "qa:high:FF6B6B"
  "qa:medium:FFD93D"
  "qa:low:6BCF7F"
  "qa:in-progress:0E7EFF"
  "qa:blocked:666666"
  "qa:passed:22C55E"
  "qa:failed:EF4444"
  "qa:regression:9333EA"
  "qa:smoke-test:F59E0B"
  "qa:integration:3B82F6"
  "qa:ui-ux:EC4899"
  "qa:performance:10B981"
  "qa:security:DC2626"
)

for label in "${labels[@]}"; do
  IFS=':' read -r prefix name color <<< "$label"
  full_name="${prefix}:${name}"
  
  gh label create "$full_name" --color "$color" --description "QA ${name} 이슈" 2>/dev/null || echo "라벨 이미 존재: $full_name"
done

echo "✅ 라벨 생성 완료"

echo "
🎉 QA 보드 설정 완료!

다음 단계:
1. GitHub에서 프로젝트 보드 확인: https://github.com/$OWNER/$REPO/projects
2. 팀원들에게 보드 사용법 공유
3. QA 프로세스 문서화

QA 이슈 생성 예시:
gh issue create --title '[QA-BUG] 로그인 버튼 클릭 안됨' --label 'qa:critical,bug' --body '...'
"