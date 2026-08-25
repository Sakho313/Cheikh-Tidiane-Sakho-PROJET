import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from './auth.schemas';
import { register, login, refresh, getProfile } from './auth.controller';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Créer un compte utilisateur
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       201: { description: Compte créé }
 */
router.post('/register', validate(RegisterSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: Connexion réussie }
 */
router.post('/login', validate(LoginSchema), login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renouveler l'access token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: Token renouvelé }
 */
router.post('/refresh', validate(RefreshTokenSchema), refresh);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Profil de l'utilisateur connecté
 *     tags: [Auth]
 *     responses:
 *       200: { description: Profil }
 */
router.get('/me', authenticate, getProfile);

export default router;
