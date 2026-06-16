import { IncidentService } from '../../src/modules/incidents/incident.service';

// Mock Prisma — declare every method the service touches.
jest.mock('../../src/config/database', () => ({
  prisma: {
    incident: {
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
import { IncidentSeverity, IncidentStatus } from '@prisma/client';

const mockIncident = prisma.incident as jest.Mocked<typeof prisma.incident>;

const INCIDENT_ID = 'c3d4e5f6-a7b8-9012-cdef-012345678912';
const ORG_ID = 'b2c3d4e5-f6a7-8901-bcde-f01234567891';
const USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const mockIncidentRow = {
  id: INCIDENT_ID,
  organizationId: ORG_ID,
  title: 'Ransomware detected',
  description: 'Encryption activity on file servers',
  severity: IncidentSeverity.HIGH,
  status: IncidentStatus.DETECTED,
  incidentType: 'Malware',
  detectedAt: new Date('2024-05-01T08:00:00Z'),
  reportedAt: null as Date | null,
  resolvedAt: null as Date | null,
  affectedSystems: ['file-server-1'],
  impactDescription: 'Two servers affected',
  reportedToAuthority: false,
  authorityReference: null as string | null,
  estimatedUsers: 100,
  createdById: USER_ID,
  createdAt: new Date('2024-05-01T09:00:00Z'),
  updatedAt: new Date('2024-05-01T09:00:00Z'),
};

describe('IncidentService', () => {
  let service: IncidentService;

  beforeEach(() => {
    service = new IncidentService();
    jest.clearAllMocks();
  });

  // ─── findAll() ───────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should scope results to the organization with default pagination', async () => {
      mockIncident.findMany.mockResolvedValue([mockIncidentRow] as never);
      mockIncident.count.mockResolvedValue(1 as never);

      const result = await service.findAll(ORG_ID, {});

      expect(mockIncident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID },
          skip: 0,
          take: 20,
          orderBy: { detectedAt: 'desc' },
        }),
      );
      expect(mockIncident.count).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
      });
      expect(result).toEqual({
        incidents: [mockIncidentRow],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should apply severity and status filters', async () => {
      mockIncident.findMany.mockResolvedValue([] as never);
      mockIncident.count.mockResolvedValue(0 as never);

      await service.findAll(
        ORG_ID,
        {},
        { severity: IncidentSeverity.CRITICAL, status: IncidentStatus.INVESTIGATING },
      );

      expect(mockIncident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: ORG_ID,
            severity: IncidentSeverity.CRITICAL,
            status: IncidentStatus.INVESTIGATING,
          },
        }),
      );
    });

    it('should add an OR search clause when search is provided', async () => {
      mockIncident.findMany.mockResolvedValue([] as never);
      mockIncident.count.mockResolvedValue(0 as never);

      await service.findAll(ORG_ID, { search: 'ransom', page: '3', limit: '5' });

      expect(mockIncident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: ORG_ID,
            OR: [
              { title: { contains: 'ransom', mode: 'insensitive' } },
              { description: { contains: 'ransom', mode: 'insensitive' } },
              { incidentType: { contains: 'ransom', mode: 'insensitive' } },
            ],
          },
          skip: 10,
          take: 5,
        }),
      );
    });
  });

  // ─── findById() ──────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('should return the incident with relations when found', async () => {
      const rowWithRelations = {
        ...mockIncidentRow,
        organization: { id: ORG_ID, name: 'Acme Corp' },
        createdBy: {
          id: USER_ID,
          firstName: 'Alice',
          lastName: 'Dupont',
          email: 'alice@example.com',
        },
      };
      mockIncident.findUnique.mockResolvedValue(rowWithRelations as never);

      const result = await service.findById(INCIDENT_ID);

      expect(mockIncident.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: INCIDENT_ID },
          include: expect.objectContaining({
            organization: expect.anything(),
            createdBy: expect.anything(),
          }),
        }),
      );
      expect(result).toEqual(rowWithRelations);
    });

    it('should throw a 404 error when the incident is not found', async () => {
      mockIncident.findUnique.mockResolvedValue(null as never);

      await expect(service.findById('missing-id')).rejects.toMatchObject({
        message: 'Incident not found',
        statusCode: 404,
      });
    });
  });

  // ─── create() ────────────────────────────────────────────────────────────

  describe('create()', () => {
    const createInput = {
      organizationId: ORG_ID,
      title: 'Phishing campaign',
      description: 'Credential harvesting emails',
      severity: IncidentSeverity.MEDIUM,
      status: IncidentStatus.DRAFT,
      incidentType: 'Phishing',
      detectedAt: new Date('2024-06-01T07:00:00Z'),
      reportedAt: undefined,
      resolvedAt: undefined,
      affectedSystems: ['mail'],
      impactDescription: 'Limited impact',
      reportedToAuthority: false,
      authorityReference: undefined,
      estimatedUsers: 50,
    };

    it('should create an incident, attaching the creator id', async () => {
      mockIncident.create.mockResolvedValue({ id: 'new-id', ...createInput } as never);

      const result = await service.create(createInput, USER_ID);

      expect(mockIncident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            title: 'Phishing campaign',
            severity: IncidentSeverity.MEDIUM,
            status: IncidentStatus.DRAFT,
            affectedSystems: ['mail'],
            createdById: USER_ID,
          }),
          include: expect.objectContaining({ createdBy: expect.anything() }),
        }),
      );
      expect(result).toMatchObject({ id: 'new-id' });
    });
  });

  // ─── update() ────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should update an existing incident', async () => {
      mockIncident.findUnique.mockResolvedValue(mockIncidentRow as never);
      mockIncident.update.mockResolvedValue({
        ...mockIncidentRow,
        status: IncidentStatus.RESOLVED,
      } as never);

      const result = await service.update(INCIDENT_ID, {
        status: IncidentStatus.RESOLVED,
      });

      expect(mockIncident.findUnique).toHaveBeenCalledWith({ where: { id: INCIDENT_ID } });
      expect(mockIncident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: INCIDENT_ID },
          data: { status: IncidentStatus.RESOLVED },
          include: expect.objectContaining({ createdBy: expect.anything() }),
        }),
      );
      expect(result).toMatchObject({ status: IncidentStatus.RESOLVED });
    });

    it('should throw a 404 error when updating a missing incident', async () => {
      mockIncident.findUnique.mockResolvedValue(null as never);

      await expect(service.update('missing-id', { title: 'X' })).rejects.toMatchObject({
        message: 'Incident not found',
        statusCode: 404,
      });
      expect(mockIncident.update).not.toHaveBeenCalled();
    });
  });

  // ─── reportToAuthority() ───────────────────────────────────────────────────

  describe('reportToAuthority()', () => {
    it('should set reportedToAuthority=true, reportedAt and REPORTED_INITIAL status', async () => {
      mockIncident.findUnique.mockResolvedValue(mockIncidentRow as never);
      mockIncident.update.mockResolvedValue({
        ...mockIncidentRow,
        reportedToAuthority: true,
        status: IncidentStatus.REPORTED_INITIAL,
      } as never);

      const result = await service.reportToAuthority(INCIDENT_ID, 'REF-2024-001');

      expect(mockIncident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: INCIDENT_ID },
          data: expect.objectContaining({
            reportedToAuthority: true,
            reportedAt: expect.any(Date),
            status: IncidentStatus.REPORTED_INITIAL,
            authorityReference: 'REF-2024-001',
          }),
        }),
      );
      expect(result).toMatchObject({
        reportedToAuthority: true,
        status: IncidentStatus.REPORTED_INITIAL,
      });
    });

    it('should keep the existing authority reference when none is supplied', async () => {
      mockIncident.findUnique.mockResolvedValue({
        ...mockIncidentRow,
        authorityReference: 'EXISTING-REF',
      } as never);
      mockIncident.update.mockResolvedValue(mockIncidentRow as never);

      await service.reportToAuthority(INCIDENT_ID);

      expect(mockIncident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorityReference: 'EXISTING-REF' }),
        }),
      );
    });

    it('should throw a 404 error when the incident is not found', async () => {
      mockIncident.findUnique.mockResolvedValue(null as never);

      await expect(service.reportToAuthority('missing-id')).rejects.toMatchObject({
        message: 'Incident not found',
        statusCode: 404,
      });
      expect(mockIncident.update).not.toHaveBeenCalled();
    });

    it('should throw a 409 error when the incident was already reported', async () => {
      mockIncident.findUnique.mockResolvedValue({
        ...mockIncidentRow,
        reportedToAuthority: true,
      } as never);

      await expect(service.reportToAuthority(INCIDENT_ID)).rejects.toMatchObject({
        message: 'Incident has already been reported to authority',
        statusCode: 409,
      });
      expect(mockIncident.update).not.toHaveBeenCalled();
    });
  });

  // ─── delete() ────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should delete an existing incident', async () => {
      mockIncident.findUnique.mockResolvedValue(mockIncidentRow as never);
      mockIncident.delete.mockResolvedValue(mockIncidentRow as never);

      await service.delete(INCIDENT_ID);

      expect(mockIncident.findUnique).toHaveBeenCalledWith({ where: { id: INCIDENT_ID } });
      expect(mockIncident.delete).toHaveBeenCalledWith({ where: { id: INCIDENT_ID } });
    });

    it('should throw a 404 error when deleting a missing incident', async () => {
      mockIncident.findUnique.mockResolvedValue(null as never);

      await expect(service.delete('missing-id')).rejects.toMatchObject({
        message: 'Incident not found',
        statusCode: 404,
      });
      expect(mockIncident.delete).not.toHaveBeenCalled();
    });
  });

  // ─── getStats() ──────────────────────────────────────────────────────────

  describe('getStats()', () => {
    it('should aggregate severity/status counts, unreported total and recent list', async () => {
      mockIncident.groupBy
        .mockResolvedValueOnce([
          { severity: IncidentSeverity.HIGH, _count: { id: 4 } },
          { severity: IncidentSeverity.LOW, _count: { id: 6 } },
        ] as never)
        .mockResolvedValueOnce([
          { status: IncidentStatus.DETECTED, _count: { id: 7 } },
          { status: IncidentStatus.RESOLVED, _count: { id: 3 } },
        ] as never);

      const recent = [
        {
          id: INCIDENT_ID,
          title: 'Ransomware detected',
          severity: IncidentSeverity.HIGH,
          status: IncidentStatus.DETECTED,
          detectedAt: new Date('2024-05-01T08:00:00Z'),
        },
      ];
      mockIncident.findMany.mockResolvedValue(recent as never);
      mockIncident.count.mockResolvedValue(2 as never);

      const result = await service.getStats(ORG_ID);

      expect(mockIncident.count).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID, reportedToAuthority: false },
      });
      expect(mockIncident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID },
          orderBy: { detectedAt: 'desc' },
          take: 5,
        }),
      );

      expect(result.total).toBe(10);
      expect(result.bySeverity).toEqual([
        { severity: IncidentSeverity.HIGH, count: 4 },
        { severity: IncidentSeverity.LOW, count: 6 },
      ]);
      expect(result.byStatus).toEqual([
        { status: IncidentStatus.DETECTED, count: 7 },
        { status: IncidentStatus.RESOLVED, count: 3 },
      ]);
      expect(result.totalUnreported).toBe(2);
      expect(result.recentIncidents).toEqual(recent);
    });

    it('should return zero totals when there are no incidents', async () => {
      mockIncident.groupBy.mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never);
      mockIncident.findMany.mockResolvedValue([] as never);
      mockIncident.count.mockResolvedValue(0 as never);

      const result = await service.getStats(ORG_ID);

      expect(result.total).toBe(0);
      expect(result.bySeverity).toEqual([]);
      expect(result.byStatus).toEqual([]);
      expect(result.totalUnreported).toBe(0);
      expect(result.recentIncidents).toEqual([]);
    });
  });
});
