import { AuditService } from '../../src/modules/audits/audit.service';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    audit: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    auditFinding: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/config/database';

const mockAudit = prisma.audit as jest.Mocked<typeof prisma.audit>;
const mockAuditFinding = prisma.auditFinding as jest.Mocked<typeof prisma.auditFinding>;

const ORG_ID = 'b2c3d4e5-f6a7-8901-bcde-f01234567891';
const AUDIT_ID = 'aa000000-0000-0000-0000-000000000001';
const FINDING_ID = 'ff000000-0000-0000-0000-000000000001';
const CONTROL_ID = 'cc000000-0000-0000-0000-000000000001';
const AUDITOR_ID = 'ab000000-0000-0000-0000-000000000001';

const mockAuditor = {
  id: AUDITOR_ID,
  firstName: 'Alice',
  lastName: 'Dupont',
  email: 'alice@example.com',
};

const mockAuditRow = {
  id: AUDIT_ID,
  organizationId: ORG_ID,
  title: 'Annual Internal Audit',
  type: 'INTERNAL' as const,
  status: 'PLANNED' as const,
  startDate: new Date('2024-03-01T00:00:00Z'),
  endDate: new Date('2024-03-15T00:00:00Z'),
  auditorId: AUDITOR_ID,
  scope: 'Network security controls',
  methodology: 'ISO 27001',
  summary: null,
  createdAt: new Date('2024-02-01T00:00:00Z'),
  updatedAt: new Date('2024-02-01T00:00:00Z'),
};

const mockFindingRow = {
  id: FINDING_ID,
  auditId: AUDIT_ID,
  title: 'Missing MFA on admin accounts',
  description: 'Several admin accounts do not enforce MFA.',
  severity: 'MAJOR' as const,
  status: 'OPEN' as const,
  controlId: CONTROL_ID,
  recommendation: 'Enforce MFA for all privileged accounts.',
  dueDate: new Date('2024-04-01T00:00:00Z'),
  closedAt: null,
  createdAt: new Date('2024-03-02T00:00:00Z'),
  updatedAt: new Date('2024-03-02T00:00:00Z'),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService();
    jest.clearAllMocks();
  });

  // ─── findAll() ───────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return paginated audits scoped to the organization', async () => {
      mockAudit.findMany.mockResolvedValue([mockAuditRow] as never);
      mockAudit.count.mockResolvedValue(1 as never);

      const result = await service.findAll(ORG_ID, {});

      expect(mockAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID },
          skip: 0,
          take: 20,
          orderBy: { startDate: 'desc' },
        }),
      );
      expect(mockAudit.count).toHaveBeenCalledWith({ where: { organizationId: ORG_ID } });
      expect(result).toEqual({
        audits: [mockAuditRow],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should apply type and status filters when provided', async () => {
      mockAudit.findMany.mockResolvedValue([] as never);
      mockAudit.count.mockResolvedValue(0 as never);

      await service.findAll(ORG_ID, {}, { type: 'EXTERNAL', status: 'IN_PROGRESS' });

      expect(mockAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            type: 'EXTERNAL',
            status: 'IN_PROGRESS',
          }),
        }),
      );
    });

    it('should add a case-insensitive OR search clause when a search term is given', async () => {
      mockAudit.findMany.mockResolvedValue([] as never);
      mockAudit.count.mockResolvedValue(0 as never);

      await service.findAll(ORG_ID, { search: 'network' });

      expect(mockAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'network', mode: 'insensitive' } },
              { scope: { contains: 'network', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should respect custom pagination from the query', async () => {
      mockAudit.findMany.mockResolvedValue([] as never);
      mockAudit.count.mockResolvedValue(50 as never);

      const result = await service.findAll(ORG_ID, { page: '3', limit: '10' });

      expect(mockAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(50);
    });
  });

  // ─── findById() ──────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('should return the audit with relations when found', async () => {
      const auditWithRelations = {
        ...mockAuditRow,
        organization: { id: ORG_ID, name: 'Acme Corp' },
        auditor: mockAuditor,
        findings: [mockFindingRow],
      };
      mockAudit.findUnique.mockResolvedValue(auditWithRelations as never);

      const result = await service.findById(AUDIT_ID);

      expect(mockAudit.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: AUDIT_ID },
          include: expect.objectContaining({
            findings: expect.objectContaining({ orderBy: { severity: 'desc' } }),
          }),
        }),
      );
      expect(result).toEqual(auditWithRelations);
    });

    it('should throw 404 when the audit does not exist', async () => {
      mockAudit.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing-id')).rejects.toMatchObject({
        message: 'Audit not found',
        statusCode: 404,
      });
    });
  });

  // ─── create() ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const createInput = {
      organizationId: ORG_ID,
      title: 'Annual Internal Audit',
      type: 'INTERNAL' as const,
      status: 'PLANNED' as const,
      startDate: new Date('2024-03-01T00:00:00Z'),
      endDate: new Date('2024-03-15T00:00:00Z'),
      auditorId: AUDITOR_ID,
      scope: 'Network security controls',
      methodology: 'ISO 27001',
      summary: undefined,
    };

    it('should create an audit with the mapped fields and auditor relation', async () => {
      mockAudit.create.mockResolvedValue({ ...mockAuditRow, auditor: mockAuditor } as never);

      const result = await service.create(createInput);

      expect(mockAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            title: 'Annual Internal Audit',
            type: 'INTERNAL',
            status: 'PLANNED',
            auditorId: AUDITOR_ID,
          }),
          include: expect.objectContaining({
            auditor: expect.any(Object),
          }),
        }),
      );
      expect(result.id).toBe(AUDIT_ID);
    });
  });

  // ─── update() ────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should update the audit when it exists, including status transition', async () => {
      mockAudit.findUnique.mockResolvedValue(mockAuditRow as never);
      mockAudit.update.mockResolvedValue({
        ...mockAuditRow,
        status: 'COMPLETED',
        auditor: mockAuditor,
      } as never);

      const result = await service.update(AUDIT_ID, { status: 'COMPLETED' });

      expect(mockAudit.findUnique).toHaveBeenCalledWith({ where: { id: AUDIT_ID } });
      expect(mockAudit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: AUDIT_ID },
          data: { status: 'COMPLETED' },
        }),
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw 404 and not update when the audit is missing', async () => {
      mockAudit.findUnique.mockResolvedValue(null);

      await expect(service.update('missing-id', { status: 'CANCELLED' })).rejects.toMatchObject({
        message: 'Audit not found',
        statusCode: 404,
      });
      expect(mockAudit.update).not.toHaveBeenCalled();
    });
  });

  // ─── delete() ────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should delete the audit when it exists', async () => {
      mockAudit.findUnique.mockResolvedValue(mockAuditRow as never);
      mockAudit.delete.mockResolvedValue(mockAuditRow as never);

      await service.delete(AUDIT_ID);

      expect(mockAudit.delete).toHaveBeenCalledWith({ where: { id: AUDIT_ID } });
    });

    it('should throw 404 and not delete when the audit is missing', async () => {
      mockAudit.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing-id')).rejects.toMatchObject({
        message: 'Audit not found',
        statusCode: 404,
      });
      expect(mockAudit.delete).not.toHaveBeenCalled();
    });
  });

  // ─── addFinding() ────────────────────────────────────────────────────────────

  describe('addFinding()', () => {
    const findingInput = {
      title: 'Missing MFA on admin accounts',
      description: 'Several admin accounts do not enforce MFA.',
      severity: 'MAJOR' as const,
      status: 'OPEN' as const,
      controlId: CONTROL_ID,
      recommendation: 'Enforce MFA for all privileged accounts.',
      dueDate: new Date('2024-04-01T00:00:00Z'),
    };

    it('should create a finding linked to the audit when the audit exists', async () => {
      mockAudit.findUnique.mockResolvedValue(mockAuditRow as never);
      mockAuditFinding.create.mockResolvedValue(mockFindingRow as never);

      const result = await service.addFinding(AUDIT_ID, findingInput);

      expect(mockAudit.findUnique).toHaveBeenCalledWith({ where: { id: AUDIT_ID } });
      expect(mockAuditFinding.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            auditId: AUDIT_ID,
            title: findingInput.title,
            severity: 'MAJOR',
            status: 'OPEN',
            controlId: CONTROL_ID,
          }),
          include: expect.objectContaining({ control: expect.any(Object) }),
        }),
      );
      expect(result.id).toBe(FINDING_ID);
    });

    it('should throw 404 when the parent audit does not exist', async () => {
      mockAudit.findUnique.mockResolvedValue(null);

      await expect(service.addFinding('missing-id', findingInput)).rejects.toMatchObject({
        message: 'Audit not found',
        statusCode: 404,
      });
      expect(mockAuditFinding.create).not.toHaveBeenCalled();
    });
  });

  // ─── updateFinding() ───────────────────────────────────────────────────────────

  describe('updateFinding()', () => {
    it('should update a finding scoped to the audit', async () => {
      mockAuditFinding.findFirst.mockResolvedValue(mockFindingRow as never);
      mockAuditFinding.update.mockResolvedValue({
        ...mockFindingRow,
        status: 'IN_REMEDIATION',
      } as never);

      const result = await service.updateFinding(AUDIT_ID, FINDING_ID, {
        status: 'IN_REMEDIATION',
      });

      expect(mockAuditFinding.findFirst).toHaveBeenCalledWith({
        where: { id: FINDING_ID, auditId: AUDIT_ID },
      });
      expect(mockAuditFinding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: FINDING_ID },
          data: expect.objectContaining({ status: 'IN_REMEDIATION' }),
        }),
      );
      expect(result.status).toBe('IN_REMEDIATION');
    });

    it('should set closedAt when transitioning an open finding to CLOSED', async () => {
      mockAuditFinding.findFirst.mockResolvedValue(mockFindingRow as never);
      mockAuditFinding.update.mockResolvedValue({
        ...mockFindingRow,
        status: 'CLOSED',
        closedAt: new Date(),
      } as never);

      await service.updateFinding(AUDIT_ID, FINDING_ID, { status: 'CLOSED' });

      expect(mockAuditFinding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CLOSED',
            closedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should keep the existing closedAt when the finding is already CLOSED', async () => {
      const previouslyClosed = new Date('2024-03-20T00:00:00Z');
      mockAuditFinding.findFirst.mockResolvedValue({
        ...mockFindingRow,
        status: 'CLOSED',
        closedAt: previouslyClosed,
      } as never);
      mockAuditFinding.update.mockResolvedValue({
        ...mockFindingRow,
        status: 'CLOSED',
        closedAt: previouslyClosed,
      } as never);

      await service.updateFinding(AUDIT_ID, FINDING_ID, { status: 'CLOSED' });

      expect(mockAuditFinding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ closedAt: previouslyClosed }),
        }),
      );
    });

    it('should not set closedAt for a non-CLOSED status transition', async () => {
      mockAuditFinding.findFirst.mockResolvedValue(mockFindingRow as never);
      mockAuditFinding.update.mockResolvedValue({
        ...mockFindingRow,
        status: 'REMEDIATED',
      } as never);

      await service.updateFinding(AUDIT_ID, FINDING_ID, { status: 'REMEDIATED' });

      const updateArg = mockAuditFinding.update.mock.calls[0][0] as {
        data: { closedAt: unknown };
      };
      expect(updateArg.data.closedAt).toBeNull();
    });

    it('should throw 404 when the finding is not found for the audit', async () => {
      mockAuditFinding.findFirst.mockResolvedValue(null);

      await expect(
        service.updateFinding(AUDIT_ID, 'missing-finding', { status: 'ACCEPTED' }),
      ).rejects.toMatchObject({
        message: 'Finding not found',
        statusCode: 404,
      });
      expect(mockAuditFinding.update).not.toHaveBeenCalled();
    });
  });

  // ─── getFindings() ───────────────────────────────────────────────────────────

  describe('getFindings()', () => {
    it('should return findings ordered by severity then creation date', async () => {
      mockAudit.findUnique.mockResolvedValue(mockAuditRow as never);
      mockAuditFinding.findMany.mockResolvedValue([mockFindingRow] as never);

      const result = await service.getFindings(AUDIT_ID);

      expect(mockAudit.findUnique).toHaveBeenCalledWith({ where: { id: AUDIT_ID } });
      expect(mockAuditFinding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { auditId: AUDIT_ID },
          orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
        }),
      );
      expect(result).toEqual([mockFindingRow]);
    });

    it('should throw 404 when the audit does not exist', async () => {
      mockAudit.findUnique.mockResolvedValue(null);

      await expect(service.getFindings('missing-id')).rejects.toMatchObject({
        message: 'Audit not found',
        statusCode: 404,
      });
      expect(mockAuditFinding.findMany).not.toHaveBeenCalled();
    });
  });

  // ─── getStats() ──────────────────────────────────────────────────────────────

  describe('getStats()', () => {
    it('should aggregate totals, byType, byStatus, finding severities and recent audits', async () => {
      mockAudit.groupBy
        .mockResolvedValueOnce([
          { type: 'INTERNAL', _count: { id: 3 } },
          { type: 'EXTERNAL', _count: { id: 2 } },
        ] as never)
        .mockResolvedValueOnce([
          { status: 'PLANNED', _count: { id: 1 } },
          { status: 'COMPLETED', _count: { id: 4 } },
        ] as never);
      mockAudit.findMany.mockResolvedValue([
        {
          id: AUDIT_ID,
          title: 'Annual Internal Audit',
          type: 'INTERNAL',
          status: 'PLANNED',
          startDate: mockAuditRow.startDate,
        },
      ] as never);
      mockAuditFinding.groupBy.mockResolvedValue([
        { severity: 'MAJOR', _count: { id: 2 } },
        { severity: 'CRITICAL', _count: { id: 1 } },
      ] as never);

      const result = await service.getStats(ORG_ID);

      expect(result.total).toBe(5);
      expect(result.byType).toEqual([
        { type: 'INTERNAL', count: 3 },
        { type: 'EXTERNAL', count: 2 },
      ]);
      expect(result.byStatus).toEqual([
        { status: 'PLANNED', count: 1 },
        { status: 'COMPLETED', count: 4 },
      ]);
      expect(result.findings.bySeverity).toEqual([
        { severity: 'MAJOR', count: 2 },
        { severity: 'CRITICAL', count: 1 },
      ]);
      expect(result.recentAudits).toHaveLength(1);
      expect(mockAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, orderBy: { startDate: 'desc' } }),
      );
    });

    it('should report a total of 0 when there are no audits', async () => {
      mockAudit.groupBy.mockResolvedValue([] as never);
      mockAudit.findMany.mockResolvedValue([] as never);
      mockAuditFinding.groupBy.mockResolvedValue([] as never);

      const result = await service.getStats(ORG_ID);

      expect(result.total).toBe(0);
      expect(result.byType).toEqual([]);
      expect(result.byStatus).toEqual([]);
      expect(result.findings.bySeverity).toEqual([]);
      expect(result.recentAudits).toEqual([]);
    });
  });
});
