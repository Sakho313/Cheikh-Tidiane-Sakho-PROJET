import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { swaggerSpec } from './config/swagger';

import authRoutes from './modules/auth/auth.routes';
import organizationRoutes from './modules/organizations/organization.routes';
import complianceRoutes from './modules/compliance/compliance.routes';
import incidentRoutes from './modules/incidents/incident.routes';
import riskRoutes from './modules/risks/risk.routes';
import auditRoutes from './modules/audits/audit.routes';
import reportRoutes from './modules/reports/report.routes';

const app = express();

// Render (and most PaaS) run the app behind a reverse proxy. Trust the first
// hop so req.ip / rate-limiting see the real client IP and express-rate-limit
// accepts the X-Forwarded-For header.
app.set('trust proxy', 1);

// ─── Security middleware ──────────────────────────────────────────────────────

app.use(helmet());

// Build the CORS allow-list from CORS_ORIGIN (comma-separated; scheme optional).
const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .map((o) => (/^https?:\/\//.test(o) ? o : `https://${o}`).replace(/\/+$/, ''));

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  // Test convenience: allow any Render-hosted frontend (*.onrender.com).
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.hostname.endsWith('.onrender.com');
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = same-origin or non-browser client (curl, health checks).
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Rate limiting ────────────────────────────────────────────────────────────

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
});

app.use(limiter);

// ─── Request parsing & logging ────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── API Documentation ────────────────────────────────────────────────────────

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SAO NIS2 API Documentation',
  }),
);
app.get('/api/docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));

// ─── Health check ─────────────────────────────────────────────────────────────

const healthHandler = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: process.env['npm_package_version'] ?? '1.0.0',
    },
  });
};

// Exposed at /health (Render health check) and /api/health (reachable via the
// API path used by clients).
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/risks', riskRoutes);
app.use('/api/v1/audits', auditRoutes);
app.use('/api/v1/reports', reportRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'The requested resource was not found',
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});

export default app;
