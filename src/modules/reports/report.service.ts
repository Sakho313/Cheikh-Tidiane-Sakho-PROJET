import { prisma } from '../../config/database';
import { ReportType, ComplianceStatus } from '@prisma/client';

export interface ReportPeriod {
  start?: Date;
  end?: Date;
}

export class ReportService {
  async generateComplianceReport(orgId: string, period: ReportPeriod, generatedById: string) {
    const dateFilter =
      period.start && period.end
        ? { createdAt: { gte: period.start, lte: period.end } }
        : {};

    const [assessments, scoreData, controlsByDomain] = await Promise.all([
      prisma.complianceAssessment.findMany({
        where: { organizationId: orgId, ...dateFilter },
        include: { control: true },
      }),
      prisma.complianceAssessment.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.complianceControl.groupBy({
        by: ['domain'],
        _count: { id: true },
      }),
    ]);

    const totalAssessments = assessments.length;
    const compliantCount = assessments.filter(
      (a) => a.status === ComplianceStatus.COMPLIANT,
    ).length;
    const overallScore =
      totalAssessments > 0
        ? Math.round((compliantCount / totalAssessments) * 100)
        : 0;

    const nonCompliant = assessments
      .filter((a) => a.status === ComplianceStatus.NON_COMPLIANT)
      .map((a) => ({
        controlId: a.controlId,
        article: a.control.article,
        domain: a.control.domain,
        requirement: a.control.requirement,
        notes: a.notes,
        dueDate: a.dueDate,
      }));

    const data = {
      reportType: 'COMPLIANCE',
      generatedAt: new Date(),
      period,
      organizationId: orgId,
      summary: {
        totalControls: totalAssessments,
        compliantCount,
        overallScore,
        statusBreakdown: scoreData.reduce<Record<string, number>>((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {}),
      },
      domainBreakdown: controlsByDomain.map((d) => ({
        domain: d.domain,
        totalControls: d._count.id,
        assessedCount: assessments.filter((a) => a.control.domain === d.domain).length,
        compliantCount: assessments.filter(
          (a) => a.control.domain === d.domain && a.status === ComplianceStatus.COMPLIANT,
        ).length,
      })),
      nonCompliantControls: nonCompliant,
    };

    return prisma.report.create({
      data: {
        organizationId: orgId,
        type: ReportType.COMPLIANCE,
        title: `Compliance Report - ${new Date().toISOString().split('T')[0]}`,
        periodStart: period.start,
        periodEnd: period.end,
        generatedById,
        data,
      },
    });
  }

  async generateIncidentReport(orgId: string, period: ReportPeriod, generatedById: string) {
    const dateFilter =
      period.start && period.end
        ? { detectedAt: { gte: period.start, lte: period.end } }
        : {};

    const [incidents, bySeverity, byStatus] = await Promise.all([
      prisma.incident.findMany({
        where: { organizationId: orgId, ...dateFilter },
        include: {
          createdBy: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { detectedAt: 'desc' },
      }),
      prisma.incident.groupBy({
        by: ['severity'],
        where: { organizationId: orgId, ...dateFilter },
        _count: { id: true },
      }),
      prisma.incident.groupBy({
        by: ['status'],
        where: { organizationId: orgId, ...dateFilter },
        _count: { id: true },
      }),
    ]);

    const reportedCount = incidents.filter((i) => i.reportedToAuthority).length;
    const avgResolutionHours =
      incidents
        .filter((i) => i.resolvedAt)
        .reduce((sum, i) => {
          const hours =
            (i.resolvedAt!.getTime() - i.detectedAt.getTime()) / 3600000;
          return sum + hours;
        }, 0) / Math.max(incidents.filter((i) => i.resolvedAt).length, 1);

    const data = {
      reportType: 'INCIDENT',
      generatedAt: new Date(),
      period,
      organizationId: orgId,
      summary: {
        totalIncidents: incidents.length,
        reportedToAuthority: reportedCount,
        avgResolutionHours: Math.round(avgResolutionHours),
        bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count.id })),
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      },
      incidents: incidents.map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        status: i.status,
        incidentType: i.incidentType,
        detectedAt: i.detectedAt,
        reportedAt: i.reportedAt,
        resolvedAt: i.resolvedAt,
        reportedToAuthority: i.reportedToAuthority,
        authorityReference: i.authorityReference,
        estimatedUsers: i.estimatedUsers,
      })),
    };

    return prisma.report.create({
      data: {
        organizationId: orgId,
        type: ReportType.INCIDENT,
        title: `Incident Report - ${new Date().toISOString().split('T')[0]}`,
        periodStart: period.start,
        periodEnd: period.end,
        generatedById,
        data,
      },
    });
  }

  async generateRiskReport(orgId: string, period: ReportPeriod, generatedById: string) {
    const dateFilter =
      period.start && period.end
        ? { createdAt: { gte: period.start, lte: period.end } }
        : {};

    const [risks, byCategory, byStatus] = await Promise.all([
      prisma.risk.findMany({
        where: { organizationId: orgId, ...dateFilter },
        include: {
          owner: { select: { firstName: true, lastName: true } },
        },
        orderBy: { riskScore: 'desc' },
      }),
      prisma.risk.groupBy({
        by: ['category'],
        where: { organizationId: orgId },
        _count: { id: true },
        _avg: { riskScore: true },
      }),
      prisma.risk.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
    ]);

    const criticalRisks = risks.filter((r) => r.riskScore >= 17);
    const highRisks = risks.filter((r) => r.riskScore >= 10 && r.riskScore < 17);

    const data = {
      reportType: 'RISK',
      generatedAt: new Date(),
      period,
      organizationId: orgId,
      summary: {
        totalRisks: risks.length,
        criticalCount: criticalRisks.length,
        highCount: highRisks.length,
        avgRiskScore:
          risks.length > 0
            ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length)
            : 0,
        byCategory: byCategory.map((c) => ({
          category: c.category,
          count: c._count.id,
          avgScore: Math.round(c._avg.riskScore ?? 0),
        })),
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      },
      topRisks: risks.slice(0, 10).map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        likelihood: r.likelihood,
        impact: r.impact,
        riskScore: r.riskScore,
        status: r.status,
        mitigationPlan: r.mitigationPlan,
      })),
    };

    return prisma.report.create({
      data: {
        organizationId: orgId,
        type: ReportType.RISK,
        title: `Risk Report - ${new Date().toISOString().split('T')[0]}`,
        periodStart: period.start,
        periodEnd: period.end,
        generatedById,
        data,
      },
    });
  }

  async generateAuditReport(orgId: string, period: ReportPeriod, generatedById: string) {
    const dateFilter =
      period.start && period.end
        ? { startDate: { gte: period.start, lte: period.end } }
        : {};

    const [audits, byType, byStatus, findingsBySeverity] = await Promise.all([
      prisma.audit.findMany({
        where: { organizationId: orgId, ...dateFilter },
        include: {
          auditor: { select: { firstName: true, lastName: true } },
          _count: { select: { findings: true } },
        },
        orderBy: { startDate: 'desc' },
      }),
      prisma.audit.groupBy({
        by: ['type'],
        where: { organizationId: orgId, ...dateFilter },
        _count: { id: true },
      }),
      prisma.audit.groupBy({
        by: ['status'],
        where: { organizationId: orgId, ...dateFilter },
        _count: { id: true },
      }),
      prisma.auditFinding.groupBy({
        by: ['severity'],
        where: { audit: { organizationId: orgId } },
        _count: { id: true },
      }),
    ]);

    const data = {
      reportType: 'AUDIT',
      generatedAt: new Date(),
      period,
      organizationId: orgId,
      summary: {
        totalAudits: audits.length,
        byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
        findingsBySeverity: findingsBySeverity.map((f) => ({
          severity: f.severity,
          count: f._count.id,
        })),
      },
      audits: audits.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        status: a.status,
        startDate: a.startDate,
        endDate: a.endDate,
        findingsCount: a._count.findings,
        summary: a.summary,
      })),
    };

    return prisma.report.create({
      data: {
        organizationId: orgId,
        type: ReportType.AUDIT,
        title: `Audit Report - ${new Date().toISOString().split('T')[0]}`,
        periodStart: period.start,
        periodEnd: period.end,
        generatedById,
        data,
      },
    });
  }

  async generateExecutiveReport(orgId: string, period: ReportPeriod, generatedById: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, sector: true, entityType: true, country: true },
    });

    if (!organization) {
      const error = new Error('Organization not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const dateFilter =
      period.start && period.end
        ? { createdAt: { gte: period.start, lte: period.end } }
        : {};

    const [
      complianceScoreData,
      incidentCounts,
      riskCounts,
      auditCounts,
    ] = await Promise.all([
      prisma.complianceAssessment.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.incident.groupBy({
        by: ['severity'],
        where: { organizationId: orgId, ...dateFilter },
        _count: { id: true },
      }),
      prisma.risk.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.audit.groupBy({
        by: ['status'],
        where: { organizationId: orgId, ...dateFilter },
        _count: { id: true },
      }),
    ]);

    const totalAssessments = complianceScoreData.reduce((s, c) => s + c._count.id, 0);
    const compliantCount =
      complianceScoreData.find((c) => c.status === ComplianceStatus.COMPLIANT)?._count.id ?? 0;
    const complianceScore =
      totalAssessments > 0
        ? Math.round((compliantCount / totalAssessments) * 100)
        : 0;

    const totalIncidents = incidentCounts.reduce((s, c) => s + c._count.id, 0);
    const criticalIncidents =
      incidentCounts.find((c) => c.severity === 'CRITICAL')?._count.id ?? 0;

    const totalRisks = riskCounts.reduce((s, c) => s + c._count.id, 0);
    const openRisks = riskCounts
      .filter((c) => !['MITIGATED', 'ACCEPTED', 'CLOSED'].includes(c.status))
      .reduce((s, c) => s + c._count.id, 0);

    const data = {
      reportType: 'EXECUTIVE',
      generatedAt: new Date(),
      period,
      organization,
      executiveSummary: {
        complianceScore,
        totalIncidents,
        criticalIncidents,
        totalRisks,
        openRisks,
        totalAudits: auditCounts.reduce((s, c) => s + c._count.id, 0),
      },
      compliance: {
        score: complianceScore,
        totalAssessments,
        compliantCount,
        statusBreakdown: complianceScoreData.reduce<Record<string, number>>((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {}),
      },
      incidents: {
        total: totalIncidents,
        critical: criticalIncidents,
        bySeverity: incidentCounts.map((c) => ({
          severity: c.severity,
          count: c._count.id,
        })),
      },
      risks: {
        total: totalRisks,
        open: openRisks,
        byStatus: riskCounts.map((c) => ({
          status: c.status,
          count: c._count.id,
        })),
      },
      audits: {
        byStatus: auditCounts.map((c) => ({
          status: c.status,
          count: c._count.id,
        })),
      },
    };

    return prisma.report.create({
      data: {
        organizationId: orgId,
        type: ReportType.EXECUTIVE,
        title: `Executive Report - ${new Date().toISOString().split('T')[0]}`,
        periodStart: period.start,
        periodEnd: period.end,
        generatedById,
        data,
      },
    });
  }

  async findById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        generatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!report) {
      const error = new Error('Report not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return report;
  }

  async findAll(orgId: string, query: Record<string, unknown>) {
    const page = parseInt(String(query['page'] ?? '1'), 10);
    const limit = Math.min(parseInt(String(query['limit'] ?? '20'), 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId: orgId };

    if (query['type']) {
      where['type'] = query['type'];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          generatedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return { reports, total, page, limit };
  }
}

export default new ReportService();
