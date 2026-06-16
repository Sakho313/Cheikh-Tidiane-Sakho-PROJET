import { Request, Response, NextFunction } from 'express';
import incidentService from './incident.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { CreateIncidentInput, UpdateIncidentInput } from './incident.schemas';

export async function getIncidents(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { severity, status } = req.query as {
      severity?: IncidentSeverity;
      status?: IncidentStatus;
    };
    const { incidents, total, page, limit } = await incidentService.findAll(
      req.params.orgId,
      req.query as Record<string, unknown>,
      { severity, status },
    );
    paginatedResponse(res, incidents, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getIncident(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const incident = await incidentService.findById(req.params.id);
    successResponse(res, incident);
  } catch (err) {
    next(err);
  }
}

export async function createIncident(
  req: Request<unknown, unknown, CreateIncidentInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const createdById = req.user!.userId;
    const incident = await incidentService.create(req.body, createdById);
    successResponse(res, incident, 'Incident created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateIncident(
  req: Request<{ id: string }, unknown, UpdateIncidentInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const incident = await incidentService.update(req.params.id, req.body);
    successResponse(res, incident, 'Incident updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function reportToAuthority(
  req: Request<{ id: string }, unknown, { authorityReference?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const incident = await incidentService.reportToAuthority(
      req.params.id,
      req.body.authorityReference,
    );
    successResponse(res, incident, 'Incident reported to authority successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteIncident(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await incidentService.delete(req.params.id);
    successResponse(res, null, 'Incident deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function getIncidentStats(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await incidentService.getStats(req.params.orgId);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}
