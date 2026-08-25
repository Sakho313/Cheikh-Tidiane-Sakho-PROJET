import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateFuelRecordSchema, UpdateFuelRecordSchema } from './fuel.schemas';
import {
  getFuelRecords,
  getVehicleFuelRecords,
  getVehicleEfficiency,
  getFuelStats,
  getTheftDetection,
  getFuelRecord,
  createFuelRecord,
  updateFuelRecord,
  deleteFuelRecord,
} from './fuel.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /fuel:
 *   get:
 *     summary: Lister les enregistrements de carburant de l'organisation
 *     tags: [Fuel]
 *     responses:
 *       200: { description: Liste paginée des enregistrements de carburant }
 */
router.get('/', getFuelRecords);

/**
 * @swagger
 * /fuel/stats:
 *   get:
 *     summary: Statistiques de carburant de l'organisation
 *     tags: [Fuel]
 *     responses:
 *       200: { description: Statistiques de carburant }
 */
router.get('/stats', getFuelStats);

/**
 * @swagger
 * /fuel/theft-detection:
 *   get:
 *     summary: Détecter les chutes de carburant suspectes
 *     tags: [Fuel]
 *     responses:
 *       200: { description: Liste des suspicions de vol de carburant }
 */
router.get('/theft-detection', getTheftDetection);

/**
 * @swagger
 * /fuel/vehicle/{vehicleId}/efficiency:
 *   get:
 *     summary: Consommation L/100km d'un véhicule entre pleins
 *     tags: [Fuel]
 *     responses:
 *       200: { description: Série de consommation et moyennes }
 */
router.get('/vehicle/:vehicleId/efficiency', getVehicleEfficiency);

/**
 * @swagger
 * /fuel/vehicle/{vehicleId}:
 *   get:
 *     summary: Enregistrements de carburant d'un véhicule
 *     tags: [Fuel]
 *     responses:
 *       200: { description: Enregistrements de carburant du véhicule }
 */
router.get('/vehicle/:vehicleId', getVehicleFuelRecords);

/**
 * @swagger
 * /fuel/{id}:
 *   get:
 *     summary: Détail d'un enregistrement de carburant
 *     tags: [Fuel]
 *     responses:
 *       200: { description: Enregistrement de carburant }
 */
router.get('/:id', getFuelRecord);

/**
 * @swagger
 * /fuel:
 *   post:
 *     summary: Créer un enregistrement de carburant
 *     tags: [Fuel]
 *     responses:
 *       201: { description: Enregistrement de carburant créé }
 */
router.post(
  '/',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(CreateFuelRecordSchema),
  createFuelRecord,
);

/**
 * @swagger
 * /fuel/{id}:
 *   put:
 *     summary: Mettre à jour un enregistrement de carburant
 *     tags: [Fuel]
 *     responses:
 *       200: { description: Enregistrement de carburant mis à jour }
 */
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(UpdateFuelRecordSchema),
  updateFuelRecord,
);

/**
 * @swagger
 * /fuel/{id}:
 *   delete:
 *     summary: Supprimer un enregistrement de carburant
 *     tags: [Fuel]
 *     responses:
 *       200: { description: Enregistrement de carburant supprimé }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteFuelRecord);

export default router;
