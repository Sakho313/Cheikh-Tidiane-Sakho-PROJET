import { ReportService } from '../../src/modules/reports/report.service';

// Mock Prisma — declare every model/method the service touches.
jest.mock('../../src/config/database', () => ({
  prisma: {
    report: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    complianceAssessment: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    complianceControl: {
      groupBy: jest.fn(),
    },
    incident: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    risk: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    audit: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    auditFinding: {
      groupBy: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/config/database';

const mockReport = prisma.report as jest.Mocked<typeof prisma.report>;
const mockComplianceAssessment = prisma.complianceAssessment as jest.Mocked<
  typeof prisma.complianceAssessment
>;
const mockComplianceControl = prisma.complianceControl as jest.Mocked<
  typeof prisma.complianceControl
>;
const mockIncident = prisma.incident as jest.Mocked<typeof prisma.incident>;
const mockRisk = prisma.risk as jest.Mocked<typeof prisma.risk>;
const mockAudit = prisma.audit as jest.Mocked<typeof prisma.audit>;
const mockAuditFinding = prisma.auditFinding as jest.Mocked<typeof prisma.auditFinding>;
const mockOrganization = prisma.organization as jest.Mocked<typeof prisma.organization>;

const ORG_ID = 'b2c3d4e5-f6a7-8901-bcde-f01234567891';
const USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const REPORT_ID = 'd0000000-0000-0000-0000-000000000001';

// Freeze time so report titles (which embed today's date) are deterministic.
const FIXED_NOW = new Date('2026-06-15T12:00:00.000Z');
const TODAY = '2026-06-15';

const PERIOD = {
  start: new Date('2026-01-01T00:00:00.000Z'),
  end: new Date('2026-03-31T23:59:59.000Z'),
};

// The report row Prisma returns from create(); the service returns it verbatim.
const createdReport = (type: string) => ({
  id: REPORT_ID,
  organizationId: ORG_ID,
  type,
  title: `${type} Report`,
  periodStart: PERIOD.start,
  periodEnd: PERIOD.end,
  generatedById: USER_ID,
  data: {},
  createdAt: FIXED_NOW,
});

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    service = new ReportService();
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── generateComplianceReport() ──────────────────────────────────────────────

  describe('generateComplianceReport()', () => {
    const control = (domain: string, article: string) => ({
      id: `ctrl-${article}`,
      article,
      domain,
      requirement: `Requirement ${article}`,
    });

    it('should compute the overall score, domain breakdown and persist a COMPLIANCE report', async () => {
      const assessments = [
        {
          controlId: 'c1',
          status: 'COMPLIANT',
          notes: null,
          dueDate: null,
          control: control('GOVERNANCE', '21.1'),
        },
        {
          controlId: 'c2',
          status: 'COMPLIANT',
          notes: null,
          dueDate: null,
          control: control('GOVERNANCE', '21.2'),
        },
        {
          controlId: 'c3',
          status: 'NON_COMPLIANT',
          notes: 'Gap identified',
          dueDate: PERIOD.end,
          control: control('INCIDENT', '21.3'),
        },
        {
          controlId: 'c4',
          status: 'PARTIAL',
          notes: null,
          dueDate: null,
          control: control('INCIDENT', '21.4'),
        },
      ];

      mockComplianceAssessment.findMany.mockResolvedValue(assessments as never);
      mockComplianceAssessment.groupBy.mockResolvedValue([
        { status: 'COMPLIANT', _count: { id: 2 } },
        { status: 'NON_COMPLIANT', _count: { id: 1 } },
        { status: 'PARTIAL', _count: { id: 1 } },
      ] as never);
      mockComplianceControl.groupBy.mockResolvedValue([
        { domain: 'GOVERNANCE', _count: { id: 2 } },
        { domain: 'INCIDENT', _count: { id: 2 } },
      ] as never);
      mockReport.create.mockResolvedValue(createdReport('COMPLIANCE') as never);

      const result = await service.generateComplianceReport(ORG_ID, PERIOD, USER_ID);

      // Date filter is applied to the findMany when a period is provided.
      expect(mockComplianceAssessment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            createdAt: { gte: PERIOD.start, lte: PERIOD.end },
          }),
          include: { control: true },
        }),
      );

      expect(mockReport.create).toHaveBeenCalledTimes(1);
      const arg = mockReport.create.mock.calls[0][0] as unknown as {
        data: { type: string; title: string; data: Record<string, unknown> };
      };

      expect(arg.data.type).toBe('COMPLIANCE');
      expect(arg.data.title).toBe(`Compliance Report - ${TODAY}`);

      const payload = arg.data.data as {
        reportType: string;
        summary: {
          totalControls: number;
          compliantCount: number;
          overallScore: number;
          statusBreakdown: Record<string, number>;
        };
        domainBreakdown: Array<{
          domain: string;
          totalControls: number;
          assessedCount: number;
          compliantCount: number;
        }>;
        nonCompliantControls: Array<{ controlId: string }>;
      };

      expect(payload.reportType).toBe('COMPLIANCE');
      expect(payload.summary.totalControls).toBe(4);
      expect(payload.summary.compliantCount).toBe(2);
      // 2 compliant / 4 total = 50%
      expect(payload.summary.overallScore).toBe(50);
      expect(payload.summary.statusBreakdown).toEqual({
        COMPLIANT: 2,
        NON_COMPLIANT: 1,
        PARTIAL: 1,
      });

      expect(payload.domainBreakdown).toEqual([
        { domain: 'GOVERNANCE', totalControls: 2, assessedCount: 2, compliantCount: 2 },
        { domain: 'INCIDENT', totalControls: 2, assessedCount: 2, compliantCount: 0 },
      ]);

      expect(payload.nonCompliantControls).toHaveLength(1);
      expect(payload.nonCompliantControls[0].controlId).toBe('c3');

      expect(result).toEqual(createdReport('COMPLIANCE'));
    });

    it('should default the overall score to 0 when there are no assessments and omit the date filter', async () => {
      mockComplianceAssessment.findMany.mockResolvedValue([] as never);
      mockComplianceAssessment.groupBy.mockResolvedValue([] as never);
      mockComplianceControl.groupBy.mockResolvedValue([] as never);
      mockReport.create.mockResolvedValue(createdReport('COMPLIANCE') as never);

      await service.generateComplianceReport(ORG_ID, {}, USER_ID);

      // No period => no createdAt filter.
      expect(mockComplianceAssessment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: ORG_ID } }),
      );

      const arg = mockReport.create.mock.calls[0][0] as unknown as {
        data: { data: { summary: { overallScore: number; totalControls: number } } };
      };
      expect(arg.data.data.summary.overallScore).toBe(0);
      expect(arg.data.data.summary.totalControls).toBe(0);
    });
  });

  // ─── generateIncidentReport() ────────────────────────────────────────────────

  describe('generateIncidentReport()', () => {
    it('should compute reported count and average resolution time and persist an INCIDENT report', async () => {
      const incidents = [
        {
          id: 'i1',
          title: 'Phishing campaign',
          severity: 'HIGH',
          status: 'RESOLVED',
          incidentType: 'PHISHING',
          detectedAt: new Date('2026-02-01T00:00:00.000Z'),
          reportedAt: new Date('2026-02-01T02:00:00.000Z'),
          // Resolved 10h after detection.
          resolvedAt: new Date('2026-02-01T10:00:00.000Z'),
          reportedToAuthority: true,
          authorityReference: 'REF-001',
          estimatedUsers: 1000,
          createdBy: { firstName: 'Alice', lastName: 'Dupont' },
        },
        {
          id: 'i2',
          title: 'Malware infection',
          severity: 'CRITICAL',
          status: 'INVESTIGATING',
          incidentType: 'MALWARE',
          detectedAt: new Date('2026-02-05T00:00:00.000Z'),
          reportedAt: null,
          // Resolved 30h after detection.
          resolvedAt: new Date('2026-02-06T06:00:00.000Z'),
          reportedToAuthority: false,
          authorityReference: null,
          estimatedUsers: null,
          createdBy: { firstName: 'Bob', lastName: 'Martin' },
        },
        {
          id: 'i3',
          title: 'Unresolved DDoS',
          severity: 'MEDIUM',
          status: 'DETECTED',
          incidentType: 'DDOS',
          detectedAt: new Date('2026-02-10T00:00:00.000Z'),
          reportedAt: null,
          resolvedAt: null,
          reportedToAuthority: true,
          authorityReference: 'REF-002',
          estimatedUsers: 50,
          createdBy: { firstName: 'Carol', lastName: 'Smith' },
        },
      ];

      mockIncident.findMany.mockResolvedValue(incidents as never);
      mockIncident.groupBy
        .mockResolvedValueOnce([
          { severity: 'HIGH', _count: { id: 1 } },
          { severity: 'CRITICAL', _count: { id: 1 } },
          { severity: 'MEDIUM', _count: { id: 1 } },
        ] as never)
        .mockResolvedValueOnce([
          { status: 'RESOLVED', _count: { id: 1 } },
          { status: 'INVESTIGATING', _count: { id: 1 } },
          { status: 'DETECTED', _count: { id: 1 } },
        ] as never);
      mockReport.create.mockResolvedValue(createdReport('INCIDENT') as never);

      const result = await service.generateIncidentReport(ORG_ID, PERIOD, USER_ID);

      expect(mockIncident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            detectedAt: { gte: PERIOD.start, lte: PERIOD.end },
          }),
        }),
      );

      const arg = mockReport.create.mock.calls[0][0] as unknown as {
        data: {
          type: string;
          title: string;
          data: {
            reportType: string;
            summary: {
              totalIncidents: number;
              reportedToAuthority: number;
              avgResolutionHours: number;
              bySeverity: Array<{ severity: string; count: number }>;
              byStatus: Array<{ status: string; count: number }>;
            };
            incidents: unknown[];
          };
        };
      };

      expect(arg.data.type).toBe('INCIDENT');
      expect(arg.data.title).toBe(`Incident Report - ${TODAY}`);
      expect(arg.data.data.reportType).toBe('INCIDENT');
      expect(arg.data.data.summary.totalIncidents).toBe(3);
      // i1 + i3 reported to authority.
      expect(arg.data.data.summary.reportedToAuthority).toBe(2);
      // (10h + 30h) / 2 resolved incidents = 20h.
      expect(arg.data.data.summary.avgResolutionHours).toBe(20);
      expect(arg.data.data.summary.bySeverity).toEqual([
        { severity: 'HIGH', count: 1 },
        { severity: 'CRITICAL', count: 1 },
        { severity: 'MEDIUM', count: 1 },
      ]);
      expect(arg.data.data.summary.byStatus).toEqual([
        { status: 'RESOLVED', count: 1 },
        { status: 'INVESTIGATING', count: 1 },
        { status: 'DETECTED', count: 1 },
      ]);
      expect(arg.data.data.incidents).toHaveLength(3);

      expect(result).toEqual(createdReport('INCIDENT'));
    });

    it('should avoid division by zero when no incidents are resolved', async () => {
      mockIncident.findMany.mockResolvedValue([
        {
          id: 'i1',
          title: 'Open incident',
          severity: 'LOW',
          status: 'DETECTED',
          incidentType: 'OTHER',
          detectedAt: new Date('2026-02-01T00:00:00.000Z'),
          reportedAt: null,
          resolvedAt: null,
          reportedToAuthority: false,
          authorityReference: null,
          estimatedUsers: null,
          createdBy: { firstName: 'Alice', lastName: 'Dupont' },
        },
      ] as never);
      mockIncident.groupBy.mockResolvedValue([] as never);
      mockReport.create.mockResolvedValue(createdReport('INCIDENT') as never);

      await service.generateIncidentReport(ORG_ID, {}, USER_ID);

      const arg = mockReport.create.mock.calls[0][0] as unknown as {
        data: { data: { summary: { avgResolutionHours: number; reportedToAuthority: number } } };
      };
      expect(arg.data.data.summary.avgResolutionHours).toBe(0);
      expect(arg.data.data.summary.reportedToAuthority).toBe(0);
    });
  });

  // ─── generateRiskReport() ────────────────────────────────────────────────────

  describe('generateRiskReport()', () => {
    it('should classify critical/high risks, average scores and persist a RISK report', async () => {
      const risks = [
        {
          id: 'r1',
          title: 'Ransomware',
          category: 'NETWORK',
          likelihood: 4,
          impact: 5,
          riskScore: 20, // critical (>= 17)
          status: 'IDENTIFIED',
          mitigationPlan: 'EDR rollout',
          owner: { firstName: 'Bob', lastName: 'Martin' },
        },
        {
          id: 'r2',
          title: 'Supplier breach',
          category: 'SUPPLY_CHAIN',
          likelihood: 3,
          impact: 4,
          riskScore: 12, // high (10..16)
          status: 'MITIGATING',
          mitigationPlan: 'Vendor review',
          owner: { firstName: 'Carol', lastName: 'Smith' },
        },
        {
          id: 'r3',
          title: 'Minor data risk',
          category: 'DATA',
          likelihood: 1,
          impact: 4,
          riskScore: 4, // neither
          status: 'ACCEPTED',
          mitigationPlan: null,
          owner: { firstName: 'Dan', lastName: 'Lee' },
        },
      ];

      mockRisk.findMany.mockResolvedValue(risks as never);
      mockRisk.groupBy
        .mockResolvedValueOnce([
          { category: 'NETWORK', _count: { id: 1 }, _avg: { riskScore: 20 } },
          { category: 'SUPPLY_CHAIN', _count: { id: 1 }, _avg: { riskScore: 12 } },
          { category: 'DATA', _count: { id: 1 }, _avg: { riskScore: 4 } },
        ] as never)
        .mockResolvedValueOnce([
          { status: 'IDENTIFIED', _count: { id: 1 } },
          { status: 'MITIGATING', _count: { id: 1 } },
          { status: 'ACCEPTED', _count: { id: 1 } },
        ] as never);
      mockReport.create.mockResolvedValue(createdReport('RISK') as never);

      const result = await service.generateRiskReport(ORG_ID, PERIOD, USER_ID);

      const arg = mockReport.create.mock.calls[0][0] as unknown as {
        data: {
          type: string;
          title: string;
          data: {
            reportType: string;
            summary: {
              totalRisks: number;
              criticalCount: number;
              highCount: number;
              avgRiskScore: number;
              byCategory: Array<{ category: string; count: number; avgScore: number }>;
              byStatus: Array<{ status: string; count: number }>;
            };
            topRisks: unknown[];
          };
        };
      };

      expect(arg.data.type).toBe('RISK');
      expect(arg.data.title).toBe(`Risk Report - ${TODAY}`);
      expect(arg.data.data.reportType).toBe('RISK');
      expect(arg.data.data.summary.totalRisks).toBe(3);
      expect(arg.data.data.summary.criticalCount).toBe(1);
      expect(arg.data.data.summary.highCount).toBe(1);
      // (20 + 12 + 4) / 3 = 12.
      expect(arg.data.data.summary.avgRiskScore).toBe(12);
      expect(arg.data.data.summary.byCategory).toEqual([
        { category: 'NETWORK', count: 1, avgScore: 20 },
        { category: 'SUPPLY_CHAIN', count: 1, avgScore: 12 },
        { category: 'DATA', count: 1, avgScore: 4 },
      ]);
      expect(arg.data.data.summary.byStatus).toEqual([
        { status: 'IDENTIFIED', count: 1 },
        { status: 'MITIGATING', count: 1 },
        { status: 'ACCEPTED', count: 1 },
      ]);
      expect(arg.data.data.topRisks).toHaveLength(3);

      expect(result).toEqual(createdReport('RISK'));
    });

    it('should default the average score to 0 and handle null _avg when there are no risks', async () => {
      mockRisk.findMany.mockResolvedValue([] as never);
      mockRisk.groupBy
        .mockResolvedValueOnce([
          { category: 'NETWORK', _count: { id: 0 }, _avg: { riskScore: null } },
        ] as never)
        .mockResolvedValueOnce([] as never);
      mockReport.create.mockResolvedValue(createdReport('RISK') as never);

      await service.generateRiskReport(ORG_ID, {}, USER_ID);

      const arg = mockReport.create.mock.calls[0][0] as unknown as {
        data: {
          data: {
            summary: {
              avgRiskScore: number;
              criticalCount: number;
              byCategory: Array<{ avgScore: number }>;
            };
          };
        };
      };
      expect(arg.data.data.summary.avgRiskScore).toBe(0);
      expect(arg.data.data.summary.criticalCount).toBe(0);
      // null _avg coalesces to 0.
      expect(arg.data.data.summary.byCategory[0].avgScore).toBe(0);
    });
  });

  // ─── generateAuditReport() ───────────────────────────────────────────────────

  describe('generateAuditReport()', () => {
    it('should aggregate audits by type/status, findings by severity and persist an AUDIT report', async () => {
      const audits = [
        {
          id: 'a1',
          title: 'Annual internal audit',
          type: 'INTERNAL',
          status: 'COMPLETED',
          startDate: new Date('2026-02-01T00:00:00.000Z'),
          endDate: new Date('2026-02-15T00:00:00.000Z'),
          summary: 'All controls reviewed',
          auditor: { firstName: 'Alice', lastName: 'Dupont' },
          _count: { findings: 3 },
        },
        {
          id: 'a2',
          title: 'Supplier audit',
          type: 'SUPPLIER',
          status: 'IN_PROGRESS',
          startDate: new Date('2026-03-01T00:00:00.000Z'),
          endDate: null,
          summary: null,
          auditor: { firstName: 'Bob', lastName: 'Martin' },
          _count: { findings: 0 },
        },
      ];

      mockAudit.findMany.mockResolvedValue(audits as never);
      mockAudit.groupBy
        .mockResolvedValueOnce([
          { type: 'INTERNAL', _count: { id: 1 } },
          { type: 'SUPPLIER', _count: { id: 1 } },
        ] as never)
        .mockResolvedValueOnce([
          { status: 'COMPLETED', _count: { id: 1 } },
          { status: 'IN_PROGRESS', _count: { id: 1 } },
        ] as never);
      mockAuditFinding.groupBy.mockResolvedValue([
        { severity: 'MAJOR', _count: { id: 2 } },
        { severity: 'CRITICAL', _count: { id: 1 } },
      ] as never);
      mockReport.create.mockResolvedValue(createdReport('AUDIT') as never);

      const result = await service.generateAuditReport(ORG_ID, PERIOD, USER_ID);

      expect(mockAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            startDate: { gte: PERIOD.start, lte: PERIOD.end },
          }),
        }),
      );

      const arg = mockReport.create.mock.calls[0][0] as unknown as {
        data: {
          type: string;
          title: string;
          data: {
            reportType: string;
            summary: {
              totalAudits: number;
              byType: Array<{ type: string; count: number }>;
              byStatus: Array<{ status: string; count: number }>;
              findingsBySeverity: Array<{ severity: string; count: number }>;
            };
            audits: Array<{ findingsCount: number }>;
          };
        };
      };

      expect(arg.data.type).toBe('AUDIT');
      expect(arg.data.title).toBe(`Audit Report - ${TODAY}`);
      expect(arg.data.data.reportType).toBe('AUDIT');
      expect(arg.data.data.summary.totalAudits).toBe(2);
      expect(arg.data.data.summary.byType).toEqual([
        { type: 'INTERNAL', count: 1 },
        { type: 'SUPPLIER', count: 1 },
      ]);
      expect(arg.data.data.summary.byStatus).toEqual([
        { status: 'COMPLETED', count: 1 },
        { status: 'IN_PROGRESS', count: 1 },
      ]);
      expect(arg.data.data.summary.findingsBySeverity).toEqual([
        { severity: 'MAJOR', count: 2 },
        { severity: 'CRITICAL', count: 1 },
      ]);
      // _count.findings flattened to findingsCount.
      expect(arg.data.data.audits[0].findingsCount).toBe(3);
      expect(arg.data.data.audits[1].findingsCount).toBe(0);

      expect(result).toEqual(createdReport('AUDIT'));
    });
  });

  // ─── generateExecutiveReport() ───────────────────────────────────────────────

  describe('generateExecutiveReport()', () => {
    const organization = {
      id: ORG_ID,
      name: 'Acme Corp',
      sector: 'ENERGY',
      entityType: 'ESSENTIAL',
      country: 'FR',
    };

    it('should consolidate compliance/incident/risk/audit metrics and persist an EXECUTIVE report', async () => {
      mockOrganization.findUnique.mockResolvedValue(organization as never);

      mockComplianceAssessment.groupBy.mockResolvedValue([
        { status: 'COMPLIANT', _count: { id: 6 } },
        { status: 'NON_COMPLIANT', _count: { id: 2 } },
        { status: 'PARTIAL', _count: { id: 2 } },
      ] as never);
      mockIncident.groupBy.mockResolvedValue([
        { severity: 'CRITICAL', _count: { id: 2 } },
        { severity: 'HIGH', _count: { id: 3 } },
        { severity: 'LOW', _count: { id: 5 } },
      ] as never);
      mockRisk.groupBy.mockResolvedValue([
        { status: 'IDENTIFIED', _count: { id: 4 } },
        { status: 'MITIGATING', _count: { id: 2 } },
        { status: 'MITIGATED', _count: { id: 1 } },
        { status: 'ACCEPTED', _count: { id: 1 } },
        { status: 'CLOSED', _count: { id: 1 } },
      ] as never);
      mockAudit.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: { id: 2 } },
        { status: 'PLANNED', _count: { id: 1 } },
      ] as never);
      mockReport.create.mockResolvedValue(createdReport('EXECUTIVE') as never);

      const result = await service.generateExecutiveReport(ORG_ID, PERIOD, USER_ID);

      expect(mockOrganization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ORG_ID } }),
      );

      const arg = mockReport.create.mock.calls[0][0] as unknown as {
        data: {
          type: string;
          title: string;
          data: {
            reportType: string;
            executiveSummary: {
              complianceScore: number;
              totalIncidents: number;
              criticalIncidents: number;
              totalRisks: number;
              openRisks: number;
              totalAudits: number;
            };
            compliance: { score: number; totalAssessments: number; compliantCount: number };
            incidents: { total: number; critical: number };
            risks: { total: number; open: number };
          };
        };
      };

      expect(arg.data.type).toBe('EXECUTIVE');
      expect(arg.data.title).toBe(`Executive Report - ${TODAY}`);
      expect(arg.data.data.reportType).toBe('EXECUTIVE');

      // Compliance: 6 compliant / 10 total = 60%.
      expect(arg.data.data.executiveSummary.complianceScore).toBe(60);
      expect(arg.data.data.compliance.totalAssessments).toBe(10);
      expect(arg.data.data.compliance.compliantCount).toBe(6);
      expect(arg.data.data.compliance.score).toBe(60);

      // Incidents: 2 + 3 + 5 = 10 total, 2 critical.
      expect(arg.data.data.executiveSummary.totalIncidents).toBe(10);
      expect(arg.data.data.executiveSummary.criticalIncidents).toBe(2);
      expect(arg.data.data.incidents.total).toBe(10);
      expect(arg.data.data.incidents.critical).toBe(2);

      // Risks: 9 total; open = all except MITIGATED/ACCEPTED/CLOSED = 4 + 2 = 6.
      expect(arg.data.data.executiveSummary.totalRisks).toBe(9);
      expect(arg.data.data.executiveSummary.openRisks).toBe(6);
      expect(arg.data.data.risks.total).toBe(9);
      expect(arg.data.data.risks.open).toBe(6);

      // Audits: 2 + 1 = 3.
      expect(arg.data.data.executiveSummary.totalAudits).toBe(3);

      expect(result).toEqual(createdReport('EXECUTIVE'));
    });

    it('should default scores to 0 when there is no data', async () => {
      mockOrganization.findUnique.mockResolvedValue(organization as never);
      mockComplianceAssessment.groupBy.mockResolvedValue([] as never);
      mockIncident.groupBy.mockResolvedValue([] as never);
      mockRisk.groupBy.mockResolvedValue([] as never);
      mockAudit.groupBy.mockResolvedValue([] as never);
      mockReport.create.mockResolvedValue(createdReport('EXECUTIVE') as never);

      await service.generateExecutiveReport(ORG_ID, {}, USER_ID);

      const arg = mockReport.create.mock.calls[0][0] as unknown as {
        data: {
          data: {
            executiveSummary: {
              complianceScore: number;
              totalIncidents: number;
              criticalIncidents: number;
              openRisks: number;
            };
          };
        };
      };
      expect(arg.data.data.executiveSummary.complianceScore).toBe(0);
      expect(arg.data.data.executiveSummary.totalIncidents).toBe(0);
      expect(arg.data.data.executiveSummary.criticalIncidents).toBe(0);
      expect(arg.data.data.executiveSummary.openRisks).toBe(0);
    });

    it('should throw 404 when the organization does not exist', async () => {
      mockOrganization.findUnique.mockResolvedValue(null);

      await expect(
        service.generateExecutiveReport('missing-org', PERIOD, USER_ID),
      ).rejects.toMatchObject({
        message: 'Organization not found',
        statusCode: 404,
      });

      // No aggregation or persistence should happen.
      expect(mockComplianceAssessment.groupBy).not.toHaveBeenCalled();
      expect(mockReport.create).not.toHaveBeenCalled();
    });
  });

  // ─── findById() ──────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('should return the report with relations when found', async () => {
      const reportWithRelations = {
        ...createdReport('COMPLIANCE'),
        generatedBy: {
          id: USER_ID,
          firstName: 'Alice',
          lastName: 'Dupont',
          email: 'alice@example.com',
        },
        organization: { id: ORG_ID, name: 'Acme Corp' },
      };
      mockReport.findUnique.mockResolvedValue(reportWithRelations as never);

      const result = await service.findById(REPORT_ID);

      expect(mockReport.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: REPORT_ID },
          include: expect.objectContaining({
            generatedBy: expect.any(Object),
            organization: expect.any(Object),
          }),
        }),
      );
      expect(result).toEqual(reportWithRelations);
    });

    it('should throw 404 when the report does not exist', async () => {
      mockReport.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing-id')).rejects.toMatchObject({
        message: 'Report not found',
        statusCode: 404,
      });
    });
  });

  // ─── findAll() ───────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return paginated reports scoped to the organization', async () => {
      mockReport.findMany.mockResolvedValue([createdReport('COMPLIANCE')] as never);
      mockReport.count.mockResolvedValue(1 as never);

      const result = await service.findAll(ORG_ID, {});

      expect(mockReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID },
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(mockReport.count).toHaveBeenCalledWith({ where: { organizationId: ORG_ID } });
      expect(result).toEqual({
        reports: [createdReport('COMPLIANCE')],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should apply the type filter and custom pagination', async () => {
      mockReport.findMany.mockResolvedValue([] as never);
      mockReport.count.mockResolvedValue(0 as never);

      const result = await service.findAll(ORG_ID, { type: 'EXECUTIVE', page: '2', limit: '5' });

      expect(mockReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID, type: 'EXECUTIVE' },
          skip: 5,
          take: 5,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('should cap the limit at 100', async () => {
      mockReport.findMany.mockResolvedValue([] as never);
      mockReport.count.mockResolvedValue(0 as never);

      const result = await service.findAll(ORG_ID, { limit: '500' });

      expect(mockReport.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
      expect(result.limit).toBe(100);
    });
  });
});
