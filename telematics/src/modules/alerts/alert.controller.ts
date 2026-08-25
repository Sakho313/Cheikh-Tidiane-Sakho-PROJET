import { Request, Response, NextFunction } from 'express';
import alertService from './alert.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { AlertType, AlertSeverity, AlertStatus } from '@prisma/client';
import { CreateAlertInput } from './alert.schemas';

export async function getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { status, type, severity, vehicleId } = req.query as {
      status?: AlertStatus;
      type?: AlertType;
      severity?: AlertSeverity;
      vehicleId?: string;
    };
    const { alerts, total, page, limit } = await alertService.findAll(
      orgId,
      req.query as Record<string, unknown>,
      { status, type, severity, vehicleId },
    );
    paginatedResponse(res, alerts, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getAlertStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const stats = await alertService.getStats(orgId);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function getAlert(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const alert = await alertService.findById(orgId, req.params.id);
    successResponse(res, alert);
  } catch (err) {
    next(err);
  }
}

export async function createAlert(
  req: Request<Record<string, string>, unknown, CreateAlertInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const alert = await alertService.create(orgId, req.body);
    successResponse(res, alert, 'Alert created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function acknowledgeAlert(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const alert = await alertService.acknowledge(orgId, req.params.id, req.user!.userId);
    successResponse(res, alert, 'Alert acknowledged successfully');
  } catch (err) {
    next(err);
  }
}

export async function resolveAlert(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const alert = await alertService.resolve(orgId, req.params.id);
    successResponse(res, alert, 'Alert resolved successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteAlert(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await alertService.delete(orgId, req.params.id);
    successResponse(res, null, 'Alert deleted successfully');
  } catch (err) {
    next(err);
  }
}
