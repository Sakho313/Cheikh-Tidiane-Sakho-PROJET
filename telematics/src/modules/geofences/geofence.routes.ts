import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateGeofenceSchema, UpdateGeofenceSchema } from './geofence.schemas';
import {
  getGeofences,
  getGeofence,
  getGeofenceEvents,
  createGeofence,
  updateGeofence,
  deleteGeofence,
} from './geofence.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /geofences:
 *   get:
 *     summary: Lister les zones de l'organisation
 *     tags: [Geofences]
 *     responses:
 *       200: { description: Liste des zones }
 */
router.get('/', getGeofences);

/**
 * @swagger
 * /geofences/{id}:
 *   get:
 *     summary: Détail d'une zone
 *     tags: [Geofences]
 *     responses:
 *       200: { description: Zone }
 */
router.get('/:id', getGeofence);

/**
 * @swagger
 * /geofences/{id}/events:
 *   get:
 *     summary: Événements d'entrée/sortie d'une zone
 *     tags: [Geofences]
 *     responses:
 *       200: { description: Liste paginée des événements de la zone }
 */
router.get('/:id/events', getGeofenceEvents);

/**
 * @swagger
 * /geofences:
 *   post:
 *     summary: Créer une zone
 *     tags: [Geofences]
 *     responses:
 *       201: { description: Zone créée }
 */
router.post(
  '/',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(CreateGeofenceSchema),
  createGeofence,
);

/**
 * @swagger
 * /geofences/{id}:
 *   put:
 *     summary: Mettre à jour une zone
 *     tags: [Geofences]
 *     responses:
 *       200: { description: Zone mise à jour }
 */
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.FLEET_MANAGER),
  validate(UpdateGeofenceSchema),
  updateGeofence,
);

/**
 * @swagger
 * /geofences/{id}:
 *   delete:
 *     summary: Supprimer une zone
 *     tags: [Geofences]
 *     responses:
 *       200: { description: Zone supprimée }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteGeofence);

export default router;
