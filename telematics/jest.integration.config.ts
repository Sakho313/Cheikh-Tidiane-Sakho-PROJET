import type { Config } from 'jest';

// Tests d'intégration : vrai PostgreSQL, supertest contre l'app Express, en série.
// `setup.ts` définit les variables d'environnement AVANT le chargement de tout
// module applicatif (src/config/env.ts valide l'environnement à l'import).
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  setupFiles: ['<rootDir>/tests/integration/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
};

export default config;
