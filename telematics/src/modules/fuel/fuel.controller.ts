import { Request, Response, NextFunction } from 'express';
import fuelService from './fuel.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { FuelRecordType } from '@prisma/client';
import { CreateFuelRecordInput, UpdateFuelRecordInput } from './fuel.schemas';

function parseRange(req: Request): { from?: Date; to?: Date } {
  const { from, to } = req.query as { from?: string; to?: string };
  const range: { from?: Date; to?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) range.from = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) range.to = d;
  }
  return range;
}

export async function getFuelRecords(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { vehicleId, driverId, type } = req.query as {
      vehicleId?: string;
      driverId?: string;
      type?: FuelRecordType;
    };
    const { records, total, page, limit } = await fuelService.findAll(
      orgId,
      req.query as Record<string, unknown>,
      { vehicleId, driverId, type },
    );
    paginatedResponse(res, records, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleFuelRecords(
  req: Request<{ vehicleId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const records = await fuelService.findByVehicle(orgId, req.params.vehicleId);
    successResponse(res, records);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleEfficiency(
  req: Request<{ vehicleId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const efficiency = await fuelService.getVehicleEfficiency(orgId, req.params.vehicleId);
    successResponse(res, efficiency);
  } catch (err) {
    next(err);
  }
}

export async function getFuelStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const stats = await fuelService.getStats(orgId, parseRange(req));
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function getTheftDetection(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const suspicions = await fuelService.getTheftDetection(orgId, parseRange(req));
    successResponse(res, suspicions);
  } catch (err) {
    next(err);
  }
}

export async function getFuelRecord(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const record = await fuelService.findById(orgId, req.params.id);
    successResponse(res, record);
  } catch (err) {
    next(err);
  }
}

export async function createFuelRecord(
  req: Request<Record<string, string>, unknown, CreateFuelRecordInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const record = await fuelService.create(orgId, req.body);
    successResponse(res, record, 'Fuel record created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateFuelRecord(
  req: Request<{ id: string }, unknown, UpdateFuelRecordInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const record = await fuelService.update(orgId, req.params.id, req.body);
    successResponse(res, record, 'Fuel record updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteFuelRecord(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await fuelService.delete(orgId, req.params.id);
    successResponse(res, null, 'Fuel record deleted successfully');
  } catch (err) {
    next(err);
  }
}
