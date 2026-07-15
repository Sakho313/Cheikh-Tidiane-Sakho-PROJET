# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack NIS2 compliance management platform built for SAO Consulting. A React SPA communicates with an Express REST API backed by PostgreSQL via Prisma. The platform tracks compliance posture, incidents, risks, audits, and generates executive reports aligned with the EU NIS2 Directive.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js 18+, TypeScript (strict), Express.js, Prisma 5, PostgreSQL 16 |
| **Frontend** | React 18, Vite 5, TypeScript, TailwindCSS 3, React Query v5, Axios |
| **Auth** | JWT (access 15m + refresh 7d), bcrypt (rounds: 12) |
| **Validation** | Zod (backend schemas) |
| **Testing** | Jest + Supertest (unit/integration), Playwright (E2E) |
| **Deployment** | Render.com (`render.yaml` blueprint) |

## Commands

**Use `make help` to see all shortcuts.** Key targets:

```bash
make setup          # Install deps + push schema + seed (first-time setup)
make dev            # Start API :3000 + frontend :5173 in parallel
make dev-api        # Backend only (hot-reload via ts-node-dev)
make dev-front      # Frontend only (Vite HMR)

make lint           # Lint backend + frontend
make typecheck      # Type-check backend + frontend
make test           # Unit tests with coverage (backend)
make test-int       # Integration tests (requires Postgres)
make e2e            # Playwright E2E (requires API + seeded DB running)

make docker-up      # Launch Postgres + API via Docker Compose
make docker-down    # Stop Docker stack
make docker-prod    # Production stack (Postgres + API + nginx frontend)
make build          # Compile backend (tsc) + frontend (vite build)
make clean          # Remove dist/, coverage/, frontend/dist/
```

Single backend test file:
```bash
npx jest tests/unit/auth.service.test.ts
npx jest tests/unit/auth.service.test.ts --watch
```

## Local Development Setup

```bash
cp .env.example .env              # fill DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
cp frontend/.env.example frontend/.env
make setup                        # installs deps, pushes schema, seeds DB
make dev                          # starts both servers
```

The Vite dev server proxies `/api/*` → `http://localhost:3000`, so the frontend uses relative URLs in dev and never hits CORS.

## Environment Variables

**Backend (`.env`):**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — min 32 chars
- `JWT_REFRESH_SECRET` — min 32 chars, different from JWT_SECRET
- `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` — e.g. `15m` / `7d`
- `CORS_ORIGIN` — allowed frontend origin

**Frontend (`frontend/.env`):**
- `VITE_API_URL` — leave empty in dev (Vite proxy handles it); set to backend public URL for cross-origin prod
- `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD` — credentials for the "Accéder à la démonstration" button
- `VITE_ACCESS_CODE` — code clients type on the login page gate (default: `SAO2026`)

## Architecture

### Backend (`src/`)

Each domain module has its own `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.schemas.ts`:

```
src/
├── modules/
│   ├── auth/           # Register, login, refresh, /me
│   ├── organizations/  # NIS2 entity management + aggregate stats
│   ├── compliance/     # Article 21 control assessments per org
│   ├── incidents/      # Incident lifecycle (NIS2 Article 23 reporting)
│   ├── risks/          # Risk matrix (5×5 likelihood/impact) + heatmap
│   ├── audits/         # Audit findings with severity levels
│   └── reports/        # Report generation stored as JSON
├── shared/
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT verification + RBAC role guard
│   │   ├── validate.middleware.ts # Zod schema validation
│   │   └── error.middleware.ts   # Global error handler + Prisma error normalization
│   └── utils/
│       ├── response.ts   # sendSuccess / sendError helpers
│       ├── jwt.ts        # signAccessToken / signRefreshToken / verifyToken
│       └── pagination.ts # parsePagination / buildPaginationMeta
└── config/
    ├── env.ts        # Zod-validated process.env — import from here, not process.env directly
    ├── database.ts   # Prisma singleton client
    └── swagger.ts    # OpenAPI/Swagger config (served at /api-docs)
```

All routes are prefixed `/api/v1/`. Public endpoints: `POST /auth/register`, `POST /auth/login`. Everything else requires a Bearer token.

**API response envelope:**
```json
{ "success": true, "data": {} }
{ "success": false, "message": "Error", "errors": [{ "field": "email", "message": "..." }] }
```

### Frontend (`frontend/src/`)

```
src/
├── api/          # One file per backend module; all calls go through apiClient (axios)
│                 # with auto token-refresh on 401 (queues concurrent requests)
├── auth/
│   ├── AuthContext.tsx   # useAuth() — user, login, logout, isLoading
│   └── ProtectedRoute.tsx
├── components/
│   ├── ui/       # Badge, Button, Card, PageHeader, Spinner, Table — shared primitives
│   ├── layout/   # AppLayout (sidebar nav + <Outlet>)
│   └── AccessCodeGate.tsx  # Segmented code input on the login page
├── hooks/
│   ├── useOrganizations.ts  # React Query hook wrapping the orgs API
│   └── useSelectedOrg.ts    # Persisted org selection (localStorage)
├── lib/          # Pure client-side logic (no API calls):
│   ├── ebios.ts, gapAnalysis.ts, roadmap.ts, suppliers.ts, vulnerabilities.ts
├── pages/        # One component per route (see App.tsx for the full route map)
└── types/        # Shared types mirroring API response shapes
```

**Pages backed by API:** Dashboard, Organizations, Compliance, Risks, Incidents (`/incidents` → `CrisisPage`), Audits, Reports.

**Pages that are fully client-side** (use `src/lib/` data, no API): `/assets`, `/bcp`, `/suppliers`, `/response`, `/sensibilisation`, `/documentation`, `/direction`, `/vulnerabilities`, `/roadmap`.

**Token storage:** `localStorage` keys `nis2.accessToken` / `nis2.refreshToken`. The Axios interceptor in `api/client.ts` auto-refreshes and queues parallel requests during refresh.

### Database (Prisma)

Key relationships:
- `Organization` → has many `User`, `ComplianceAssessment`, `Incident`, `Risk`, `Audit`, `Report`
- `ComplianceControl` — seeded (10 NIS2 Article 21 controls); linked to `ComplianceAssessment` and `AuditFinding`
- `ComplianceAssessment` — unique on `(organizationId, controlId)`
- `Risk` — `riskScore` stored denormalized as `likelihood × impact` (1–5 each)
- `Incident` — NIS2 Article 23 fields: `reportedToAuthority`, `authorityReference`, `estimatedUsers`

After schema changes: run `make db-push` (generates client + applies to DB).

## Deployment (Render.com)

The `render.yaml` blueprint creates three resources in Frankfurt:
1. **`nis2-db`** — PostgreSQL (free plan)
2. **`nis2-api`** — Node.js; start command runs `prisma db push && npm run seed && npm start` (idempotent)
3. **`nis2-frontend`** — Static site from `frontend/`; rewrites `/api/*` → backend (same-origin, no CORS)

**Required secrets** (set manually in Render dashboard, marked `sync: false`):
`JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_PASSWORD`, `OFFICER_PASSWORD`

In production `VITE_API_URL` is left empty — the static site's rewrite rules handle proxying.

## User Roles

| Role | Capabilities |
|---|---|
| `ADMIN` | Full access, organization management |
| `COMPLIANCE_OFFICER` | Manage compliance/incidents/risks/audits within their org |
| `AUDITOR` | Read access + create audit findings |
| `VIEWER` | Read-only |

## Testing

- **Unit tests** (`tests/unit/`) mock Prisma — no DB required.
- **Integration tests** (`tests/integration/`) use a real Postgres instance; run sequentially (`--runInBand`). Helpers in `tests/integration/helpers/` handle DB cleanup and token generation.
- **E2E tests** (`frontend/e2e/`) use Playwright + Chromium. Require the full stack (seeded DB + compiled backend + frontend) running.
- CI (`/.github/workflows/ci.yml`) runs quality, unit, integration, frontend build, E2E, and Docker build jobs in parallel.
