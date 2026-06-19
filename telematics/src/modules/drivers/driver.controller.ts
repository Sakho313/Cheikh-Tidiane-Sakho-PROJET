import { Request, Response, NextFunction } from 'express';
import driverService from './driver.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { DriverStatus } from '@prisma/client';
import { CreateDriverInput, UpdateDriverInput } from './driver.schemas';

export async function getDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { status } = req.query as { status?: DriverStatus };
    const { drivers, total, page, limit } = await driverService.findAll(
      orgId,
      req.query as Record<string, unknown>,
      { status },
    );
    paginatedResponse(res, drivers, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getDriver(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const driver = await driverService.findById(orgId, req.params.id);
    successResponse(res, driver);
  } catch (err) {
    next(err);
  }
}

export async function getDriverStats(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const stats = await driverService.getStats(orgId, req.params.id);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function createDriver(
  req: Request<Record<string, string>, unknown, CreateDriverInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const driver = await driverService.create(orgId, req.body);
    successResponse(res, driver, 'Driver created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateDriver(
  req: Request<{ id: string }, unknown, UpdateDriverInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const driver = await driverService.update(orgId, req.params.id, req.body);
    successResponse(res, driver, 'Driver updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteDriver(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await driverService.delete(orgId, req.params.id);
    successResponse(res, null, 'Driver deleted successfully');
  } catch (err) {
    next(err);
  }
}
