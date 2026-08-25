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
import vehicleRoutes from './modules/vehicles/vehicle.routes';
import deviceRoutes from './modules/devices/device.routes';
import driverRoutes from './modules/drivers/driver.routes';
import tripRoutes from './modules/trips/trip.routes';
import telemetryRoutes from './modules/telemetry/telemetry.routes';
import eventRoutes from './modules/events/event.routes';
import fuelRoutes from './modules/fuel/fuel.routes';
import geofenceRoutes from './modules/geofences/geofence.routes';
import alertRoutes from './modules/alerts/alert.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import reportRoutes from './modules/reports/report.routes';

const app = express();

// Derrière un reverse proxy (PaaS) : faire confiance au premier hop pour req.ip.
app.set('trust proxy', 1);

// ─── Sécurité ───────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .map((o) => (/^https?:\/\//.test(o) ? o : `https://${o}`).replace(/\/+$/, ''));

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
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
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  }),
);

// ─── Health check (avant le rate limiter) ─────────────────────────────────────
function health(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: process.env['npm_package_version'] ?? '1.0.0',
    },
  });
}
app.get('/health', health);
app.get('/api/health', health);

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

// ─── Parsing & logs ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Documentation API ──────────────────────────────────────────────────────--
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SAO Telematics API',
  }),
);
app.get('/api/docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));

// ─── Routes API ─────────────────────────────────────────────────────────────--
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/fuel', fuelRoutes);
app.use('/api/v1/geofences', geofenceRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'The requested resource was not found',
  });
});

// ─── Gestionnaire d'erreurs global ────────────────────────────────────────────
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});

export default app;
