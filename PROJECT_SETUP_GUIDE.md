# 🎮 게임플라자 GitHub Projects 세팅 가이드

## 📋 Step 1: 프로젝트 생성 (수동)

1. **브라우저에서 열기**: https://github.com/hohihiho/gameplaza-booking-v2/projects
2. **"New project" 클릭**
3. **설정값 입력**:
   - Project name: `게임플라자 개발 보드`
   - Template: `Board`
   - Description: 
   ```
   광주 게임플라자 예약 시스템 개발 관리
   - DDD 아키텍처 전환 진행 중
   - 모바일 퍼스트 개발
   ```

4. **Create project 클릭**

## 📊 Step 2: 칼럼 설정 (자동화 가능)

프로젝트 생성 후 다음 칼럼들을 설정:

| 칼럼명 | 설명 | 자동화 규칙 |
|--------|------|------------|
| 📋 Backlog | 새로운 이슈 | 새 이슈 생성 시 자동 추가 |
| 🎯 Todo | 우선순위 정해진 작업 | `status: ready` 라벨 추가 시 |
| 🚧 In Progress | 진행 중 | Assignee 할당 시 |
| 👀 In Review | 리뷰 대기 | PR 생성 시 |
| ✅ Done | 완료 | 이슈 Close 시 |

## 🤖 Step 3: 자동화 워크플로우 설정

각 칼럼에서 `...` 메뉴 → `Set limit` & `Manage automation` 클릭

### Backlog 자동화
- ✅ **Item added to project** → Set status to "Backlog"

### Todo 자동화  
- ✅ **Label added** → If label is `status: ready` → Move to "Todo"
- ✅ **Priority changed** → If priority is `high` → Move to top

### In Progress 자동화
- ✅ **Assignee added** → Move to "In Progress"
- ✅ **Label added** → If label is `status: in-progress` → Move here
- 🔢 **Set limit**: 3 (동시 작업 제한)

### In Review 자동화
- ✅ **Pull request opened** → Move linked issues here
- ✅ **Label added** → If label is `status: review` → Move here

### Done 자동화
- ✅ **Issue closed** → Move to "Done"
- ✅ **Pull request merged** → Move to "Done"
- 📅 **Archive items** → After 2 weeks

## 🏷️ Step 4: 커스텀 필드 추가

프로젝트 Settings → Fields에서 추가:

1. **추정 시간** (Number)
   - Field name: `Estimate (hours)`
   - Description: 예상 작업 시간

2. **실제 시간** (Number)
   - Field name: `Actual (hours)`
   - Description: 실제 소요 시간

3. **진행률** (Single select)
   - Options: 0%, 25%, 50%, 75%, 100%

4. **블로커** (Text)
   - Field name: `Blocker`
   - Description: 작업 진행을 막는 이슈

5. **도메인** (Single select)
   - Options: 예약, 인증, 기기관리, 통계, 실시간, 기타

## 📈 Step 5: 뷰(View) 생성

### 우선순위 뷰
- **이름**: 🔥 High Priority
- **Layout**: Board
- **Group by**: Priority
- **Filter**: `is:open label:priority:high,priority:critical`

### 도메인별 뷰  
- **이름**: 🏗️ By Domain
- **Layout**: Board
- **Group by**: Labels (domain:*)
- **Sort**: Priority ↓

### 내 작업 뷰
- **이름**: 👤 My Tasks
- **Layout**: Table
- **Filter**: `assignee:@me is:open`
- **Sort**: Updated ↓

### 이번 주 완료
- **이름**: ✅ This Week Done
- **Layout**: Table
- **Filter**: `is:closed closed:>1 week ago`

## 🎯 Step 6: 이슈 일괄 추가 스크립트

프로젝트 ID 확인 후 실행:
```bash
# 프로젝트 번호는 URL에서 확인 (예: /projects/3)
PROJECT_NUMBER=3

# 모든 열린 이슈 추가
gh issue list --state open --limit 100 --json number -q '.[].number' | \
while read issue; do
  echo "Adding issue #$issue to project..."
  gh api graphql -f query='
    mutation {
      addProjectV2ItemById(input: {
        projectId: "PVT_kwDOPCLrGM4ApYkN"
        contentId: "I_kwDOPCLrGM6hwQJx"
      }) {
        item {
          id
        }
      }
    }'
done
```

## 🔍 Step 7: 검증 체크리스트

- [ ] 모든 칼럼이 생성되었나?
- [ ] 자동화 규칙이 작동하나?
- [ ] 이슈들이 적절한 칼럼에 있나?
- [ ] 우선순위 높은 이슈가 Todo에 있나?
- [ ] 커스텀 필드가 추가되었나?

## 💡 사용 팁

1. **매일 아침**: Todo 칼럼 확인 → 오늘 할 일 In Progress로
2. **작업 완료**: 바로 Done으로 이동 (자동화됨)
3. **주간 계획**: Backlog → Todo 우선순위 정리
4. **블로커 발생**: Blocker 필드에 기록 & 팀 공유

---
준비되면 이 가이드를 따라 설정하세요!