import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateMaintenanceSchema, UpdateMaintenanceSchema } from './maintenance.schemas';
import {
  getMaintenances,
  getVehicleMaintenances,
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from './maintenance.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /maintenance:
 *   get:
 *     summary: Lister les entretiens de l'organisation
 *     tags: [Maintenance]
 *     responses:
 *       200: { description: Liste paginée des entretiens }
 */
router.get('/', getMaintenances);

/**
 * @swagger
 * /maintenance/vehicle/{vehicleId}:
 *   get:
 *     summary: Lister les entretiens d'un véhicule
 *     tags: [Maintenance]
 *     responses:
 *       200: { description: Entretiens du véhicule }
 */
router.get('/vehicle/:vehicleId', getVehicleMaintenances);

/**
 * @swagger
 * /maintenance/{id}:
 *   get:
 *     summary: Détail d'un entretien
 *     tags: [Maintenance]
 *     responses:
 *       200: { description: Entretien }
 */
router.get('/:id', getMaintenance);

/**
 * @swagger
 * /maintenance:
 *   post:
 *     summary: Créer un entretien
 *     tags: [Maintenance]
 *     responses:
 *       201: { description: Entretien créé }
 */
router.post(
  '/',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(CreateMaintenanceSchema),
  createMaintenance,
);

/**
 * @swagger
 * /maintenance/{id}:
 *   put:
 *     summary: Mettre à jour un entretien
 *     tags: [Maintenance]
 *     responses:
 *       200: { description: Entretien mis à jour }
 */
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(UpdateMaintenanceSchema),
  updateMaintenance,
);

/**
 * @swagger
 * /maintenance/{id}:
 *   delete:
 *     summary: Supprimer un entretien
 *     tags: [Maintenance]
 *     responses:
 *       200: { description: Entretien supprimé }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteMaintenance);

export default router;
