# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A NIS2 (EU cybersecurity directive) compliance management platform. It is a **monorepo**:

- **Backend** (repo root) — Express + TypeScript + Prisma/PostgreSQL REST API under `/api/v1`.
- **Frontend** (`frontend/`) — Vite + React 18 + TanStack Query + Tailwind SPA that consumes the API. UI is entirely in French.

The two halves have separate `package.json` files and separate `node_modules`. The root `Makefile` orchestrates both and is the fastest way to get oriented (`make help`).

## Commands

Run from the repo root unless noted. `make` targets wrap both halves; raw `npm` commands act on one.

```bash
make setup        # install backend+frontend deps, prisma db push, seed  (first-time bootstrap)
make dev          # run API (:3000) AND frontend (:5173) together
make build        # build both; make lint / make typecheck likewise cover both

# Backend (root package.json)
npm run dev               # API only, hot-reload, :3000
npm run build             # tsc -> dist/
npm run lint              # eslint, zero-warning gate (lint:fix to autofix)
npm run type-check        # tsc --noEmit
npm run format            # prettier --write (format:check in CI)

# Frontend (cd frontend first)
npm run dev               # Vite dev server :5173, proxies /api -> :3000
npm run build             # tsc && vite build
npm run lint / type-check
```

### Database / Prisma

This project syncs the schema with **`prisma db push`**, not migrations. `npm run migrate` exists but the README, Makefile, Docker, and deploy paths all use `db push`. After any change to `prisma/schema.prisma`:

```bash
npm run generate          # regenerate the Prisma client (do this after schema edits)
npx prisma db push        # apply schema to the DB
npm run seed              # idempotent: NIS2 controls + admin/demo data
```

### Tests

Three tiers, each with its own runner:

```bash
# Unit — mocks Prisma; covers services/utils/middleware; 70% coverage gate
npm test
npm run test:coverage
npm test -- tests/unit/risk.service.test.ts        # single file
npm test -- -t "calculates risk score"             # single test by name

# Integration — real PostgreSQL, supertest against the Express app, serial
npm run test:integration

# E2E — Playwright (Chromium) against the full stack, from frontend/
cd frontend && npx playwright install chromium      # first run only
cd frontend && npm run test:e2e
```

- **Unit** config: `jest.config.ts`. It ignores `tests/integration/`, so `npm test` never touches a DB.
- **Integration** config: `jest.integration.config.ts`. `tests/integration/setup.ts` sets env vars (incl. a default `DATABASE_URL` of `postgresql://nis2:nis2@localhost:5433/nis2_test`) **before** any app module loads — required because `src/config/env.ts` validates env at import time and exits on failure. `tests/integration/helpers/db.ts#resetDatabase` truncates tables in FK order between tests.
- **E2E** needs the backend on `:3000` already running and seeded; Playwright auto-starts the Vite server. See `frontend/playwright.config.ts`.

## Backend architecture

Each domain lives in `src/modules/<name>/` as four files with strict layering: **`routes → controller → service → Prisma`**.

- **routes** — wire URLs to controllers and stack middleware. Convention: `router.use(authenticate)` to protect the whole module, then per-route `authorize(Role.X, ...)` for RBAC and `validate(Schema)` for input. `src/modules/risks/risk.routes.ts` is the canonical example.
- **controller** — thin. Reads `req`, calls the service, formats the reply with the `response.ts` helpers, and forwards errors via `try/catch → next(err)`. No business logic here.
- **service** — all logic, and the only layer that talks to Prisma (the singleton from `src/config/database.ts`). A default-exported instance is consumed by the controller; the class is exported for unit tests.
- **schemas** — Zod schemas + inferred input types, shared by `validate()` and the controller's request generics.

### Cross-cutting conventions (follow these when adding code)

- **Response envelope** — every reply is `{ success, data, message }` (plus `errors[]` on failures). Always build it through `successResponse` / `errorResponse` / `paginatedResponse` in `src/shared/utils/response.ts`. The frontend's `unwrap()` in `frontend/src/api/client.ts` mirrors this shape exactly — keep them in sync.
- **Error handling** — services signal HTTP errors by throwing a plain `Error` tagged with a status code: `Object.assign(error, { statusCode: 404 })`. The global handler `src/shared/middleware/error.middleware.ts` is the single place that maps errors to responses: Zod → 400 field errors, Prisma `P2002` → 409, `P2025` → 404, JWT errors → 401, `statusCode`-tagged errors → that code, everything else → 500. Don't `res.status().json()` errors from controllers — `next(err)` and let the handler normalize.
- **Validation** — `validate(schema)` parses and **replaces** `req.body` with the typed output before the controller runs.
- **Auth** — `authenticate` checks a `Bearer` access token and populates `req.user: AuthPayload`; `authorize(...roles)` gates by `Role`. JWT helpers live in `src/shared/utils/jwt.ts` (access + refresh secrets are separate).
- **Config** — `src/config/env.ts` is the only place that reads `process.env`; it Zod-validates at import and `process.exit(1)`s on bad config. JWT secrets require **≥16 chars** (not 32). Import `env` from here rather than touching `process.env`.
- **Routing/security** in `src/app.ts` — `/health` is registered **before** the rate limiter (so PaaS health checks aren't throttled); CORS builds its allow-list from comma-separated `CORS_ORIGIN` and additionally permits any `*.onrender.com` origin.

### Data model

`prisma/schema.prisma` defines 9 models — `Organization`, `User`, `ComplianceControl`, `ComplianceAssessment`, `Incident`, `Risk`, `Audit`, `AuditFinding`, `Report` — plus the enums that drive domain logic (sectors, severities, statuses). `Organization` is the tenant root; most records cascade-delete from it. `Risk.riskScore` is always derived as `likelihood × impact` in the service, never trusted from input.

## Frontend architecture

`frontend/src/` is organized by responsibility: `api/` (axios client + one module per domain), `auth/` (AuthContext + ProtectedRoute), `hooks/`, `lib/` (French labels, color mappings, NIS2/EBIOS domain helpers), `pages/`, `types/` (mirrors of backend types).

The hub is `frontend/src/api/client.ts`: a request interceptor attaches the bearer token; a response interceptor catches `401`, calls `/auth/refresh` once, **queues** concurrent failed requests, replays them with the new token, and redirects to `/login` if refresh fails. Tokens live in `localStorage` under `nis2.accessToken` / `nis2.refreshToken`. `VITE_API_URL` selects the API origin (falls back to the relative `/api/v1` Vite proxy in dev).

## API docs & roles

- Swagger UI at `http://localhost:3000/api/docs`; raw OpenAPI JSON at `/api/docs.json` (spec assembled in `src/config/swagger.ts`).
- All `/api/v1` routes require a JWT except `POST /auth/register`, `POST /auth/login`, and `POST /auth/refresh`.
- Roles: `ADMIN` (full + deletes), `COMPLIANCE_OFFICER` (manage within org), `AUDITOR` (read + audit findings), `VIEWER` (read-only).
- Seed admin: `admin@nis2.example.com` / `Admin@1234` (dev only; prod uses `ADMIN_PASSWORD`).

## Deployment

- **Docker** — `docker-compose.yml` for dev (Postgres + API), `docker-compose.prod.yml` for the full prod stack (Postgres + API + nginx-served frontend that also reverse-proxies `/api`).
- **Render** — `render.yaml` blueprint provisions DB + API + static frontend; on each deploy the API runs `prisma db push` then the idempotent seed. Secrets marked `sync: false` (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_PASSWORD`) are entered in the Render dashboard.
- **CI** — `.github/workflows/ci.yml`: code quality (type-check/lint/format:check) → unit tests → integration tests (against a Postgres service) → frontend build → Playwright E2E → Docker image builds.

## Notes

- `.claude/settings.json` registers the Playwright MCP server, available for browser-driven inspection of the running frontend.
- When changing an API contract, update three places together: the Zod schema (`*.schemas.ts`), the Swagger annotations, and the frontend's `types/` + `api/` module.
