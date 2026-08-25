import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ApiResponse } from '../types';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    const body: ApiResponse<never> = {
      success: false,
      message: 'Validation failed',
      errors,
    };
    res.status(400).json(body);
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.['target'] as string[]) ?? [];
      const body: ApiResponse<never> = {
        success: false,
        message: `A record with this ${fields.join(', ')} already exists`,
      };
      res.status(409).json(body);
      return;
    }

    if (err.code === 'P2025') {
      const body: ApiResponse<never> = {
        success: false,
        message: 'Record not found',
      };
      res.status(404).json(body);
      return;
    }

    const body: ApiResponse<never> = {
      success: false,
      message: 'Database operation failed',
    };
    res.status(500).json(body);
    return;
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    const body: ApiResponse<never> = {
      success: false,
      message: 'Invalid data provided to the database',
    };
    res.status(400).json(body);
    return;
  }

  // JWT token expired
  if (err instanceof TokenExpiredError) {
    const body: ApiResponse<never> = {
      success: false,
      message: 'Token has expired',
    };
    res.status(401).json(body);
    return;
  }

  // JWT invalid token
  if (err instanceof JsonWebTokenError) {
    const body: ApiResponse<never> = {
      success: false,
      message: 'Invalid token',
    };
    res.status(401).json(body);
    return;
  }

  // Generic error with status
  if (err instanceof Error) {
    const statusCode =
      'statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 500;

    const body: ApiResponse<never> = {
      success: false,
      message: statusCode === 500 ? 'An internal server error occurred' : err.message,
    };

    if (process.env['NODE_ENV'] === 'development' && statusCode === 500) {
      console.error('[ERROR]', err);
    }

    res.status(statusCode).json(body);
    return;
  }

  // Unknown error
  const body: ApiResponse<never> = {
    success: false,
    message: 'An unexpected error occurred',
  };
  res.status(500).json(body);
}
