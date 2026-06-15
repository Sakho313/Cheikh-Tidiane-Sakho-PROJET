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

// ─── Security middleware ──────────────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
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

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: process.env['npm_package_version'] ?? '1.0.0',
    },
  });
});

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
