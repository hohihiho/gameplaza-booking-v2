Cloudflare Worker: DB API (D1)

Overview
- Exposes D1-backed endpoints for the Next.js app to consume via HTTP.
- Routes:
  - Public: `GET /public/schedule?year&month` (scheduleEvents, reservations, devices)
  - CMS Contents: `GET /guide-contents?category=slug`, `POST /guide-contents`, `PUT /guide-contents/:id`, `DELETE /guide-contents/:id`
  - CMS Categories: `GET /guide-categories`, `POST /guide-categories`, `PUT /guide-categories/:id`, `DELETE /guide-categories/:id`

Prerequisites
- Cloudflare account with D1 enabled
- `wrangler` CLI (will auto-run via `npx` in npm scripts)
- (optional) Cloudflare KV for caching

Setup Steps
1) Create D1 database (already provided)
   - Dev: `gameplaza-development` → id: `d8bb6ff7-b731-4d5a-b22f-4b3e41c9ed8e`
   - Prod: `gameplaza-production` → id: `1d59afcb-f4c2-4d1c-9532-a63bd124bf97`
   - These are wired in `workers/db-api/wrangler.toml`.

2) Push schema
   - Dev: `npm run db-api:push-schema:dev`
   - Prod: `npm run db-api:push-schema:prod`
   - (optional) device catalog
     - Dev: `npm run db-api:push-device-catalog:dev`
     - Prod: `npm run db-api:push-device-catalog:prod`

3) Dev/Deploy the worker
   - Dev: `npm run db-api:dev`
   - Deploy (dev env): `npm run db-api:deploy`
   - Deploy (prod env): `npm run db-api:deploy:prod`

4) Wire Next.js to the worker
   - Add to `.env.local`:
     - `CF_DB_API_BASE=https://<your-worker-subdomain>.workers.dev`
   - Restart Next dev server: `npm run dev`

Notes
- You can override the DB name used by migration scripts with `D1_DB_NAME` env var.
- CORS is permissive (`*`) for ease of local dev; consider locking down origins for production.

Admin protection
- The worker expects an admin token on POST/PUT/DELETE for CMS routes:
  - Header: `Authorization: Bearer <token>`
  - Configure secret in Worker: `npx wrangler secret put ADMIN_API_TOKEN`
- Next.js proxies will forward `CMS_ADMIN_TOKEN` if set in `.env.local`.

Seeding CMS categories
- Dev: `npm run db-api:seed-cms:dev`
- Prod: `npm run db-api:seed-cms:prod`

KV Cache (optional)
- Create namespaces:
  - Dev: `npx wrangler kv namespace create GAMEPLAZA_DB_API_CACHE_DEV`
  - Prod: `npx wrangler kv namespace create GAMEPLAZA_DB_API_CACHE_PROD`
- Put the generated IDs into `workers/db-api/wrangler.toml` under `[[kv_namespaces]]` and `[[env.production.kv_namespaces]]` (binding "CACHE").
- The worker will cache monthly schedule responses at key `public:schedule:<year>-<month>` for ~10 minutes.
