import { Request, Response, NextFunction } from 'express';
import complianceService from './compliance.service';
import { successResponse } from '../../shared/utils/response';
import {
  UpsertAssessmentInput,
  UpdateAssessmentInput,
} from './compliance.schemas';
import { ComplianceStatus } from '@prisma/client';

export async function getAllControls(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const controls = await complianceService.getAllControls();
    successResponse(res, controls);
  } catch (err) {
    next(err);
  }
}

export async function getAssessments(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { domain, status } = req.query as {
      domain?: string;
      status?: ComplianceStatus;
    };
    const assessments = await complianceService.getAssessments(
      req.params.orgId,
      { domain, status },
    );
    successResponse(res, assessments);
  } catch (err) {
    next(err);
  }
}

export async function upsertAssessment(
  req: Request<unknown, unknown, UpsertAssessmentInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assessment = await complianceService.upsertAssessment(req.body);
    successResponse(res, assessment, 'Assessment saved successfully', 200);
  } catch (err) {
    next(err);
  }
}

export async function updateAssessment(
  req: Request<{ id: string }, unknown, UpdateAssessmentInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assessment = await complianceService.updateAssessmentById(
      req.params.id,
      req.body,
    );
    successResponse(res, assessment, 'Assessment updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function getComplianceScore(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const score = await complianceService.getComplianceScore(req.params.orgId);
    successResponse(res, score);
  } catch (err) {
    next(err);
  }
}

export async function seedControls(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await complianceService.seedControls();
    successResponse(res, null, 'NIS2 controls seeded successfully');
  } catch (err) {
    next(err);
  }
}
