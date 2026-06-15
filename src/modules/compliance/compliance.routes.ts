import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  authenticate,
  authorize,
} from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import {
  UpsertAssessmentSchema,
  UpdateAssessmentSchema,
} from './compliance.schemas';
import {
  getAllControls,
  getAssessments,
  upsertAssessment,
  updateAssessment,
  getComplianceScore,
  seedControls,
} from './compliance.controller';

const router = Router();

router.use(authenticate);

router.get('/controls', getAllControls);
router.get('/assessments/:orgId', getAssessments);
router.get('/score/:orgId', getComplianceScore);

router.post(
  '/assessments',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(UpsertAssessmentSchema),
  upsertAssessment,
);

router.put(
  '/assessments/:id',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(UpdateAssessmentSchema),
  updateAssessment,
);

router.post(
  '/seed-controls',
  authorize(Role.ADMIN),
  seedControls,
);

export default router;
