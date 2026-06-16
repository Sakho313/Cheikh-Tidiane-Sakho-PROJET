import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateIncidentSchema, UpdateIncidentSchema } from './incident.schemas';
import {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  reportToAuthority,
  deleteIncident,
  getIncidentStats,
} from './incident.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /incidents/org/{orgId}:
 *   get:
 *     summary: Lister les incidents d'une organisation
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identifiant de l'organisation
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filtrer par sévérité
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, DETECTED, REPORTED_INITIAL, INVESTIGATING, REPORTED_FINAL, RESOLVED, CLOSED]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste paginée des incidents
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Incident'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/org/:orgId', getIncidents);

/**
 * @swagger
 * /incidents/stats/{orgId}:
 *   get:
 *     summary: Statistiques des incidents d'une organisation
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identifiant de l'organisation
 *     responses:
 *       200:
 *         description: Statistiques des incidents
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         bySeverity:
 *                           type: object
 *                         byStatus:
 *                           type: object
 *                         reportedToAuthority:
 *                           type: integer
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats/:orgId', getIncidentStats);

/**
 * @swagger
 * /incidents/{id}:
 *   get:
 *     summary: Récupérer un incident par son identifiant
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identifiant de l'incident
 *     responses:
 *       200:
 *         description: Détail de l'incident
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Incident'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Incident introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getIncident);

/**
 * @swagger
 * /incidents:
 *   post:
 *     summary: Créer un nouvel incident de sécurité
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - organizationId
 *               - severity
 *               - detectedAt
 *             properties:
 *               title:
 *                 type: string
 *                 description: Titre descriptif de l'incident
 *               description:
 *                 type: string
 *                 description: Description détaillée
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               detectedAt:
 *                 type: string
 *                 format: date-time
 *               affectedSystems:
 *                 type: array
 *                 items:
 *                   type: string
 *               initialImpact:
 *                 type: string
 *     responses:
 *       201:
 *         description: Incident créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Rôle insuffisant (ADMIN ou COMPLIANCE_OFFICER requis)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(CreateIncidentSchema),
  createIncident,
);

/**
 * @swagger
 * /incidents/{id}:
 *   put:
 *     summary: Mettre à jour un incident existant
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identifiant de l'incident
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               status:
 *                 type: string
 *                 enum: [DRAFT, DETECTED, REPORTED_INITIAL, INVESTIGATING, REPORTED_FINAL, RESOLVED, CLOSED]
 *               affectedSystems:
 *                 type: array
 *                 items:
 *                   type: string
 *               rootCause:
 *                 type: string
 *               remediationSteps:
 *                 type: string
 *               resolvedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Incident mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Rôle insuffisant (ADMIN ou COMPLIANCE_OFFICER requis)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Incident introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(UpdateIncidentSchema),
  updateIncident,
);

/**
 * @swagger
 * /incidents/{id}/report-to-authority:
 *   post:
 *     summary: Signaler l'incident à l'autorité compétente (Art. 23 NIS2)
 *     description: |
 *       Déclenche la notification officielle à l'autorité nationale compétente
 *       conformément à l'Article 23 de la directive NIS2 (EU 2022/2555).
 *       Les entités essentielles doivent notifier dans les 24h pour l'alerte initiale
 *       et dans les 72h pour le rapport intermédiaire.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identifiant de l'incident
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationDetails:
 *                 type: string
 *                 description: Informations complémentaires pour la notification
 *     responses:
 *       200:
 *         description: Incident signalé à l'autorité avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Incident'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Rôle insuffisant (ADMIN ou COMPLIANCE_OFFICER requis)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Incident introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Incident déjà signalé à l'autorité
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:id/report-to-authority',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  reportToAuthority,
);

/**
 * @swagger
 * /incidents/{id}:
 *   delete:
 *     summary: Supprimer un incident (ADMIN uniquement)
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identifiant de l'incident à supprimer
 *     responses:
 *       200:
 *         description: Incident supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Rôle insuffisant (ADMIN requis)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Incident introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authorize(Role.ADMIN), deleteIncident);

export default router;
