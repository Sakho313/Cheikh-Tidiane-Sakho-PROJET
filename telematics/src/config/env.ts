import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5174'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  RATE_LIMIT_MAX: z
    .string()
    .default('300')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  // Clé partagée pour l'ingestion par les boîtiers GPS (en-tête x-api-key).
  INGEST_API_KEY: z.string().default(''),
  // Limite de vitesse par défaut si le véhicule n'en définit pas (km/h).
  DEFAULT_SPEED_LIMIT_KMH: z
    .string()
    .default('90')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;

export type Env = typeof env;
