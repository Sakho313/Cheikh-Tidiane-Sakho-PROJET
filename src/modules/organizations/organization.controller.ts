import { Request, Response, NextFunction } from 'express';
import organizationService from './organization.service';
import {
  successResponse,
  paginatedResponse,
} from '../../shared/utils/response';
import {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from './organization.schemas';

export async function getOrganizations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { organizations, total, page, limit } =
      await organizationService.findAll(req.query as Record<string, unknown>);
    paginatedResponse(res, organizations, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getOrganization(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organization = await organizationService.findById(req.params.id);
    successResponse(res, organization);
  } catch (err) {
    next(err);
  }
}

export async function createOrganization(
  req: Request<unknown, unknown, CreateOrganizationInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organization = await organizationService.create(req.body);
    successResponse(res, organization, 'Organization created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateOrganization(
  req: Request<{ id: string }, unknown, UpdateOrganizationInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organization = await organizationService.update(
      req.params.id,
      req.body,
    );
    successResponse(res, organization, 'Organization updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteOrganization(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await organizationService.delete(req.params.id);
    successResponse(res, null, 'Organization deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function getOrganizationStats(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await organizationService.getStats(req.params.id);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}
