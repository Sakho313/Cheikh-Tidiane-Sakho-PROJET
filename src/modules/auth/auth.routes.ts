import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
} from './auth.schemas';
import {
  register,
  login,
  refresh,
  getProfile,
} from './auth.controller';

const router = Router();

router.post('/register', validate(RegisterSchema), register);
router.post('/login', validate(LoginSchema), login);
router.post('/refresh', validate(RefreshTokenSchema), refresh);
router.get('/me', authenticate, getProfile);

export default router;
