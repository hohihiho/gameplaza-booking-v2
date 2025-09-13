# Moderation Worker (Perspective Proxy)

무료 할당으로 사용할 수 있는 Google Perspective API를 Cloudflare Worker로 프록시합니다.

## 개요
- 우리 서버 → Worker(Webhook) → Perspective API
- 서버에서는 `MODERATION_WEBHOOK_URL`/`MODERATION_WEBHOOK_TOKEN`으로 연결
- 수동 금지어 + AI 결과를 병합하여 사용

## 코드 위치
- `workers/moderation-worker.js`

## 환경 변수(Worker)
- `PERSPECTIVE_API_KEY` (필수): Google Perspective API 키
- `WEBHOOK_TOKEN` (선택): 서버에서 전송하는 Bearer 토큰 검증
- `TOXICITY_THRESHOLD` (선택): 기본 0.8

## wrangler.toml 예시
```
name = "moderation-worker"
main = "workers/moderation-worker.js"
compatibility_date = "2024-09-01"

[vars]
TOXICITY_THRESHOLD = "0.8"

[env.production.vars]
# production-only overrides if needed
```

설정:
- `wrangler secret put PERSPECTIVE_API_KEY`
- (선택) `wrangler secret put WEBHOOK_TOKEN`

## 서버 연동(우리 앱)
- `.env`
  - `MODERATION_WEBHOOK_URL=https://<your-worker>.<subdomain>.workers.dev`
  - (선택) `MODERATION_WEBHOOK_TOKEN=<same as WEBHOOK_TOKEN>`
- API: `POST /api/v3/moderation/check` { text }
- 응답: { matches, manual, ai }

## 테스트 절차
1) Worker 배포 후 curl:
```
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <WEBHOOK_TOKEN>" \
  -d '{"text":"you are an idiot"}' \
  https://<your-worker>.workers.dev
```
2) 우리 서버에서:
```
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"you are an idiot"}' \
  https://<host>/api/v3/moderation/check
```

## 참고
- 무료 할당 내에서 충분히 사용 가능. 호출 수가 많아질 경우 서버 캐싱/임계치 조절.
- 한국어/영어 동시 요청으로 어느 정도 한국어도 필터링됨.

