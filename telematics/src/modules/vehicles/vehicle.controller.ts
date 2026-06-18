import { Request, Response, NextFunction } from 'express';
import vehicleService from './vehicle.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { VehicleStatus } from '@prisma/client';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicle.schemas';

export async function getVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { status } = req.query as { status?: VehicleStatus };
    const { vehicles, total, page, limit } = await vehicleService.findAll(
      orgId,
      req.query as Record<string, unknown>,
      { status },
    );
    paginatedResponse(res, vehicles, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getVehicle(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const vehicle = await vehicleService.findById(orgId, req.params.id);
    successResponse(res, vehicle);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleStats(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const stats = await vehicleService.getStats(orgId, req.params.id);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(
  req: Request<Record<string, string>, unknown, CreateVehicleInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const vehicle = await vehicleService.create(orgId, req.body);
    successResponse(res, vehicle, 'Vehicle created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(
  req: Request<{ id: string }, unknown, UpdateVehicleInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const vehicle = await vehicleService.update(orgId, req.params.id, req.body);
    successResponse(res, vehicle, 'Vehicle updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteVehicle(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await vehicleService.delete(orgId, req.params.id);
    successResponse(res, null, 'Vehicle deleted successfully');
  } catch (err) {
    next(err);
  }
}
