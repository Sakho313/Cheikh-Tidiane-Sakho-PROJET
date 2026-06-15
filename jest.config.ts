import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  // La couverture unitaire cible la logique métier : services, utilitaires et
  // middlewares. Les routes (câblage déclaratif) et contrôleurs (fine délégation
  // aux services) sont couverts par les tests d'intégration (job CI dédié).
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    'src/shared/utils/**/*.ts',
    'src/shared/middleware/**/*.ts',
    '!**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [],
  verbose: true,
};

export default config;
