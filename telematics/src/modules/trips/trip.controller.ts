import { Request, Response, NextFunction } from 'express';
import { TripStatus } from '@prisma/client';
import tripService from './trip.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { UpdateTripInput } from './trip.schemas';

export async function getTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { vehicleId, driverId, status } = req.query as {
      vehicleId?: string;
      driverId?: string;
      status?: TripStatus;
    };
    const { trips, total, page, limit } = await tripService.findAll(
      orgId,
      req.query as Record<string, unknown>,
      { vehicleId, driverId, status },
    );
    paginatedResponse(res, trips, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getTrip(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const trip = await tripService.findById(orgId, req.params.id);
    successResponse(res, trip);
  } catch (err) {
    next(err);
  }
}

export async function getTripPositions(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const positions = await tripService.getPositions(orgId, req.params.id);
    successResponse(res, positions);
  } catch (err) {
    next(err);
  }
}

export async function getTripTrack(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const track = await tripService.getTrack(orgId, req.params.id);
    successResponse(res, track);
  } catch (err) {
    next(err);
  }
}

export async function updateTrip(
  req: Request<{ id: string }, unknown, UpdateTripInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const trip = await tripService.update(orgId, req.params.id, req.body);
    successResponse(res, trip, 'Trip updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function closeTrip(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const trip = await tripService.close(orgId, req.params.id);
    successResponse(res, trip, 'Trip closed successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteTrip(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await tripService.delete(orgId, req.params.id);
    successResponse(res, null, 'Trip deleted successfully');
  } catch (err) {
    next(err);
  }
}
