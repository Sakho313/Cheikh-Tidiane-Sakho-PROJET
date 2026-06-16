# NIS2 Compliance Management Backend

## Project Overview

A production-grade REST API backend for managing NIS2 (Network and Information Security Directive 2) compliance. This platform enables organizations to track their compliance posture, manage cybersecurity incidents, assess and mitigate risks, conduct audits, and generate executive reports — all aligned with the EU NIS2 Directive requirements.

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **ORM**: Prisma with PostgreSQL
- **Authentication**: JWT (access + refresh tokens)
- **Password Hashing**: bcryptjs (rounds: 12)
- **Validation**: Zod
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Morgan

## Folder Structure

```
/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeding script
├── src/
│   ├── config/
│   │   ├── env.ts           # Zod-validated environment variables
│   │   └── database.ts      # Prisma singleton client
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts     # Shared TypeScript types
│   │   ├── utils/
│   │   │   ├── response.ts  # HTTP response helpers
│   │   │   ├── jwt.ts       # JWT utilities
│   │   │   └── pagination.ts# Pagination helpers
│   │   └── middleware/
│   │       ├── auth.middleware.ts    # JWT authentication & RBAC
│   │       ├── error.middleware.ts   # Global error handler
│   │       └── validate.middleware.ts# Zod request validation
│   ├── modules/
│   │   ├── auth/            # Authentication module
│   │   ├── organizations/   # Organization management
│   │   ├── compliance/      # NIS2 compliance tracking
│   │   ├── incidents/       # Cybersecurity incident management
│   │   ├── risks/           # Risk assessment & management
│   │   ├── audits/          # Audit management
│   │   └── reports/         # Report generation
│   ├── app.ts               # Express app configuration
│   └── server.ts            # Server entry point
├── .env.example             # Environment variable template
├── package.json
└── tsconfig.json
```

## Key Scripts

```bash
# Development (hot-reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Database migrations
npm run migrate

# Generate Prisma client after schema changes
npm run generate

# Seed the database with initial data
npm run seed

# Lint the codebase
npm run lint
```

## Environment Setup

1. Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

2. Required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Strong secret for access tokens (min 32 chars)
   - `JWT_REFRESH_SECRET`: Strong secret for refresh tokens (min 32 chars)

3. Initialize the database:

```bash
npm run migrate
npm run generate
npm run seed
```

## Module Descriptions

### Auth (`/api/v1/auth`)
Handles user registration, login, JWT refresh, and profile retrieval. Uses bcrypt(12) for password hashing. Issues short-lived access tokens and long-lived refresh tokens.

### Organizations (`/api/v1/organizations`)
Manages NIS2-regulated entities. Each organization has a sector (Energy, Transport, Banking, etc.) and entity type (Essential/Important) per NIS2 classification. Provides aggregate statistics across all modules.

### Compliance (`/api/v1/compliance`)
Core NIS2 Article 21 compliance tracking. Controls are pre-seeded covering the 10 NIS2 security measures. Assessments track each organization's implementation status per control. Provides scoring by domain and overall.

### Incidents (`/api/v1/incidents`)
Cybersecurity incident lifecycle management aligned with NIS2 Article 23 reporting obligations. Tracks severity, affected systems, and regulatory reporting status (24-hour initial report, 72-hour report requirements).

### Risks (`/api/v1/risks`)
Risk identification, assessment, and mitigation tracking. Provides risk matrix (5x5 likelihood/impact grid) and heatmap data. Risks are categorized by type (Network, Supply Chain, Human, etc.).

### Audits (`/api/v1/audits`)
Internal, external, regulatory, and supplier audit management. Supports audit findings with severity levels (Observation, Minor, Major, Critical) and remediation tracking.

### Reports (`/api/v1/reports`)
Automated report generation for compliance status, incidents, risks, audits, and executive summaries. Reports are stored as JSON records with time period support.

## User Roles

- **ADMIN**: Full system access including organization management
- **COMPLIANCE_OFFICER**: Manage compliance, incidents, risks, audits within their organization
- **AUDITOR**: Read access + ability to create audit findings
- **VIEWER**: Read-only access

## Default Credentials (Seed)

- Email: `admin@nis2.example.com`
- Password: `Admin@1234`

## Testing Notes

- All endpoints require authentication except `POST /api/v1/auth/register` and `POST /api/v1/auth/login`
- Use the `/health` endpoint for uptime checks
- Rate limiting is applied globally (configurable via env vars)
- Prisma errors are normalized to consistent API responses
- Zod validation errors return field-level details in the `errors` field

## API Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

## NIS2 Article 21 Security Measures Covered

1. Risk analysis and information system security policies
2. Incident handling
3. Business continuity and crisis management
4. Supply chain security
5. Security in network and information systems acquisition
6. Policies for assessing the effectiveness of cybersecurity risk-management measures
7. Basic cyber hygiene practices and cybersecurity training
8. Policies and procedures regarding the use of cryptography and encryption
9. Human resources security and access control policies
10. Use of multi-factor authentication and continuous authentication solutions
