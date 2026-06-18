import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateDeviceSchema, UpdateDeviceSchema, AssignDeviceSchema } from './device.schemas';
import {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  assignDevice,
  unassignDevice,
  deleteDevice,
} from './device.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /devices:
 *   get:
 *     summary: Lister les boîtiers de l'organisation
 *     tags: [Devices]
 *     responses:
 *       200: { description: Liste paginée des boîtiers }
 */
router.get('/', getDevices);

/**
 * @swagger
 * /devices/{id}:
 *   get:
 *     summary: Détail d'un boîtier
 *     tags: [Devices]
 *     responses:
 *       200: { description: Boîtier }
 */
router.get('/:id', getDevice);

/**
 * @swagger
 * /devices:
 *   post:
 *     summary: Créer un boîtier
 *     tags: [Devices]
 *     responses:
 *       201: { description: Boîtier créé }
 */
router.post('/', authorize(Role.ADMIN, Role.FLEET_MANAGER), validate(CreateDeviceSchema), createDevice);

/**
 * @swagger
 * /devices/{id}:
 *   put:
 *     summary: Mettre à jour un boîtier
 *     tags: [Devices]
 *     responses:
 *       200: { description: Boîtier mis à jour }
 */
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(UpdateDeviceSchema),
  updateDevice,
);

/**
 * @swagger
 * /devices/{id}/assign:
 *   post:
 *     summary: Lier un boîtier à un véhicule
 *     tags: [Devices]
 *     responses:
 *       200: { description: Boîtier lié au véhicule }
 */
router.post(
  '/:id/assign',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(AssignDeviceSchema),
  assignDevice,
);

/**
 * @swagger
 * /devices/{id}/unassign:
 *   post:
 *     summary: Détacher un boîtier de son véhicule
 *     tags: [Devices]
 *     responses:
 *       200: { description: Boîtier détaché }
 */
router.post('/:id/unassign', authorize(Role.ADMIN, Role.FLEET_MANAGER), unassignDevice);

/**
 * @swagger
 * /devices/{id}:
 *   delete:
 *     summary: Supprimer un boîtier
 *     tags: [Devices]
 *     responses:
 *       200: { description: Boîtier supprimé }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteDevice);

export default router;
