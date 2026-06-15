import { Request, Response, NextFunction } from 'express';
import auditService from './audit.service';
import {
  successResponse,
  paginatedResponse,
} from '../../shared/utils/response';
import { AuditType, AuditStatus } from '@prisma/client';
import {
  CreateAuditInput,
  UpdateAuditInput,
  CreateFindingInput,
  UpdateFindingInput,
} from './audit.schemas';

export async function getAudits(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { type, status } = req.query as {
      type?: AuditType;
      status?: AuditStatus;
    };
    const { audits, total, page, limit } = await auditService.findAll(
      req.params.orgId,
      req.query as Record<string, unknown>,
      { type, status },
    );
    paginatedResponse(res, audits, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getAudit(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const audit = await auditService.findById(req.params.id);
    successResponse(res, audit);
  } catch (err) {
    next(err);
  }
}

export async function createAudit(
  req: Request<unknown, unknown, CreateAuditInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const audit = await auditService.create(req.body);
    successResponse(res, audit, 'Audit created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAudit(
  req: Request<{ id: string }, unknown, UpdateAuditInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const audit = await auditService.update(req.params.id, req.body);
    successResponse(res, audit, 'Audit updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteAudit(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await auditService.delete(req.params.id);
    successResponse(res, null, 'Audit deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function addFinding(
  req: Request<{ id: string }, unknown, CreateFindingInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const finding = await auditService.addFinding(req.params.id, req.body);
    successResponse(res, finding, 'Finding added successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateFinding(
  req: Request<{ id: string; findingId: string }, unknown, UpdateFindingInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const finding = await auditService.updateFinding(
      req.params.id,
      req.params.findingId,
      req.body,
    );
    successResponse(res, finding, 'Finding updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function getFindings(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const findings = await auditService.getFindings(req.params.id);
    successResponse(res, findings);
  } catch (err) {
    next(err);
  }
}

export async function getAuditStats(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await auditService.getStats(req.params.orgId);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}
