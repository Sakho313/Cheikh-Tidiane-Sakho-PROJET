import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  authenticate,
  authorize,
} from '../../shared/middleware/auth.middleware';
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

router.get('/org/:orgId', getIncidents);
router.get('/stats/:orgId', getIncidentStats);
router.get('/:id', getIncident);

router.post(
  '/',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(CreateIncidentSchema),
  createIncident,
);

router.put(
  '/:id',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(UpdateIncidentSchema),
  updateIncident,
);

router.post(
  '/:id/report-to-authority',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  reportToAuthority,
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  deleteIncident,
);

export default router;
