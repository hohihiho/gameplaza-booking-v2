# GitHub Projects 보드 자동화 설정

## 프로젝트 생성 후 다음 설정을 추가하세요:

### 1. 자동화 워크플로우 설정

#### Backlog → Ready
- 트리거: 라벨 "status: ready" 추가 시
- 액션: Ready 칼럼으로 이동

#### Ready → In Progress
- 트리거: Assignee 할당 시
- 액션: In Progress 칼럼으로 이동

#### In Progress → In Review
- 트리거: PR 생성 시
- 액션: In Review 칼럼으로 이동

#### In Review → Done
- 트리거: PR 머지 시
- 액션: Done 칼럼으로 이동

### 2. 뷰(View) 추가

#### 우선순위 뷰
- 그룹화: priority 라벨
- 정렬: 생성일 내림차순
- 필터: 열린 이슈만

#### 도메인별 뷰
- 그룹화: domain 라벨
- 정렬: 우선순위
- 필터: 열린 이슈만

#### 스프린트 뷰
- 그룹화: 마일스톤
- 정렬: 우선순위
- 필터: 현재 스프린트

### 3. 필드 추가

- **예상 시간**: 숫자 필드 (시간 단위)
- **실제 시간**: 숫자 필드 (시간 단위)
- **진행률**: 단일 선택 (0%, 25%, 50%, 75%, 100%)
- **블로커**: 텍스트 필드

### 4. 이슈 일괄 추가

프로젝트 보드에서 "Add items" 클릭 후:
- 리포지토리: gameplaza-booking-v2
- 필터: is:open
- 모든 열린 이슈 선택 → Add

### 5. 팀 멤버 추가

Settings → Manage access에서:
- 팀 멤버들에게 Write 권한 부여
- 필요시 외부 협력자 추가

## 자동화 스크립트

프로젝트 ID를 얻은 후 다음 스크립트로 자동화:

```bash
# 프로젝트 ID 확인
gh project list

# 모든 이슈를 프로젝트에 추가
gh issue list --limit 100 --json number -q '.[].number' | \
while read issue; do
  gh project item-add PROJECT_ID --owner hohihiho --url https://github.com/hohihiho/gameplaza-booking-v2/issues/$issue
done
```