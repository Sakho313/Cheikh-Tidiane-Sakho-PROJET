import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import {
  CreateAuditSchema,
  UpdateAuditSchema,
  CreateFindingSchema,
  UpdateFindingSchema,
} from './audit.schemas';
import {
  getAudits,
  getAudit,
  createAudit,
  updateAudit,
  deleteAudit,
  addFinding,
  updateFinding,
  getFindings,
  getAuditStats,
} from './audit.controller';

const router = Router();

router.use(authenticate);

router.get('/org/:orgId', getAudits);
router.get('/stats/:orgId', getAuditStats);
router.get('/:id', getAudit);
router.get('/:id/findings', getFindings);

router.post(
  '/',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER, Role.AUDITOR),
  validate(CreateAuditSchema),
  createAudit,
);

router.put(
  '/:id',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER, Role.AUDITOR),
  validate(UpdateAuditSchema),
  updateAudit,
);

router.post(
  '/:id/findings',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER, Role.AUDITOR),
  validate(CreateFindingSchema),
  addFinding,
);

router.put(
  '/:id/findings/:findingId',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER, Role.AUDITOR),
  validate(UpdateFindingSchema),
  updateFinding,
);

router.delete('/:id', authorize(Role.ADMIN), deleteAudit);

export default router;
