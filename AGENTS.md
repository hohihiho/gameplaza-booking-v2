# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, API routes (e.g., `app/api/v2/...`).
- `components/` and `app/components/`: Reusable UI and domain components.
- `lib/`, `hooks/`, `types/`: Shared utilities, React hooks, and TypeScript types.
- `public/`: Static assets.
- `tests/`: Jest unit/integration tests; e2e under Playwright specs.
- `cypress/`: Optional Cypress specs/utilities.
- `scripts/`: Dev, DB, and maintenance scripts (TypeScript/Node).
- `docs/`: Developer docs, QA, and test strategy notes.

Aliases: Use `@/*` (root), with patterns like `@/components/...`, `@/lib/...` per `tsconfig.json`.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev (opens in browser via script).
- `npm run dev:no-browser`: Next.js dev without auto-open.
- `npm run build` / `npm start`: Production build and serve.
- `npm run lint` / `npm run type-check`: ESLint and TypeScript checks.
- `npm test`: Jest tests; `npm run test:watch`, `test:coverage`.
- `npm run test:e2e`: Playwright tests; `test:e2e:ui`, `test:e2e:debug`.
- DB utilities: `npm run seed`, `seed:superadmin`, `backup`, `restore`.

## Coding Style & Naming Conventions
- TypeScript, strict mode on. Prefer explicit types at module boundaries.
- Prettier: 2 spaces, single quotes, no semicolons, width 100.
- ESLint: extends `next/core-web-vitals`; enforce `prefer-const`, `no-duplicate-imports`, React hooks rules.
- Naming: kebab-case for files, PascalCase for components, camelCase for functions/vars. Test files: `*.test.ts(x)`.

## Testing Guidelines
- Unit/integration: place in `tests/unit` and `tests/integration` (or close to feature under `__tests__` when appropriate).
- E2E: Playwright specs under `tests/e2e`.
- Run locally: `npm test` and `npm run test:e2e`. For coverage: `npm run test:coverage`.
- Prefer Testing Library for React components; mock external IO.

## Commit & Pull Request Guidelines
- Commits: Conventional style (e.g., `feat:`, `fix:`, `perf:`, `chore:`). Use imperative present and scoped descriptions.
- Before PR: run `npm run type-check && npm run lint && npm test`.
- PRs: include a clear description, linked issues, screenshots for UI, and a brief test plan (commands and scenarios).

## Security & Configuration
- Use `.env.local` for secrets (never commit secrets). See `.env.example` for required keys.
- Supabase: verify schema and types via `npm run verify-schema` and `npm run generate-types` when schema changes.
