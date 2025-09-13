Vercel 환경변수 일괄 등록(텍스트 파일) 가이드

개요
- Vercel UI에서 텍스트(.txt) 파일을 업로드해 환경변수를 한 번에 등록할 수 있습니다.
- 이 레포에는 각 환경별 샘플 파일을 제공합니다.

파일 형식
- KEY=VALUE 형식의 줄 단위 텍스트
- 주석은 `#`로 시작(무시됨)

샘플 파일(이 레포 포함)
- Production: `docs/specs/deployment/vercel-env.production.txt`
- Preview: `docs/specs/deployment/vercel-env.preview.txt`
- Development: `docs/specs/deployment/vercel-env.development.txt`

등록 방법(UI)
1) Vercel → Project → Settings → Environment Variables
2) Import(또는 Bulk Edit / Import Variables) 버튼 선택
3) 대상 환경(Production / Preview / Development) 선택
4) 해당하는 txt 파일 업로드 → Import

권장 키(현 구성: Better Auth + Cloudflare)
- 필수
  - `BETTER_AUTH_URL` (예: https://your-project.vercel.app)
  - `NEXT_PUBLIC_APP_URL` (동일 URL)
  - `DATABASE_URL` (Better Auth/앱 DB)
  - `CRON_SECRET` (크론 훅 보호)
- 선택
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (구글 로그인 사용 시)
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (PWA 푸시 사용 시)
  - `NEXT_PUBLIC_HOLIDAY_API_KEY` (공휴일 API 사용 시)

주의
- 시크릿 값은 코드 저장소에 커밋하지 마세요. 샘플 파일의 `<...>` 자리만 실제 Vercel에서 채워 사용하세요.
- 프리뷰/개발 환경에서도 `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL`을 해당 배포 URL로 맞춰주세요.

