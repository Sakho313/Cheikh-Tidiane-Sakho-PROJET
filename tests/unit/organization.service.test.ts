import { OrganizationService } from '../../src/modules/organizations/organization.service';

// Mock Prisma — declare every method the service touches.
jest.mock('../../src/config/database', () => ({
  prisma: {
    organization: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    incident: {
      groupBy: jest.fn(),
    },
    risk: {
      groupBy: jest.fn(),
    },
    audit: {
      groupBy: jest.fn(),
    },
    complianceAssessment: {
      groupBy: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/config/database';
import { Sector, EntityType, ComplianceStatus } from '@prisma/client';

const mockOrg = prisma.organization as jest.Mocked<typeof prisma.organization>;
const mockIncident = prisma.incident as jest.Mocked<typeof prisma.incident>;
const mockRisk = prisma.risk as jest.Mocked<typeof prisma.risk>;
const mockAudit = prisma.audit as jest.Mocked<typeof prisma.audit>;
const mockAssessment = prisma.complianceAssessment as jest.Mocked<
  typeof prisma.complianceAssessment
>;

const ORG_ID = 'b2c3d4e5-f6a7-8901-bcde-f01234567891';

const mockOrgRow = {
  id: ORG_ID,
  name: 'Acme Corp',
  sector: Sector.ENERGY,
  entityType: EntityType.ESSENTIAL,
  country: 'France',
  contactEmail: 'contact@acme.example.com',
  contactPhone: '+33123456789',
  address: '1 rue de la Paix',
  website: 'https://acme.example.com',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-02-15T10:00:00Z'),
};

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(() => {
    service = new OrganizationService();
    jest.clearAllMocks();
  });

  // ─── findAll() ───────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return paginated organizations without a search filter', async () => {
      mockOrg.findMany.mockResolvedValue([mockOrgRow] as never);
      mockOrg.count.mockResolvedValue(1 as never);

      const result = await service.findAll({ page: '2', limit: '10' });

      expect(mockOrg.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 10,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(mockOrg.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        organizations: [mockOrgRow],
        total: 1,
        page: 2,
        limit: 10,
      });
    });

    it('should build an OR search clause when search is provided', async () => {
      mockOrg.findMany.mockResolvedValue([] as never);
      mockOrg.count.mockResolvedValue(0 as never);

      await service.findAll({ search: 'acme' });

      const expectedWhere = {
        OR: [
          { name: { contains: 'acme', mode: 'insensitive' } },
          { country: { contains: 'acme', mode: 'insensitive' } },
          { contactEmail: { contains: 'acme', mode: 'insensitive' } },
        ],
      };
      expect(mockOrg.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
      expect(mockOrg.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should fall back to default pagination (page 1, limit 20)', async () => {
      mockOrg.findMany.mockResolvedValue([] as never);
      mockOrg.count.mockResolvedValue(0 as never);

      const result = await service.findAll({});

      expect(mockOrg.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  // ─── findById() ──────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('should return the organization with counts when it exists', async () => {
      const rowWithCounts = {
        ...mockOrgRow,
        _count: { users: 3, incidents: 5, risks: 2, audits: 1, complianceAssessments: 10 },
      };
      mockOrg.findUnique.mockResolvedValue(rowWithCounts as never);

      const result = await service.findById(ORG_ID);

      expect(mockOrg.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ORG_ID },
          include: expect.objectContaining({
            _count: expect.objectContaining({
              select: expect.objectContaining({
                users: true,
                incidents: true,
                risks: true,
                audits: true,
                complianceAssessments: true,
              }),
            }),
          }),
        }),
      );
      expect(result).toEqual(rowWithCounts);
    });

    it('should throw a 404 error when the organization is not found', async () => {
      mockOrg.findUnique.mockResolvedValue(null as never);

      await expect(service.findById('missing-id')).rejects.toMatchObject({
        message: 'Organization not found',
        statusCode: 404,
      });
    });
  });

  // ─── create() ────────────────────────────────────────────────────────────

  describe('create()', () => {
    const createInput = {
      name: 'New Org',
      sector: Sector.BANKING,
      entityType: EntityType.IMPORTANT,
      country: 'Belgium',
      contactEmail: 'new@org.example.com',
      contactPhone: '+32123456789',
      address: '10 Grand Place',
      website: 'https://neworg.example.com',
    };

    it('should create an organization with the provided data', async () => {
      mockOrg.create.mockResolvedValue({ id: 'new-id', ...createInput } as never);

      const result = await service.create(createInput);

      expect(mockOrg.create).toHaveBeenCalledWith({
        data: {
          name: createInput.name,
          sector: createInput.sector,
          entityType: createInput.entityType,
          country: createInput.country,
          contactEmail: createInput.contactEmail,
          contactPhone: createInput.contactPhone,
          address: createInput.address,
          website: createInput.website,
        },
      });
      expect(result).toMatchObject({ id: 'new-id', name: 'New Org' });
    });

    it('should default website to null when it is empty/undefined', async () => {
      mockOrg.create.mockResolvedValue({ id: 'new-id' } as never);

      await service.create({ ...createInput, website: undefined });

      expect(mockOrg.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ website: null }),
        }),
      );
    });
  });

  // ─── update() ────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should update an existing organization', async () => {
      mockOrg.findUnique.mockResolvedValue(mockOrgRow as never);
      mockOrg.update.mockResolvedValue({ ...mockOrgRow, name: 'Renamed' } as never);

      const result = await service.update(ORG_ID, { name: 'Renamed' });

      expect(mockOrg.findUnique).toHaveBeenCalledWith({ where: { id: ORG_ID } });
      expect(mockOrg.update).toHaveBeenCalledWith({
        where: { id: ORG_ID },
        data: { name: 'Renamed', website: undefined },
      });
      expect(result).toMatchObject({ name: 'Renamed' });
    });

    it('should convert an empty website string to null', async () => {
      mockOrg.findUnique.mockResolvedValue(mockOrgRow as never);
      mockOrg.update.mockResolvedValue(mockOrgRow as never);

      await service.update(ORG_ID, { website: '' });

      expect(mockOrg.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ website: null }),
        }),
      );
    });

    it('should throw a 404 error when updating a missing organization', async () => {
      mockOrg.findUnique.mockResolvedValue(null as never);

      await expect(service.update('missing-id', { name: 'X' })).rejects.toMatchObject({
        message: 'Organization not found',
        statusCode: 404,
      });
      expect(mockOrg.update).not.toHaveBeenCalled();
    });
  });

  // ─── delete() ────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should delete an existing organization', async () => {
      mockOrg.findUnique.mockResolvedValue(mockOrgRow as never);
      mockOrg.delete.mockResolvedValue(mockOrgRow as never);

      await service.delete(ORG_ID);

      expect(mockOrg.findUnique).toHaveBeenCalledWith({ where: { id: ORG_ID } });
      expect(mockOrg.delete).toHaveBeenCalledWith({ where: { id: ORG_ID } });
    });

    it('should throw a 404 error when deleting a missing organization', async () => {
      mockOrg.findUnique.mockResolvedValue(null as never);

      await expect(service.delete('missing-id')).rejects.toMatchObject({
        message: 'Organization not found',
        statusCode: 404,
      });
      expect(mockOrg.delete).not.toHaveBeenCalled();
    });
  });

  // ─── getStats() ──────────────────────────────────────────────────────────

  describe('getStats()', () => {
    it('should aggregate counters across incidents, risks, audits and compliance', async () => {
      mockIncident.groupBy.mockResolvedValue([
        { severity: 'HIGH', _count: { id: 4 } },
        { severity: 'LOW', _count: { id: 6 } },
      ] as never);
      mockRisk.groupBy.mockResolvedValue([
        { status: 'IDENTIFIED', _count: { id: 2 } },
        { status: 'MITIGATED', _count: { id: 3 } },
      ] as never);
      mockAudit.groupBy.mockResolvedValue([{ status: 'COMPLETED', _count: { id: 1 } }] as never);
      mockAssessment.groupBy.mockResolvedValue([
        { status: ComplianceStatus.COMPLIANT, _count: { id: 7 } },
        { status: ComplianceStatus.NON_COMPLIANT, _count: { id: 3 } },
      ] as never);

      const result = await service.getStats(ORG_ID);

      expect(mockIncident.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: ORG_ID } }),
      );

      expect(result.incidents.total).toBe(10);
      expect(result.incidents.bySeverity).toEqual([
        { severity: 'HIGH', count: 4 },
        { severity: 'LOW', count: 6 },
      ]);

      expect(result.risks.total).toBe(5);
      expect(result.risks.byStatus).toEqual([
        { status: 'IDENTIFIED', count: 2 },
        { status: 'MITIGATED', count: 3 },
      ]);

      expect(result.audits.total).toBe(1);
      expect(result.audits.byStatus).toEqual([{ status: 'COMPLETED', count: 1 }]);

      // 7 compliant out of 10 total => 70%
      expect(result.compliance.totalAssessments).toBe(10);
      expect(result.compliance.compliantCount).toBe(7);
      expect(result.compliance.complianceScore).toBe(70);
    });

    it('should report a 0 compliance score when there are no assessments', async () => {
      mockIncident.groupBy.mockResolvedValue([] as never);
      mockRisk.groupBy.mockResolvedValue([] as never);
      mockAudit.groupBy.mockResolvedValue([] as never);
      mockAssessment.groupBy.mockResolvedValue([] as never);

      const result = await service.getStats(ORG_ID);

      expect(result.incidents.total).toBe(0);
      expect(result.risks.total).toBe(0);
      expect(result.audits.total).toBe(0);
      expect(result.compliance.totalAssessments).toBe(0);
      expect(result.compliance.compliantCount).toBe(0);
      expect(result.compliance.complianceScore).toBe(0);
    });

    it('should treat an absent COMPLIANT bucket as 0 compliant', async () => {
      mockIncident.groupBy.mockResolvedValue([] as never);
      mockRisk.groupBy.mockResolvedValue([] as never);
      mockAudit.groupBy.mockResolvedValue([] as never);
      mockAssessment.groupBy.mockResolvedValue([
        { status: ComplianceStatus.NON_COMPLIANT, _count: { id: 5 } },
      ] as never);

      const result = await service.getStats(ORG_ID);

      expect(result.compliance.totalAssessments).toBe(5);
      expect(result.compliance.compliantCount).toBe(0);
      expect(result.compliance.complianceScore).toBe(0);
    });
  });
});
