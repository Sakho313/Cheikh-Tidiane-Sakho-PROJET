import { Request, Response, NextFunction } from 'express';
import maintenanceService from './maintenance.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { MaintenanceStatus } from '@prisma/client';
import { CreateMaintenanceInput, UpdateMaintenanceInput } from './maintenance.schemas';

export async function getMaintenances(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { vehicleId, status } = req.query as {
      vehicleId?: string;
      status?: MaintenanceStatus;
    };
    const { maintenances, total, page, limit } = await maintenanceService.findAll(
      orgId,
      req.query as Record<string, unknown>,
      { vehicleId, status },
    );
    paginatedResponse(res, maintenances, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleMaintenances(
  req: Request<{ vehicleId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { maintenances, total, page, limit } = await maintenanceService.findByVehicle(
      orgId,
      req.params.vehicleId,
      req.query as Record<string, unknown>,
    );
    paginatedResponse(res, maintenances, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getMaintenance(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const maintenance = await maintenanceService.findById(orgId, req.params.id);
    successResponse(res, maintenance);
  } catch (err) {
    next(err);
  }
}

export async function createMaintenance(
  req: Request<Record<string, string>, unknown, CreateMaintenanceInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const maintenance = await maintenanceService.create(orgId, req.body);
    successResponse(res, maintenance, 'Maintenance created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateMaintenance(
  req: Request<{ id: string }, unknown, UpdateMaintenanceInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const maintenance = await maintenanceService.update(orgId, req.params.id, req.body);
    successResponse(res, maintenance, 'Maintenance updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteMaintenance(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await maintenanceService.delete(orgId, req.params.id);
    successResponse(res, null, 'Maintenance deleted successfully');
  } catch (err) {
    next(err);
  }
}
