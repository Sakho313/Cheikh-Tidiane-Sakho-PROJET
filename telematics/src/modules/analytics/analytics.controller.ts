import { Request, Response, NextFunction } from 'express';
import analyticsService from './analytics.service';
import { successResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { RecomputeScoreInput } from './analytics.schemas';

/** Lit `?from` / `?to` (chaînes ISO) et les convertit en `Date | undefined`. */
function parseRange(query: Record<string, unknown>): { from?: Date; to?: Date } {
  const from = typeof query['from'] === 'string' ? new Date(query['from']) : undefined;
  const to = typeof query['to'] === 'string' ? new Date(query['to']) : undefined;
  return { from, to };
}

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const dashboard = await analyticsService.getDashboard(orgId);
    successResponse(res, dashboard);
  } catch (err) {
    next(err);
  }
}

export async function getDriverScores(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { from, to } = parseRange(req.query as Record<string, unknown>);
    const result = await analyticsService.getDriverScores(orgId, from, to);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getDriverBehavior(
  req: Request<{ driverId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { from, to } = parseRange(req.query as Record<string, unknown>);
    const result = await analyticsService.getDriverBehavior(orgId, req.params.driverId, from, to);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getFuelConsumption(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { from, to } = parseRange(req.query as Record<string, unknown>);
    const result = await analyticsService.getFuelConsumption(orgId, from, to);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getFleetUtilization(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { from, to } = parseRange(req.query as Record<string, unknown>);
    const result = await analyticsService.getFleetUtilization(orgId, from, to);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function recomputeDriverScore(
  req: Request<{ driverId: string }, unknown, RecomputeScoreInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const fromQuery = parseRange(req.query as Record<string, unknown>);
    const from = req.body.from ? new Date(req.body.from) : fromQuery.from;
    const to = req.body.to ? new Date(req.body.to) : fromQuery.to;
    const snapshot = await analyticsService.recomputeDriverScore(
      orgId,
      req.params.driverId,
      from,
      to,
    );
    successResponse(res, snapshot, 'Driver score recomputed successfully');
  } catch (err) {
    next(err);
  }
}
