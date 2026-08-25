import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateAlertSchema } from './alert.schemas';
import {
  getAlerts,
  getAlertStats,
  getAlert,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert,
} from './alert.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Lister les alertes de l'organisation
 *     tags: [Alerts]
 *     responses:
 *       200: { description: Liste paginée des alertes }
 */
router.get('/', getAlerts);

/**
 * @swagger
 * /alerts/stats:
 *   get:
 *     summary: Statistiques des alertes
 *     tags: [Alerts]
 *     responses:
 *       200: { description: Statistiques des alertes }
 */
router.get('/stats', getAlertStats);

/**
 * @swagger
 * /alerts/{id}:
 *   get:
 *     summary: Détail d'une alerte
 *     tags: [Alerts]
 *     responses:
 *       200: { description: Alerte }
 */
router.get('/:id', getAlert);

/**
 * @swagger
 * /alerts:
 *   post:
 *     summary: Créer une alerte manuellement
 *     tags: [Alerts]
 *     responses:
 *       201: { description: Alerte créée }
 */
router.post('/', authorize(Role.ADMIN, Role.FLEET_MANAGER), validate(CreateAlertSchema), createAlert);

/**
 * @swagger
 * /alerts/{id}/acknowledge:
 *   post:
 *     summary: Acquitter une alerte
 *     tags: [Alerts]
 *     responses:
 *       200: { description: Alerte acquittée }
 */
router.post('/:id/acknowledge', authorize(Role.ADMIN, Role.FLEET_MANAGER), acknowledgeAlert);

/**
 * @swagger
 * /alerts/{id}/resolve:
 *   post:
 *     summary: Résoudre une alerte
 *     tags: [Alerts]
 *     responses:
 *       200: { description: Alerte résolue }
 */
router.post('/:id/resolve', authorize(Role.ADMIN, Role.FLEET_MANAGER), resolveAlert);

/**
 * @swagger
 * /alerts/{id}:
 *   delete:
 *     summary: Supprimer une alerte
 *     tags: [Alerts]
 *     responses:
 *       200: { description: Alerte supprimée }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteAlert);

export default router;
