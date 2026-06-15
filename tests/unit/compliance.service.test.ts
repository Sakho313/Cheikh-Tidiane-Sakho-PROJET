import { ComplianceService } from '../../src/modules/compliance/compliance.service';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    complianceControl: {
      findMany: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
    },
    complianceAssessment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/config/database';

const mockComplianceControl = prisma.complianceControl as jest.Mocked<
  typeof prisma.complianceControl
>;
const mockComplianceAssessment = prisma.complianceAssessment as jest.Mocked<
  typeof prisma.complianceAssessment
>;

const ORG_ID = 'b2c3d4e5-f6a7-8901-bcde-f01234567891';
const CONTROL_ID_1 = 'c1000000-0000-0000-0000-000000000001';
const CONTROL_ID_2 = 'c2000000-0000-0000-0000-000000000002';

const mockControls = [
  {
    id: CONTROL_ID_1,
    article: 'Article 21(2)(a)',
    domain: 'Risk Management',
    requirement: 'Risk analysis and information system security policies',
    description: 'Organizations must establish and maintain policies on risk analysis.',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: CONTROL_ID_2,
    article: 'Article 21(2)(b)',
    domain: 'Incident Handling',
    requirement: 'Incident handling procedures',
    description: 'Organizations must implement incident handling procedures.',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
];

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(() => {
    service = new ComplianceService();
    jest.clearAllMocks();
  });

  // ─── getAllControls() ───────────────────────────────────────────────────────

  describe('getAllControls()', () => {
    it('should return the list of active controls ordered by domain then article', async () => {
      mockComplianceControl.findMany.mockResolvedValue(mockControls as never);

      const result = await service.getAllControls();

      expect(mockComplianceControl.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ domain: 'asc' }, { article: 'asc' }],
      });
      expect(result).toHaveLength(2);
      expect(result[0].article).toBe('Article 21(2)(a)');
      expect(result[1].domain).toBe('Incident Handling');
    });

    it('should return an empty array when no active controls exist', async () => {
      mockComplianceControl.findMany.mockResolvedValue([]);

      const result = await service.getAllControls();

      expect(result).toEqual([]);
    });
  });

  // ─── getComplianceScore() ──────────────────────────────────────────────────

  describe('getComplianceScore()', () => {
    it('should return 0% overall score when all assessments are NON_COMPLIANT', async () => {
      const nonCompliantAssessments = [
        {
          id: 'a1',
          organizationId: ORG_ID,
          controlId: CONTROL_ID_1,
          status: 'NON_COMPLIANT',
          control: { domain: 'Risk Management' },
        },
        {
          id: 'a2',
          organizationId: ORG_ID,
          controlId: CONTROL_ID_2,
          status: 'NON_COMPLIANT',
          control: { domain: 'Incident Handling' },
        },
      ];

      mockComplianceAssessment.findMany.mockResolvedValue(nonCompliantAssessments as never);
      mockComplianceControl.findMany.mockResolvedValue([
        { domain: 'Risk Management' },
        { domain: 'Incident Handling' },
      ] as never);

      const result = await service.getComplianceScore(ORG_ID);

      expect(result.overallScore).toBe(0);
      expect(result.compliantControls).toBe(0);
      expect(result.applicableControls).toBe(2);
      expect(result.totalControls).toBe(2);
    });

    it('should return 100% overall score when all assessments are COMPLIANT', async () => {
      const compliantAssessments = [
        {
          id: 'a1',
          organizationId: ORG_ID,
          controlId: CONTROL_ID_1,
          status: 'COMPLIANT',
          control: { domain: 'Risk Management' },
        },
        {
          id: 'a2',
          organizationId: ORG_ID,
          controlId: CONTROL_ID_2,
          status: 'COMPLIANT',
          control: { domain: 'Incident Handling' },
        },
      ];

      mockComplianceAssessment.findMany.mockResolvedValue(compliantAssessments as never);
      mockComplianceControl.findMany.mockResolvedValue([
        { domain: 'Risk Management' },
        { domain: 'Incident Handling' },
      ] as never);

      const result = await service.getComplianceScore(ORG_ID);

      expect(result.overallScore).toBe(100);
      expect(result.compliantControls).toBe(2);
      expect(result.applicableControls).toBe(2);
    });

    it('should exclude NOT_APPLICABLE assessments from the score calculation', async () => {
      const mixedAssessments = [
        {
          id: 'a1',
          organizationId: ORG_ID,
          controlId: CONTROL_ID_1,
          status: 'COMPLIANT',
          control: { domain: 'Risk Management' },
        },
        {
          id: 'a2',
          organizationId: ORG_ID,
          controlId: CONTROL_ID_2,
          status: 'NOT_APPLICABLE',
          control: { domain: 'Incident Handling' },
        },
      ];

      mockComplianceAssessment.findMany.mockResolvedValue(mixedAssessments as never);
      mockComplianceControl.findMany.mockResolvedValue([
        { domain: 'Risk Management' },
        { domain: 'Incident Handling' },
      ] as never);

      const result = await service.getComplianceScore(ORG_ID);

      // Only 1 applicable, 1 compliant → 100%
      expect(result.overallScore).toBe(100);
      expect(result.applicableControls).toBe(1);
      expect(result.compliantControls).toBe(1);
    });

    it('should return 0% when there are no assessments', async () => {
      mockComplianceAssessment.findMany.mockResolvedValue([]);
      mockComplianceControl.findMany.mockResolvedValue([{ domain: 'Risk Management' }] as never);

      const result = await service.getComplianceScore(ORG_ID);

      expect(result.overallScore).toBe(0);
      expect(result.totalControls).toBe(0);
    });
  });

  // ─── upsertAssessment() ────────────────────────────────────────────────────

  describe('upsertAssessment()', () => {
    const ASSESSMENT_ID = 'd1000000-0000-0000-0000-000000000001';

    const upsertInput = {
      organizationId: ORG_ID,
      controlId: CONTROL_ID_1,
      status: 'PARTIAL' as const,
      evidence: 'Risk register document uploaded',
      notes: 'Work in progress',
      assignedToId: undefined,
      dueDate: new Date('2024-12-31'),
    };

    const upsertedAssessment = {
      id: ASSESSMENT_ID,
      organizationId: ORG_ID,
      controlId: CONTROL_ID_1,
      status: 'PARTIAL',
      evidence: 'Risk register document uploaded',
      notes: 'Work in progress',
      assignedToId: null,
      dueDate: new Date('2024-12-31'),
      reviewedAt: null,
      createdAt: new Date('2024-06-01T00:00:00Z'),
      updatedAt: new Date('2024-06-01T00:00:00Z'),
      control: mockControls[0],
      assignedTo: null,
    };

    it('should create a new assessment when none exists', async () => {
      mockComplianceAssessment.findUnique.mockResolvedValue(null);
      mockComplianceAssessment.upsert.mockResolvedValue(upsertedAssessment as never);

      const result = await service.upsertAssessment(upsertInput);

      expect(mockComplianceAssessment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId_controlId: {
              organizationId: ORG_ID,
              controlId: CONTROL_ID_1,
            },
          },
          create: expect.objectContaining({
            organizationId: ORG_ID,
            controlId: CONTROL_ID_1,
            status: 'PARTIAL',
          }),
        }),
      );
      expect(result.id).toBe(ASSESSMENT_ID);
      expect(result.status).toBe('PARTIAL');
    });

    it('should update an existing assessment', async () => {
      const existingAssessment = {
        ...upsertedAssessment,
        status: 'NON_COMPLIANT',
        reviewedAt: null,
      };
      mockComplianceAssessment.findUnique.mockResolvedValue(existingAssessment as never);
      mockComplianceAssessment.upsert.mockResolvedValue({
        ...upsertedAssessment,
        status: 'PARTIAL',
      } as never);

      const result = await service.upsertAssessment(upsertInput);

      expect(mockComplianceAssessment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: 'PARTIAL',
          }),
        }),
      );
      expect(result.status).toBe('PARTIAL');
    });

    it('should set reviewedAt when status is COMPLIANT', async () => {
      const compliantInput = { ...upsertInput, status: 'COMPLIANT' as const };
      mockComplianceAssessment.findUnique.mockResolvedValue(null);
      mockComplianceAssessment.upsert.mockResolvedValue({
        ...upsertedAssessment,
        status: 'COMPLIANT',
        reviewedAt: new Date(),
      } as never);

      await service.upsertAssessment(compliantInput);

      expect(mockComplianceAssessment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            reviewedAt: expect.any(Date),
          }),
        }),
      );
    });
  });
});
