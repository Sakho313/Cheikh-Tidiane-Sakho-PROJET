import { Request, Response, NextFunction } from 'express';
import geofenceService from './geofence.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { GeofenceCategory } from '@prisma/client';
import { CreateGeofenceInput, UpdateGeofenceInput } from './geofence.schemas';

export async function getGeofences(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { category, isActive } = req.query as {
      category?: GeofenceCategory;
      isActive?: string;
    };
    const isActiveFilter =
      isActive === undefined ? undefined : isActive === 'true';
    const geofences = await geofenceService.findAll(orgId, {
      category,
      isActive: isActiveFilter,
    });
    successResponse(res, geofences);
  } catch (err) {
    next(err);
  }
}

export async function getGeofence(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const geofence = await geofenceService.findById(orgId, req.params.id);
    successResponse(res, geofence);
  } catch (err) {
    next(err);
  }
}

export async function getGeofenceEvents(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { events, total, page, limit } = await geofenceService.getEvents(
      orgId,
      req.params.id,
      req.query as Record<string, unknown>,
    );
    paginatedResponse(res, events, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function createGeofence(
  req: Request<Record<string, string>, unknown, CreateGeofenceInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const geofence = await geofenceService.create(orgId, req.body);
    successResponse(res, geofence, 'Geofence created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateGeofence(
  req: Request<{ id: string }, unknown, UpdateGeofenceInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const geofence = await geofenceService.update(orgId, req.params.id, req.body);
    successResponse(res, geofence, 'Geofence updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteGeofence(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await geofenceService.delete(orgId, req.params.id);
    successResponse(res, null, 'Geofence deleted successfully');
  } catch (err) {
    next(err);
  }
}
