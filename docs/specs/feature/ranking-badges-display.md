# Ranking & Badges Display (UI Spec)

## 개요
월간 대여 랭킹을 기반으로 사용자 배지를 표시합니다. (정책은 `user-management-role-policy.md` 참조)

## 표시 위치
- 랭킹 페이지: 사용자 리스트에 배지/순위/건수 표시
- 마이페이지: 내 배지와 현재 순위(있으면) 표시
- 프로필(사용자 카드): 배지 아이콘/라벨 표시

## 배지 규칙
- VIP: 월간 랭킹 1~5위 → `gp_vip`
- 단골: 월간 랭킹 6~20위 → `gp_regular`
- 일반: 그 외 → `gp_user`
- 제한: `restricted` → 배지 대신 제한 상태 경고(관리자/본인에만 노출)
- 슈퍼관리자: 운영자용 배지(내부 화면)

## API 연계(구현 현황)
- 랭킹 데이터(공개): `GET /api/v3/ranking?period=month` (page, pageSize, date 지원)
- 내 통계: `GET /api/v3/me/analytics/summary` → `monthly: { rank, count, start, end }` 필드 포함

## UI 요소
- 배지 스타일(예시)
  - VIP: 금색 배지/왕관 아이콘
  - 단골: 은색 배지/리본 아이콘
  - 일반: 기본 아이콘
- 툴팁: “월간 대여 랭킹 1~5위(VIP)” 등 기준 설명

## TODO
- 월간 배치(06:00 KST)로 자동 직급 부여(`gp_vip/gp_regular/gp_user`)
- 관리자 수동 트리거 API 추가(`/api/v3/admin/users/roles/rebuild` 등)
- 프론트 컴포넌트(배지, 리스트, 카드) 설계/적용
