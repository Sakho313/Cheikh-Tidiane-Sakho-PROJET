import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  authenticate,
  authenticateIngest,
  authorize,
} from '../../shared/middleware/auth.middleware';
import { uploadFile } from '../../shared/middleware/upload.middleware';
import {
  ingest,
  importPositions,
  getLive,
  getVehiclePositions,
} from './telemetry.controller';

const router = Router();

/**
 * @swagger
 * /telemetry/ingest:
 *   post:
 *     summary: Ingérer une ou plusieurs positions GPS (boîtier ou utilisateur)
 *     tags: [Telemetry]
 *     responses:
 *       201: { description: Positions ingérées }
 */
router.post('/ingest', authenticateIngest, ingest);

/**
 * @swagger
 * /telemetry/import:
 *   post:
 *     summary: Importer des positions depuis un fichier CSV ou Excel
 *     tags: [Telemetry]
 *     responses:
 *       201: { description: Positions importées }
 */
router.post(
  '/import',
  uploadFile.single('file'),
  authenticate,
  authorize(Role.ADMIN, Role.FLEET_MANAGER, Role.DISPATCHER),
  importPositions,
);

/**
 * @swagger
 * /telemetry/live:
 *   get:
 *     summary: Dernière position de chaque véhicule (carte live)
 *     tags: [Telemetry]
 *     responses:
 *       200: { description: Positions live }
 */
router.get('/live', authenticate, getLive);

/**
 * @swagger
 * /telemetry/vehicle/{vehicleId}/positions:
 *   get:
 *     summary: Historique paginé des positions d'un véhicule
 *     tags: [Telemetry]
 *     responses:
 *       200: { description: Historique des positions }
 */
router.get('/vehicle/:vehicleId/positions', authenticate, getVehiclePositions);

export default router;
