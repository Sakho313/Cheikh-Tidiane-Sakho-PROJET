// Définit les variables d'environnement AVANT le chargement de tout module
// applicatif (enregistré via `setupFiles`). Nécessaire car src/config/env.ts
// valide l'environnement à l'import et quitte le processus en cas d'échec.
//
// DATABASE_URL conserve toute valeur fournie par l'environnement (ex. le job CI)
// grâce au `??`, et retombe sinon sur une base de test locale.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://telematics:telematics@localhost:5432/telematics_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'integration-test-jwt-secret-32-characters';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'integration-test-refresh-secret-32-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
process.env.PORT = '4999';
process.env.CORS_ORIGIN = 'http://localhost:5174';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '100000';
process.env.INGEST_API_KEY = process.env.INGEST_API_KEY ?? 'test-ingest-key';
process.env.DEFAULT_SPEED_LIMIT_KMH = '90';
