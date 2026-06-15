import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { CreateOrganizationSchema, UpdateOrganizationSchema } from './organization.schemas';
import {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats,
} from './organization.controller';

const router = Router();

router.use(authenticate);

router.get('/', getOrganizations);
router.get('/:id', getOrganization);
router.get('/:id/stats', getOrganizationStats);

router.post(
  '/',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(CreateOrganizationSchema),
  createOrganization,
);

router.put(
  '/:id',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  validate(UpdateOrganizationSchema),
  updateOrganization,
);

router.delete('/:id', authorize(Role.ADMIN), deleteOrganization);

export default router;
