# Moderation Integration (AI + Manual Banned Words)

## 개요
- 수동 금지어(banned_words) + AI 비속어 모듈을 함께 사용합니다.
- API는 두 소스 결과를 병합하여 반환합니다.

## 설정 (선택)
- 환경 변수
  - `MODERATION_WEBHOOK_URL` (선택): 외부 욕설/비속어 감지 API 엔드포인트
  - `MODERATION_WEBHOOK_TOKEN` (선택): Bearer 토큰
- 설정이 없으면 AI 체크는 건너뛰고 수동 금지어만 검사합니다.

## 수동 금지어 관리 (관리자)
- 목록: GET `/api/v3/admin/banned-words`
- 추가: POST `/api/v3/admin/banned-words` { word, category?, severity?, is_active? }
- 수정/삭제: PUT/DELETE `/api/v3/admin/banned-words/:id`

## AI + 수동 검사 API
- POST `/api/v3/moderation/check`
- Body: { text }
- 응답: { matches, manual, ai }
  - matches: 병합 결과 (중복 제거)

## 참고
- 수동 금지어는 단순 포함(contains) 방식으로 검사합니다.
- AI는 외부 API 응답 형식 { matches: [{ word, category, severity }] }를 기대합니다.

