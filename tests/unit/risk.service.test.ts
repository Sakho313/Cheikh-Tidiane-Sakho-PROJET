import { RiskService } from '../../src/modules/risks/risk.service';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    risk: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/config/database';

const mockPrismaRisk = prisma.risk as jest.Mocked<typeof prisma.risk>;

const ORG_ID = 'b2c3d4e5-f6a7-8901-bcde-f01234567891';
const RISK_ID = 'e1000000-0000-0000-0000-000000000001';
const OWNER_ID = 'f2000000-0000-0000-0000-000000000002';

const mockOwner = {
  id: OWNER_ID,
  firstName: 'Bob',
  lastName: 'Martin',
  email: 'bob@example.com',
};

const mockRiskRow = {
  id: RISK_ID,
  organizationId: ORG_ID,
  title: 'Ransomware attack on critical systems',
  description: 'Threat of ransomware targeting operational technology systems.',
  category: 'NETWORK' as const,
  likelihood: 4,
  impact: 5,
  riskScore: 20,
  status: 'IDENTIFIED' as const,
  mitigationPlan: 'Deploy EDR and isolate OT network.',
  ownerId: OWNER_ID,
  owner: mockOwner,
  reviewDate: new Date('2024-12-31'),
  closedAt: null,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-06-01T08:00:00Z'),
};

describe('RiskService', () => {
  let service: RiskService;

  beforeEach(() => {
    service = new RiskService();
    jest.clearAllMocks();
  });

  // ─── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    const createInput = {
      organizationId: ORG_ID,
      title: 'Ransomware attack on critical systems',
      description: 'Threat of ransomware targeting operational technology systems.',
      category: 'NETWORK' as const,
      likelihood: 4,
      impact: 5,
      status: 'IDENTIFIED' as const,
      mitigationPlan: 'Deploy EDR and isolate OT network.',
      ownerId: OWNER_ID,
      reviewDate: new Date('2024-12-31'),
    };

    it('should compute riskScore = likelihood * impact before inserting', async () => {
      mockPrismaRisk.create.mockResolvedValue(mockRiskRow as never);

      const result = await service.create(createInput);

      expect(mockPrismaRisk.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            likelihood: 4,
            impact: 5,
            riskScore: 20, // 4 * 5 = 20
          }),
        }),
      );
      expect(result.riskScore).toBe(20);
    });

    it('should correctly compute riskScore for LOW risk (likelihood=1, impact=2)', async () => {
      const lowRiskInput = { ...createInput, likelihood: 1, impact: 2 };
      const lowRiskRow = { ...mockRiskRow, likelihood: 1, impact: 2, riskScore: 2 };
      mockPrismaRisk.create.mockResolvedValue(lowRiskRow as never);

      await service.create(lowRiskInput);

      expect(mockPrismaRisk.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ riskScore: 2 }), // 1 * 2 = 2
        }),
      );
    });

    it('should correctly compute riskScore for CRITICAL risk (likelihood=5, impact=5)', async () => {
      const criticalInput = { ...createInput, likelihood: 5, impact: 5 };
      const criticalRow = { ...mockRiskRow, likelihood: 5, impact: 5, riskScore: 25 };
      mockPrismaRisk.create.mockResolvedValue(criticalRow as never);

      await service.create(criticalInput);

      expect(mockPrismaRisk.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ riskScore: 25 }), // 5 * 5 = 25
        }),
      );
    });
  });

  // ─── update() ──────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should recompute riskScore when likelihood and impact are updated', async () => {
      mockPrismaRisk.findUnique.mockResolvedValue(mockRiskRow as never);
      const updatedRow = { ...mockRiskRow, likelihood: 3, impact: 3, riskScore: 9 };
      mockPrismaRisk.update.mockResolvedValue(updatedRow as never);

      const result = await service.update(RISK_ID, { likelihood: 3, impact: 3 });

      expect(mockPrismaRisk.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            riskScore: 9, // 3 * 3 = 9
          }),
        }),
      );
      expect(result.riskScore).toBe(9);
    });

    it('should recompute riskScore using existing values when only one dimension is provided', async () => {
      // existing: likelihood=4, impact=5 → updating only impact to 2 → 4 * 2 = 8
      mockPrismaRisk.findUnique.mockResolvedValue(mockRiskRow as never);
      const updatedRow = { ...mockRiskRow, impact: 2, riskScore: 8 };
      mockPrismaRisk.update.mockResolvedValue(updatedRow as never);

      await service.update(RISK_ID, { impact: 2 });

      expect(mockPrismaRisk.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            riskScore: 8, // existing likelihood=4 * new impact=2 = 8
          }),
        }),
      );
    });

    it('should set closedAt automatically when transitioning to CLOSED', async () => {
      mockPrismaRisk.findUnique.mockResolvedValue({
        ...mockRiskRow,
        status: 'IDENTIFIED',
        closedAt: null,
      } as never);
      const closedRow = {
        ...mockRiskRow,
        status: 'CLOSED',
        closedAt: new Date(),
      };
      mockPrismaRisk.update.mockResolvedValue(closedRow as never);

      await service.update(RISK_ID, { status: 'CLOSED' as const });

      expect(mockPrismaRisk.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CLOSED',
            closedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should NOT overwrite closedAt when risk is already CLOSED', async () => {
      const alreadyClosedAt = new Date('2024-05-01T00:00:00Z');
      mockPrismaRisk.findUnique.mockResolvedValue({
        ...mockRiskRow,
        status: 'CLOSED',
        closedAt: alreadyClosedAt,
      } as never);
      mockPrismaRisk.update.mockResolvedValue({
        ...mockRiskRow,
        status: 'CLOSED',
        closedAt: alreadyClosedAt,
        mitigationPlan: 'Updated plan',
      } as never);

      await service.update(RISK_ID, {
        status: 'CLOSED' as const,
        mitigationPlan: 'Updated plan',
      });

      const updateCall = mockPrismaRisk.update.mock.calls[0]?.[0];
      expect(updateCall?.data.closedAt).toEqual(alreadyClosedAt);
    });

    it('should throw 404 if risk does not exist', async () => {
      mockPrismaRisk.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', { title: 'x' })).rejects.toMatchObject({
        message: 'Risk not found',
        statusCode: 404,
      });

      expect(mockPrismaRisk.update).not.toHaveBeenCalled();
    });
  });

  // ─── getRiskMatrix() ───────────────────────────────────────────────────────

  describe('getRiskMatrix()', () => {
    it('should return a 5x5 matrix with correct dimensions', async () => {
      mockPrismaRisk.findMany.mockResolvedValue([]);

      const result = await service.getRiskMatrix(ORG_ID);

      expect(result.matrix).toHaveLength(5);
      result.matrix.forEach((row) => {
        expect(row).toHaveLength(5);
      });
    });

    it('should assign correct risk level to each cell', async () => {
      mockPrismaRisk.findMany.mockResolvedValue([]);

      const result = await service.getRiskMatrix(ORG_ID);

      // likelihood=1, impact=1 → score=1 → LOW
      expect(result.matrix[0]![0]!.level).toBe('LOW');
      expect(result.matrix[0]![0]!.riskScore).toBe(1);

      // likelihood=2, impact=2 → score=4 → LOW (≤4)
      expect(result.matrix[1]![1]!.level).toBe('LOW');
      expect(result.matrix[1]![1]!.riskScore).toBe(4);

      // likelihood=2, impact=3 → score=6 → MEDIUM (≤9)
      expect(result.matrix[1]![2]!.level).toBe('MEDIUM');
      expect(result.matrix[1]![2]!.riskScore).toBe(6);

      // likelihood=3, impact=3 → score=9 → MEDIUM (≤9)
      expect(result.matrix[2]![2]!.level).toBe('MEDIUM');
      expect(result.matrix[2]![2]!.riskScore).toBe(9);

      // likelihood=3, impact=4 → score=12 → HIGH (≤16)
      expect(result.matrix[2]![3]!.level).toBe('HIGH');
      expect(result.matrix[2]![3]!.riskScore).toBe(12);

      // likelihood=4, impact=4 → score=16 → HIGH (≤16)
      expect(result.matrix[3]![3]!.level).toBe('HIGH');
      expect(result.matrix[3]![3]!.riskScore).toBe(16);

      // likelihood=4, impact=5 → score=20 → CRITICAL (>16)
      expect(result.matrix[3]![4]!.level).toBe('CRITICAL');
      expect(result.matrix[3]![4]!.riskScore).toBe(20);

      // likelihood=5, impact=5 → score=25 → CRITICAL (>16)
      expect(result.matrix[4]![4]!.level).toBe('CRITICAL');
      expect(result.matrix[4]![4]!.riskScore).toBe(25);
    });

    it('should place risks in the correct cell and count them', async () => {
      const risksInMatrix = [
        {
          id: RISK_ID,
          title: 'Critical ransomware risk',
          likelihood: 4,
          impact: 5,
          riskScore: 20,
          status: 'IDENTIFIED' as const,
          category: 'NETWORK' as const,
        },
      ];
      mockPrismaRisk.findMany.mockResolvedValue(risksInMatrix as never);

      const result = await service.getRiskMatrix(ORG_ID);

      // likelihood=4 → index 3, impact=5 → index 4
      const cell = result.matrix[3]![4]!;
      expect(cell.count).toBe(1);
      expect(cell.risks).toHaveLength(1);
      expect(cell.risks[0]!.id).toBe(RISK_ID);
      expect(cell.risks[0]!.title).toBe('Critical ransomware risk');
    });

    it('should return summary counts with correct LOW/MEDIUM/HIGH/CRITICAL breakdown', async () => {
      const mixedRisks = [
        // LOW: score ≤ 4
        {
          id: 'r1',
          title: 'Low risk',
          likelihood: 1,
          impact: 1,
          riskScore: 1,
          status: 'IDENTIFIED' as const,
          category: 'OPERATIONAL' as const,
        },
        // MEDIUM: 5 ≤ score ≤ 9
        {
          id: 'r2',
          title: 'Medium risk',
          likelihood: 2,
          impact: 3,
          riskScore: 6,
          status: 'IDENTIFIED' as const,
          category: 'LEGAL' as const,
        },
        // HIGH: 10 ≤ score ≤ 16
        {
          id: 'r3',
          title: 'High risk',
          likelihood: 3,
          impact: 4,
          riskScore: 12,
          status: 'IDENTIFIED' as const,
          category: 'NETWORK' as const,
        },
        // CRITICAL: score > 16
        {
          id: 'r4',
          title: 'Critical risk',
          likelihood: 5,
          impact: 5,
          riskScore: 25,
          status: 'IDENTIFIED' as const,
          category: 'NETWORK' as const,
        },
      ];
      mockPrismaRisk.findMany.mockResolvedValue(mixedRisks as never);

      const result = await service.getRiskMatrix(ORG_ID);

      expect(result.summary.total).toBe(4);
      expect(result.summary.low).toBe(1);
      expect(result.summary.medium).toBe(1);
      expect(result.summary.high).toBe(1);
      expect(result.summary.critical).toBe(1);
    });

    it('should return empty matrix counts and zero summary for org with no risks', async () => {
      mockPrismaRisk.findMany.mockResolvedValue([]);

      const result = await service.getRiskMatrix(ORG_ID);

      expect(result.summary.total).toBe(0);
      expect(result.summary.critical).toBe(0);
      expect(result.summary.high).toBe(0);
      expect(result.summary.medium).toBe(0);
      expect(result.summary.low).toBe(0);

      // All cells should have count = 0
      result.matrix.forEach((row) => {
        row.forEach((cell) => {
          expect(cell.count).toBe(0);
          expect(cell.risks).toHaveLength(0);
        });
      });
    });
  });

  // ─── findById() ────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('should return the risk with organization and owner when found', async () => {
      const fullRisk = {
        ...mockRiskRow,
        organization: { id: ORG_ID, name: 'Acme Corp' },
      };
      mockPrismaRisk.findUnique.mockResolvedValue(fullRisk as never);

      const result = await service.findById(RISK_ID);

      expect(mockPrismaRisk.findUnique).toHaveBeenCalledWith({
        where: { id: RISK_ID },
        include: {
          organization: { select: { id: true, name: true } },
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
      expect(result.id).toBe(RISK_ID);
      expect(result.riskScore).toBe(20);
    });

    it('should throw 404 if risk is not found', async () => {
      mockPrismaRisk.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toMatchObject({
        message: 'Risk not found',
        statusCode: 404,
      });
    });
  });

  // ─── delete() ──────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should delete the risk when it exists', async () => {
      mockPrismaRisk.findUnique.mockResolvedValue(mockRiskRow as never);
      mockPrismaRisk.delete.mockResolvedValue(mockRiskRow as never);

      await service.delete(RISK_ID);

      expect(mockPrismaRisk.delete).toHaveBeenCalledWith({ where: { id: RISK_ID } });
    });

    it('should throw 404 if risk does not exist', async () => {
      mockPrismaRisk.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent-id')).rejects.toMatchObject({
        message: 'Risk not found',
        statusCode: 404,
      });

      expect(mockPrismaRisk.delete).not.toHaveBeenCalled();
    });
  });

  // ─── findAll() ─────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return paginated risks for an org with default pagination', async () => {
      mockPrismaRisk.findMany.mockResolvedValue([mockRiskRow] as never);
      mockPrismaRisk.count.mockResolvedValue(1 as never);

      const result = await service.findAll(ORG_ID, {});

      expect(mockPrismaRisk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: ORG_ID }, skip: 0, take: 20 }),
      );
      expect(result.risks).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply a category filter', async () => {
      mockPrismaRisk.findMany.mockResolvedValue([] as never);
      mockPrismaRisk.count.mockResolvedValue(0 as never);

      await service.findAll(ORG_ID, {}, { category: 'NETWORK' as const });

      expect(mockPrismaRisk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'NETWORK' }),
        }),
      );
    });

    it('should apply a status filter', async () => {
      mockPrismaRisk.findMany.mockResolvedValue([] as never);
      mockPrismaRisk.count.mockResolvedValue(0 as never);

      await service.findAll(ORG_ID, {}, { status: 'MITIGATED' as const });

      expect(mockPrismaRisk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'MITIGATED' }),
        }),
      );
    });

    it('should apply a full-text search across title and description', async () => {
      mockPrismaRisk.findMany.mockResolvedValue([] as never);
      mockPrismaRisk.count.mockResolvedValue(0 as never);

      await service.findAll(ORG_ID, { search: 'ransomware' });

      expect(mockPrismaRisk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'ransomware', mode: 'insensitive' } },
              { description: { contains: 'ransomware', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should respect custom page and limit', async () => {
      mockPrismaRisk.findMany.mockResolvedValue([] as never);
      mockPrismaRisk.count.mockResolvedValue(50 as never);

      const result = await service.findAll(ORG_ID, { page: '3', limit: '5' });

      expect(mockPrismaRisk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(50);
    });
  });

  // ─── getStats() ────────────────────────────────────────────────────────────

  describe('getStats()', () => {
    it('should return aggregated stats for an organisation', async () => {
      const byCategoryResult = [
        { category: 'NETWORK', _count: { id: 3 }, _avg: { riskScore: 18.3 } },
        { category: 'SUPPLY_CHAIN', _count: { id: 2 }, _avg: { riskScore: 10.0 } },
      ];
      const byStatusResult = [
        { status: 'IDENTIFIED', _count: { id: 2 } },
        { status: 'MITIGATED', _count: { id: 3 } },
      ];
      const topRisksResult = [mockRiskRow].map(
        ({ id, title, riskScore, likelihood, impact, category, status }) => ({
          id,
          title,
          riskScore,
          likelihood,
          impact,
          category,
          status,
        }),
      );

      mockPrismaRisk.groupBy
        .mockResolvedValueOnce(byCategoryResult as never)
        .mockResolvedValueOnce(byStatusResult as never);
      mockPrismaRisk.findMany.mockResolvedValue(topRisksResult as never);

      const result = await service.getStats(ORG_ID);

      expect(result.total).toBe(5);
      expect(result.byCategory).toHaveLength(2);
      expect(result.byCategory[0]).toEqual({ category: 'NETWORK', count: 3, avgScore: 18 });
      expect(result.byStatus).toHaveLength(2);
      expect(result.topRisks).toHaveLength(1);
    });

    it('should return zero total and empty arrays for an org with no risks', async () => {
      mockPrismaRisk.groupBy.mockResolvedValue([] as never);
      mockPrismaRisk.findMany.mockResolvedValue([] as never);

      const result = await service.getStats(ORG_ID);

      expect(result.total).toBe(0);
      expect(result.byCategory).toHaveLength(0);
      expect(result.byStatus).toHaveLength(0);
      expect(result.topRisks).toHaveLength(0);
    });

    it('should round avgScore and handle null _avg.riskScore', async () => {
      const byCategoryWithNull = [
        { category: 'HUMAN', _count: { id: 1 }, _avg: { riskScore: null } },
      ];
      mockPrismaRisk.groupBy
        .mockResolvedValueOnce(byCategoryWithNull as never)
        .mockResolvedValueOnce([] as never);
      mockPrismaRisk.findMany.mockResolvedValue([] as never);

      const result = await service.getStats(ORG_ID);

      expect(result.byCategory[0].avgScore).toBe(0);
    });
  });
});
