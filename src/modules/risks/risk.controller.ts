import { Request, Response, NextFunction } from 'express';
import riskService from './risk.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { RiskCategory, RiskStatus } from '@prisma/client';
import { CreateRiskInput, UpdateRiskInput } from './risk.schemas';

export async function getRisks(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { category, status } = req.query as {
      category?: RiskCategory;
      status?: RiskStatus;
    };
    const { risks, total, page, limit } = await riskService.findAll(
      req.params.orgId,
      req.query as Record<string, unknown>,
      { category, status },
    );
    paginatedResponse(res, risks, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getRisk(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const risk = await riskService.findById(req.params.id);
    successResponse(res, risk);
  } catch (err) {
    next(err);
  }
}

export async function createRisk(
  req: Request<unknown, unknown, CreateRiskInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const risk = await riskService.create(req.body);
    successResponse(res, risk, 'Risk created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateRisk(
  req: Request<{ id: string }, unknown, UpdateRiskInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const risk = await riskService.update(req.params.id, req.body);
    successResponse(res, risk, 'Risk updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteRisk(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await riskService.delete(req.params.id);
    successResponse(res, null, 'Risk deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function getRiskMatrix(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const matrix = await riskService.getRiskMatrix(req.params.orgId);
    successResponse(res, matrix);
  } catch (err) {
    next(err);
  }
}

export async function getRiskStats(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await riskService.getStats(req.params.orgId);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
}
