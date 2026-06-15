import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  authenticate,
  authorize,
} from '../../shared/middleware/auth.middleware';
import { generateReport, getReport, getReports } from './report.controller';

const router = Router();

router.use(authenticate);

router.get('/org/:orgId', getReports);
router.get('/:id', getReport);

router.post(
  '/generate',
  authorize(Role.ADMIN, Role.COMPLIANCE_OFFICER),
  generateReport,
);

export default router;
