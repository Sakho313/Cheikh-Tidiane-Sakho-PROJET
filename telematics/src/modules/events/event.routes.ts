import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateEventSchema } from './event.schemas';
import {
  getEvents,
  getEvent,
  getEventStats,
  createEvent,
  deleteEvent,
} from './event.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Lister les événements de conduite
 *     tags: [Events]
 *     responses:
 *       200: { description: Liste des événements }
 */
router.get('/', getEvents);

/**
 * @swagger
 * /events/stats:
 *   get:
 *     summary: Statistiques des événements (par type et sévérité)
 *     tags: [Events]
 *     responses:
 *       200: { description: Statistiques }
 */
router.get('/stats', getEventStats);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Détail d'un événement de conduite
 *     tags: [Events]
 *     responses:
 *       200: { description: Événement }
 */
router.get('/:id', getEvent);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Créer manuellement un événement de conduite
 *     tags: [Events]
 *     responses:
 *       201: { description: Événement créé }
 */
router.post('/', authorize(Role.ADMIN, Role.FLEET_MANAGER), validate(CreateEventSchema), createEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Supprimer un événement de conduite
 *     tags: [Events]
 *     responses:
 *       200: { description: Événement supprimé }
 */
router.delete('/:id', authorize(Role.ADMIN), deleteEvent);

export default router;
