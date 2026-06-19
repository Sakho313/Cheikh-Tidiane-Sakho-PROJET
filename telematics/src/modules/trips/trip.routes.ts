import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { UpdateTripSchema } from './trip.schemas';
import {
  getTrips,
  getTrip,
  getTripPositions,
  getTripTrack,
  updateTrip,
  closeTrip,
  deleteTrip,
} from './trip.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Lister les trajets de l'organisation
 *     tags: [Trips]
 *     responses:
 *       200: { description: Liste des trajets }
 */
router.get('/', getTrips);

/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     summary: Détail d'un trajet
 *     tags: [Trips]
 *     responses:
 *       200: { description: Trajet }
 */
router.get('/:id', getTrip);

/**
 * @swagger
 * /trips/{id}/positions:
 *   get:
 *     summary: Positions GPS d'un trajet
 *     tags: [Trips]
 *     responses:
 *       200: { description: Positions du trajet }
 */
router.get('/:id/positions', getTripPositions);

/**
 * @swagger
 * /trips/{id}/track:
 *   get:
 *     summary: Trace GeoJSON du trajet
 *     tags: [Trips]
 *     responses:
 *       200: { description: Trace GeoJSON }
 */
router.get('/:id/track', getTripTrack);

/**
 * @swagger
 * /trips/{id}:
 *   put:
 *     summary: Mettre à jour un trajet (affectation conducteur, statut)
 *     tags: [Trips]
 *     responses:
 *       200: { description: Trajet mis à jour }
 */
router.put('/:id', authorize(Role.ADMIN, Role.FLEET_MANAGER), validate(UpdateTripSchema), updateTrip);

/**
 * @swagger
 * /trips/{id}/close:
 *   post:
 *     summary: Finaliser un trajet et recalculer ses métriques
 *     tags: [Trips]
 *     responses:
 *       200: { description: Trajet finalisé }
 */
router.post('/:id/close', authorize(Role.ADMIN, Role.FLEET_MANAGER), closeTrip);

/**
 * @swagger
 * /trips/{id}:
 *   delete:
 *     summary: Supprimer un trajet
 *     tags: [Trips]
 *     responses:
 *       200: { description: Trajet supprimé }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteTrip);

export default router;
