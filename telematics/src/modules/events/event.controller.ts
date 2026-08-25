import { Request, Response, NextFunction } from 'express';
import { EventSeverity, EventType } from '@prisma/client';
import eventService from './event.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { resolveOrgId } from '../../shared/utils/org';
import { CreateEventInput } from './event.schemas';

export async function getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { vehicleId, driverId, tripId, type, severity } = req.query as {
      vehicleId?: string;
      driverId?: string;
      tripId?: string;
      type?: EventType;
      severity?: EventSeverity;
    };
    const { events, total, page, limit } = await eventService.findAll(
      orgId,
      req.query as Record<string, unknown>,
      { vehicleId, driverId, tripId, type, severity },
    );
    paginatedResponse(res, events, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getEvent(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const event = await eventService.findById(orgId, req.params.id);
    successResponse(res, event);
  } catch (err) {
    next(err);
  }
}

export async function getEventStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const { vehicleId, driverId, from, to } = req.query as {
      vehicleId?: string;
      driverId?: string;
      from?: string;
      to?: string;
    };
    const filters: { vehicleId?: string; driverId?: string; from?: Date; to?: Date } = {};
    if (vehicleId) filters.vehicleId = vehicleId;
    if (driverId) filters.driverId = driverId;
    if (from) filters.from = new Date(from);
    if (to) filters.to = new Date(to);

    const stats = await eventService.getStats(orgId, filters);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function createEvent(
  req: Request<Record<string, string>, unknown, CreateEventInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    const event = await eventService.create(orgId, req.body);
    successResponse(res, event, 'Driving event created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = resolveOrgId(req);
    await eventService.delete(orgId, req.params.id);
    successResponse(res, null, 'Driving event deleted successfully');
  } catch (err) {
    next(err);
  }
}
