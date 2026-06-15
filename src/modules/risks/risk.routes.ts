import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateRiskSchema, UpdateRiskSchema } from './risk.schemas';
import {
  getRisks,
  getRisk,
  createRisk,
  updateRisk,
  deleteRisk,
  getRiskMatrix,
  getRiskStats,
} from './risk.controller';

const router = Router();

router.use(authenticate);

router.get('/org/:orgId', getRisks);
router.get('/matrix/:orgId', getRiskMatrix);
router.get('/stats/:orgId', getRiskStats);
router.get('/:id', getRisk);

router.post(
  '/',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(CreateRiskSchema),
  createRisk,
);

router.put(
  '/:id',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(UpdateRiskSchema),
  updateRisk,
);

router.delete('/:id', authorize(Role.ADMIN), deleteRisk);

export default router;
