import { Request, Response, NextFunction } from 'express';
import authService from './auth.service';
import { successResponse } from '../../shared/utils/response';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.schemas';

export async function register(
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.register(req.body);
    successResponse(res, result, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login(req.body);
    successResponse(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request<unknown, unknown, RefreshTokenInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    successResponse(res, result, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await authService.getProfile(req.user!.userId);
    successResponse(res, profile, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
}
