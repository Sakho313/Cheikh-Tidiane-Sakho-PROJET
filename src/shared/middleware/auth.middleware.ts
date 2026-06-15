import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import { AuthPayload } from '../types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    errorResponse(res, 'Authorization token is required', 401);
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    errorResponse(res, 'Invalid or expired token', 401);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(
        res,
        'You do not have permission to perform this action',
        403,
      );
      return;
    }

    next();
  };
}
