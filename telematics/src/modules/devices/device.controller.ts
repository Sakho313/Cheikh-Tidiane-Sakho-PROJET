import { Request, Response, NextFunction } from 'express';
import deviceService from './device.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { DeviceStatus } from '@prisma/client';
import { CreateDeviceInput, UpdateDeviceInput, AssignDeviceInput } from './device.schemas';

export async function getDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { status } = req.query as { status?: DeviceStatus };
    const { devices, total, page, limit } = await deviceService.findAll(
      orgId,
      req.query as Record<string, unknown>,
      { status },
    );
    paginatedResponse(res, devices, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getDevice(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const device = await deviceService.findById(orgId, req.params.id);
    successResponse(res, device);
  } catch (err) {
    next(err);
  }
}

export async function createDevice(
  req: Request<Record<string, string>, unknown, CreateDeviceInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const device = await deviceService.create(orgId, req.body);
    successResponse(res, device, 'Device created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateDevice(
  req: Request<{ id: string }, unknown, UpdateDeviceInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const device = await deviceService.update(orgId, req.params.id, req.body);
    successResponse(res, device, 'Device updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function assignDevice(
  req: Request<{ id: string }, unknown, AssignDeviceInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const device = await deviceService.assign(orgId, req.params.id, req.body.vehicleId);
    successResponse(res, device, 'Device assigned successfully');
  } catch (err) {
    next(err);
  }
}

export async function unassignDevice(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const device = await deviceService.unassign(orgId, req.params.id);
    successResponse(res, device, 'Device unassigned successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteDevice(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await deviceService.delete(orgId, req.params.id);
    successResponse(res, null, 'Device deleted successfully');
  } catch (err) {
    next(err);
  }
}
