import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateDriverSchema, UpdateDriverSchema } from './driver.schemas';
import {
  getDrivers,
  getDriver,
  getDriverStats,
  createDriver,
  updateDriver,
  deleteDriver,
} from './driver.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /drivers:
 *   get:
 *     summary: Lister les conducteurs de l'organisation
 *     tags: [Drivers]
 *     responses:
 *       200: { description: Liste paginée des conducteurs }
 */
router.get('/', getDrivers);

/**
 * @swagger
 * /drivers/{id}:
 *   get:
 *     summary: Détail d'un conducteur
 *     tags: [Drivers]
 *     responses:
 *       200: { description: Conducteur }
 */
router.get('/:id', getDriver);

/**
 * @swagger
 * /drivers/{id}/stats:
 *   get:
 *     summary: Statistiques d'un conducteur
 *     tags: [Drivers]
 *     responses:
 *       200: { description: Statistiques du conducteur }
 */
router.get('/:id/stats', getDriverStats);

/**
 * @swagger
 * /drivers:
 *   post:
 *     summary: Créer un conducteur
 *     tags: [Drivers]
 *     responses:
 *       201: { description: Conducteur créé }
 */
router.post('/', authorize(Role.ADMIN, Role.FLEET_MANAGER), validate(CreateDriverSchema), createDriver);

/**
 * @swagger
 * /drivers/{id}:
 *   put:
 *     summary: Mettre à jour un conducteur
 *     tags: [Drivers]
 *     responses:
 *       200: { description: Conducteur mis à jour }
 */
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(UpdateDriverSchema),
  updateDriver,
);

/**
 * @swagger
 * /drivers/{id}:
 *   delete:
 *     summary: Supprimer un conducteur
 *     tags: [Drivers]
 *     responses:
 *       200: { description: Conducteur supprimé }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteDriver);

export default router;
