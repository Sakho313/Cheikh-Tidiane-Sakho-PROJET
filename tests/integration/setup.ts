// Defines environment variables BEFORE any application module is loaded.
// Registered via `setupFiles` in jest.integration.config.ts, which Jest runs
// before importing the test modules (and therefore before src/config/env.ts,
// which validates env vars with Zod at import time).
//
// DATABASE_URL keeps any value provided by the environment (e.g. the CI job)
// thanks to the `??` fallback, defaulting to the local test database otherwise.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nis2:nis2@localhost:5433/nis2_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'integration-test-jwt-secret-at-least-32-chars';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'integration-test-refresh-secret-32-chars-xx';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
process.env.PORT = '3999';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '100000';
