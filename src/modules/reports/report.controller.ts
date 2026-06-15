import { Request, Response, NextFunction } from 'express';
import reportService, { ReportPeriod } from './report.service';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { ReportType } from '@prisma/client';

interface GenerateReportBody {
  organizationId: string;
  type: ReportType;
  periodStart?: string;
  periodEnd?: string;
}

export async function generateReport(
  req: Request<unknown, unknown, GenerateReportBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { organizationId, type, periodStart, periodEnd } = req.body;
    const generatedById = req.user!.userId;

    if (!organizationId || !type) {
      res.status(400).json({
        success: false,
        message: 'organizationId and type are required',
      });
      return;
    }

    const period: ReportPeriod = {
      start: periodStart ? new Date(periodStart) : undefined,
      end: periodEnd ? new Date(periodEnd) : undefined,
    };

    let report;

    switch (type) {
      case ReportType.COMPLIANCE:
        report = await reportService.generateComplianceReport(
          organizationId,
          period,
          generatedById,
        );
        break;
      case ReportType.INCIDENT:
        report = await reportService.generateIncidentReport(organizationId, period, generatedById);
        break;
      case ReportType.RISK:
        report = await reportService.generateRiskReport(organizationId, period, generatedById);
        break;
      case ReportType.AUDIT:
        report = await reportService.generateAuditReport(organizationId, period, generatedById);
        break;
      case ReportType.EXECUTIVE:
        report = await reportService.generateExecutiveReport(organizationId, period, generatedById);
        break;
      default:
        res.status(400).json({
          success: false,
          message: `Unsupported report type: ${String(type)}`,
        });
        return;
    }

    successResponse(res, report, 'Report generated successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getReport(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const report = await reportService.findById(req.params.id);
    successResponse(res, report);
  } catch (err) {
    next(err);
  }
}

export async function getReports(
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { reports, total, page, limit } = await reportService.findAll(
      req.params.orgId,
      req.query as Record<string, unknown>,
    );
    paginatedResponse(res, reports, total, page, limit);
  } catch (err) {
    next(err);
  }
}
