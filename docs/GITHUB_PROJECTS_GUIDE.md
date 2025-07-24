# GitHub Projects v2 사용 가이드

> 프로젝트 URL: https://github.com/users/hohihiho/projects/3
> 프로젝트명: 게임플라자 개발 보드

## 📋 프로젝트 설정 방법

### 1. 프로젝트 접속
1. https://github.com/users/hohihiho/projects/3 접속
2. 또는 GitHub 프로필 → Projects 탭 → "게임플라자 개발 보드" 클릭

### 2. 보드 뷰 설정
1. 상단의 "New view" 클릭
2. "Board" 선택
3. 이름: "칸반 보드"로 설정

### 3. 컬럼 구성
다음 컬럼들을 생성하세요:

1. **📋 Backlog** - 아직 시작 안 한 작업
2. **📝 Todo** - 이번 스프린트 작업
3. **🚀 In Progress** - 진행 중 (한도: 3개)
4. **👀 Review** - 리뷰/테스트 중
5. **✅ Done** - 완료

### 4. 커스텀 필드 추가
Settings → Custom fields에서 추가:

- **Priority**: Single select
  - 🔴 P0 (긴급)
  - 🟡 P1 (높음)
  - 🟢 P2 (보통)
  
- **Estimate**: Number
  - 예상 작업 시간 (시간 단위)
  
- **Sprint**: Single select
  - Sprint 1 (Week 1)
  - Sprint 2 (Week 2)
  - Sprint 3 (Week 3)
  - Sprint 4 (Week 4)

### 5. 자동화 설정
Settings → Workflows에서 설정:

1. **Auto-add to project**
   - 새 이슈 생성 시 자동으로 Backlog에 추가

2. **Auto-archive items**
   - Done 상태 2주 후 자동 아카이브

## 🎯 이슈 추가 방법

### CLI로 이슈 추가
```bash
# 프로젝트에 기존 이슈 추가
gh project item-add 3 --owner hohihiho --url https://github.com/hohihiho/gameplaza-booking-v2/issues/10

# 여러 이슈 한번에 추가 (MVP 이슈들)
for issue in 10 12 13 15 16 17 18 19 20 21 24 27 44 50 54 56 57 36; do
  gh project item-add 3 --owner hohihiho --url https://github.com/hohihiho/gameplaza-booking-v2/issues/$issue
done
```

### 웹에서 이슈 추가
1. 프로젝트 페이지에서 "Add item" 클릭
2. 저장소 선택: hohihiho/gameplaza-booking-v2
3. 이슈 검색 또는 번호 입력

## 📊 사용 방법

### 일일 워크플로우
1. **아침 스탠드업**
   - In Progress 항목 확인
   - 블로커 확인
   - 오늘 Todo 선택

2. **작업 시작**
   - Todo → In Progress로 이동
   - 담당자 지정
   - 예상 시간 입력

3. **작업 완료**
   - In Progress → Review로 이동
   - PR 링크 추가
   - 리뷰어 지정

4. **리뷰 완료**
   - Review → Done으로 이동
   - 실제 소요 시간 기록

### 필터 활용
- **내 작업만 보기**: `assignee:@me`
- **MVP 이슈만**: `milestone:"MVP 2025-02"`
- **긴급 작업**: `label:P0`
- **이번 주 작업**: `sprint:"Sprint 1"`

### 진행률 확인
- Insights 탭에서 번다운 차트 확인
- 스프린트별 완료율 추적
- 병목 구간 파악

## 🔧 CLI 명령어 모음

```bash
# 프로젝트 목록 보기
gh project list --owner hohihiho

# 프로젝트 상세 보기
gh project view 3 --owner hohihiho

# 아이템 추가
gh project item-add 3 --owner hohihiho --url [이슈 URL]

# 프로젝트 필드 업데이트
gh project item-edit --project-id 3 --owner hohihiho --id [ITEM_ID] --field-id [FIELD_ID] --text "In Progress"
```

## 💡 팁

1. **WIP 제한**: In Progress는 최대 3개까지만
2. **일일 업데이트**: 매일 보드 상태 업데이트
3. **블로커 표시**: 막힌 작업은 코멘트로 표시
4. **스프린트 계획**: 매주 월요일 스프린트 계획 회의

## 🔗 관련 링크

- 프로젝트 URL: https://github.com/users/hohihiho/projects/3
- 이슈 목록: https://github.com/hohihiho/gameplaza-booking-v2/issues
- 마일스톤: https://github.com/hohihiho/gameplaza-booking-v2/milestones

---

이제 웹 브라우저에서 프로젝트 페이지를 열고 위 가이드를 따라 설정하세요!