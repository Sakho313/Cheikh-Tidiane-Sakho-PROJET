import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { GenerateReportSchema } from './report.schemas';
import {
  getReports,
  getReport,
  generateReport,
  deleteReport,
  exportReport,
} from './report.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Lister les rapports de l'organisation
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste paginée des rapports }
 */
router.get('/', getReports);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Détail d'un rapport
 *     tags: [Reports]
 *     responses:
 *       200: { description: Rapport }
 */
router.get('/:id', getReport);

/**
 * @swagger
 * /reports/{id}/export:
 *   get:
 *     summary: Exporter un rapport (csv | xlsx | pdf)
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [csv, xlsx, pdf] }
 *     responses:
 *       200: { description: Fichier exporté }
 */
router.get('/:id/export', exportReport);

/**
 * @swagger
 * /reports/generate:
 *   post:
 *     summary: Générer un rapport
 *     tags: [Reports]
 *     responses:
 *       201: { description: Rapport généré }
 */
router.post(
  '/generate',
  authorize(Role.ADMIN, Role.FLEET_MANAGER, Role.ANALYST),
  validate(GenerateReportSchema),
  generateReport,
);

/**
 * @swagger
 * /reports/{id}:
 *   delete:
 *     summary: Supprimer un rapport
 *     tags: [Reports]
 *     responses:
 *       200: { description: Rapport supprimé }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteReport);

export default router;
