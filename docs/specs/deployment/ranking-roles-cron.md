랭킹 기반 자동 직급 부여 – 크론 잡 가이드

개요
- 매일 정해진 시각(예: 06:00 KST)에 월간 랭킹을 집계하고 사용자 역할을 자동으로 갱신합니다.
- 이 레포에는 다음 엔드포인트가 이미 구현되어 있습니다.
  - 수동 트리거(관리자 전용): `GET /api/v3/admin/users/roles/rebuild?period=month&apply=true|false`
  - 크론 훅(비밀키 필요): `GET /api/cron/rebuild-roles` (헤더: `Authorization: Bearer <CRON_SECRET>`)

권장 시나리오
- Cloudflare D1을 사용한다면, Cloudflare Workers의 Cron Triggers로 스케줄링하는 것을 권장합니다.
- Next.js 앱을 Vercel에 배포한다면 Vercel Cron Jobs로 간편히 스케줄링할 수 있습니다.

시간대(표준)
- 크론은 보통 UTC 기준입니다. “매일 06:00 KST” = UTC로 “매일 21:00”
- 크론 표현식 예: `0 21 * * *`

1) Cloudflare Workers Cron Triggers

전제
- Cloudflare 계정 및 Wrangler CLI
- D1 바인딩을 사용하는 환경(선택 사항: 크론에서 직접 D1 접근 시)

선택 A – 기존 Next API를 호출(간편)
1. wrangler.toml 설정 예시
```
name = "rank-roles-cron"
main = "src/worker.ts"
compatibility_date = "2024-09-01"

[triggers]
crons = ["0 21 * * *"] # 매일 06:00 KST

[vars]
CRON_SECRET = "<랜덤_시크릿>"
APP_URL = "https://<your-app-domain>" # 예: Vercel 또는 Cloudflare Pages URL
```

2. Worker 코드 예시(`src/worker.ts`)
```
export default {
  async scheduled(event, env, ctx) {
    const url = `${env.APP_URL}/api/cron/rebuild-roles`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`rebuild-roles failed: HTTP ${res.status} ${body}`)
    }
  },
}
```

선택 B – D1에 직접 접근(고급)
- 장점: API 왕복 없이 내부에서 바로 D1 쿼리 실행
- 방법: `wrangler.toml`에 D1 바인딩 선언 후, Worker에서 `env.DB`를 이용해 집계 및 역할 갱신 SQL을 수행
- 이 레포는 API/헬퍼 레벨로 로직을 구현해두었으므로, 간단함/유지보수를 위해 “선택 A”를 권장합니다.

배포
- `wrangler deploy`
- Cloudflare 대시보드 → Workers & Pages → Triggers에서 스케줄 확인

2) Vercel Cron Jobs

전제
- 앱이 Vercel에 배포되어 있고, `/api/cron/rebuild-roles` 경로가 접근 가능해야 합니다.

설정 단계
1. 환경변수 설정
   - Vercel Project Settings → Environment Variables
   - `CRON_SECRET` = `<랜덤_시크릿>` (Production/Preview/Development 필요한 환경에 추가)
2. Cron Job 추가
   - Vercel Project Settings → Cron Jobs
   - Schedule: `0 21 * * *` (매일 06:00 KST)
   - Target: `GET /api/cron/rebuild-roles`
   - (선택) Headers: Authorization: `Bearer <CRON_SECRET>`
     - Vercel Cron UI에서 커스텀 헤더를 직접 넣을 수 없으면, 프로젝트 설정의 Vercel Secret을 통해 프록시 또는 환경변수로 검사하도록 구성합니다. 이 레포의 크론 훅은 `Authorization` 헤더를 요구하므로, 서버리스 플랫폼에서 헤더를 넣지 못한다면 대신 원격 Worker(Cloudflare 선택 A)로 호출을 위임하는 방식을 고려하세요.

3) 수동 트리거/검증 방법

수동(관리자 세션)
- 미리보기
```
GET /api/v3/admin/users/roles/rebuild?period=month&apply=false
```
- 적용
```
GET /api/v3/admin/users/roles/rebuild?period=month&apply=true
```

크론 훅 직접 호출(비밀키)
```
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://<app-domain>/api/cron/rebuild-roles
```

반영 규칙 요약
- 1~5위: `gp_vip`
- 6~20위: `gp_regular`
- 21위 이후: `gp_user`
- 예외: `super_admin` 보유자, 활성 제한/정지(`restricted`/`suspended`) 사용자는 갱신 제외
- 기존 `gp_*` 역할 제거 후 한 개만 부여

문제 해결(FAQ)
- 401/403: 크론 훅 호출 시 `Authorization` 헤더 누락 또는 잘못된 비밀
- 5xx: 일시적 오류. 앱 로그에서 `rebuild-roles` 호출 응답 본문 확인
- 랭킹 결과 비정상: D1 데이터(예약 집계) 및 집계 기간(start/end) 확인

보안 주의사항
- `CRON_SECRET`는 절대 공개 저장소에 커밋하지 않습니다.
- 트래픽/비용 보호를 위해 크론 훅은 반드시 비밀키로 보호하세요.

