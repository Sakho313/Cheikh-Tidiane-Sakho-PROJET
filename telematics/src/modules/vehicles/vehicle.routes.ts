import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateVehicleSchema, UpdateVehicleSchema } from './vehicle.schemas';
import {
  getVehicles,
  getVehicle,
  getVehicleStats,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from './vehicle.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Lister les véhicules de l'organisation
 *     tags: [Vehicles]
 *     responses:
 *       200: { description: Liste paginée des véhicules }
 */
router.get('/', getVehicles);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Détail d'un véhicule
 *     tags: [Vehicles]
 *     responses:
 *       200: { description: Véhicule }
 */
router.get('/:id', getVehicle);

/**
 * @swagger
 * /vehicles/{id}/stats:
 *   get:
 *     summary: Statistiques d'un véhicule
 *     tags: [Vehicles]
 *     responses:
 *       200: { description: Statistiques du véhicule }
 */
router.get('/:id/stats', getVehicleStats);

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Créer un véhicule
 *     tags: [Vehicles]
 *     responses:
 *       201: { description: Véhicule créé }
 */
router.post(
  '/',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(CreateVehicleSchema),
  createVehicle,
);

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Mettre à jour un véhicule
 *     tags: [Vehicles]
 *     responses:
 *       200: { description: Véhicule mis à jour }
 */
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(UpdateVehicleSchema),
  updateVehicle,
);

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Supprimer un véhicule
 *     tags: [Vehicles]
 *     responses:
 *       200: { description: Véhicule supprimé }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteVehicle);

export default router;
