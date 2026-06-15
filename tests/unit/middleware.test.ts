// Mock the JWT utils used by the auth middleware so we control token verification.
jest.mock('../../src/shared/utils/jwt', () => ({
  verifyAccessToken: jest.fn(),
}));

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authenticate, authorize } from '../../src/shared/middleware/auth.middleware';
import { validate } from '../../src/shared/middleware/validate.middleware';
import { errorMiddleware } from '../../src/shared/middleware/error.middleware';
import { verifyAccessToken } from '../../src/shared/utils/jwt';
import { AuthPayload } from '../../src/shared/types';

const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

function mockResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

const authPayload: AuthPayload = {
  userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'alice@example.com',
  role: 'ADMIN',
  organizationId: 'b2c3d4e5-f6a7-8901-bcde-f01234567891',
};

describe('middleware', () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn() as NextFunction;
  });

  // ─── authenticate ────────────────────────────────────────────────────────────

  describe('authenticate', () => {
    it('should populate req.user and call next() for a valid Bearer token', () => {
      mockVerifyAccessToken.mockReturnValue(authPayload);
      const req = {
        headers: { authorization: 'Bearer valid.token.here' },
      } as unknown as Request;

      authenticate(req, res, next);

      expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid.token.here');
      expect(req.user).toEqual(authPayload);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should respond 401 when the Authorization header is missing', () => {
      const req = { headers: {} } as unknown as Request;

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization token is required',
      });
      expect(next).not.toHaveBeenCalled();
      expect(mockVerifyAccessToken).not.toHaveBeenCalled();
    });

    it('should respond 401 when the header does not start with "Bearer "', () => {
      const req = {
        headers: { authorization: 'Basic abc123' },
      } as unknown as Request;

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should respond 401 when the token is invalid (verify throws)', () => {
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('invalid token');
      });
      const req = {
        headers: { authorization: 'Bearer bad.token' },
      } as unknown as Request;

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });

  // ─── authorize ───────────────────────────────────────────────────────────────

  describe('authorize', () => {
    it('should call next() when the user role is allowed', () => {
      const req = { user: { ...authPayload, role: 'ADMIN' } } as unknown as Request;

      authorize('ADMIN', 'COMPLIANCE_OFFICER')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should respond 403 when the user role is not allowed', () => {
      const req = { user: { ...authPayload, role: 'VIEWER' } } as unknown as Request;

      authorize('ADMIN', 'COMPLIANCE_OFFICER')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to perform this action',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should respond 401 when req.user is absent', () => {
      const req = {} as unknown as Request;

      authorize('AUDITOR')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── validate ────────────────────────────────────────────────────────────────

  describe('validate', () => {
    const schema = z.object({ email: z.string().email() });

    it('should call next() for a valid body', () => {
      const req = { body: { email: 'alice@example.com' } } as unknown as Request;

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).toEqual({ email: 'alice@example.com' });
    });

    it('should respond 400 with field-level errors for an invalid body', () => {
      const req = { body: { email: 'not-an-email' } } as unknown as Request;

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.message).toBe('Validation failed');
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors[0].field).toBe('email');
      expect(typeof body.errors[0].message).toBe('string');
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── errorMiddleware ──────────────────────────────────────────────────────────

  describe('errorMiddleware', () => {
    const req = {} as Request;

    it('should use a custom statusCode from the error and surface its message', () => {
      const err = Object.assign(new Error('Resource conflict'), { statusCode: 409 });

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource conflict',
      });
    });

    it('should map a Prisma P2002 (unique constraint) error to 409', () => {
      const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.7.0',
        meta: { target: ['email'] },
      });

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.message).toBe('A record with this email already exists');
    });

    it('should map a Prisma P2025 (record not found) error to 404', () => {
      const err = new Prisma.PrismaClientKnownRequestError('Record to update not found', {
        code: 'P2025',
        clientVersion: '5.7.0',
      });

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Record not found',
      });
    });

    it('should return 500 with a generic message for an error without a statusCode', () => {
      const err = new Error('Boom — internal failure');

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'An internal server error occurred',
      });
    });

    it('should return 500 for a completely unknown (non-Error) thrown value', () => {
      errorMiddleware('a plain string error', req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'An unexpected error occurred',
      });
    });
  });
});
