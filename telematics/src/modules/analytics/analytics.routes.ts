import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { RecomputeScoreSchema } from './analytics.schemas';
import {
  getDashboard,
  getDriverScores,
  getDriverBehavior,
  getFuelConsumption,
  getFleetUtilization,
  recomputeDriverScore,
} from './analytics.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Vue d'ensemble de la flotte (KPIs temps réel)
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Indicateurs de la flotte }
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /analytics/drivers/scores:
 *   get:
 *     summary: Classement des conducteurs par score de conduite
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: Classement des scores }
 */
router.get('/drivers/scores', getDriverScores);

/**
 * @swagger
 * /analytics/drivers/{driverId}/behavior:
 *   get:
 *     summary: Détail comportemental d'un conducteur
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Comportement du conducteur }
 */
router.get('/drivers/:driverId/behavior', getDriverBehavior);

/**
 * @swagger
 * /analytics/fuel/consumption:
 *   get:
 *     summary: Tendance de consommation carburant de la flotte
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Consommation carburant }
 */
router.get('/fuel/consumption', getFuelConsumption);

/**
 * @swagger
 * /analytics/fleet/utilization:
 *   get:
 *     summary: Taux d'utilisation par véhicule
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Utilisation de la flotte }
 */
router.get('/fleet/utilization', getFleetUtilization);

/**
 * @swagger
 * /analytics/drivers/{driverId}/score/recompute:
 *   post:
 *     summary: Recalculer et persister le score d'un conducteur
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Snapshot de score mis à jour }
 */
router.post(
  '/drivers/:driverId/score/recompute',
  authorize(Role.ADMIN, Role.FLEET_MANAGER, Role.ANALYST),
  validate(RecomputeScoreSchema),
  recomputeDriverScore,
);

export default router;
