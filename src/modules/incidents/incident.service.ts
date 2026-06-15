import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { CreateIncidentInput, UpdateIncidentInput } from './incident.schemas';

export class IncidentService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      severity?: IncidentSeverity;
      status?: IncidentStatus;
    },
  ) {
    const { page, limit, skip, search } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.severity) {
      where['severity'] = filters.severity;
    }

    if (filters?.status) {
      where['status'] = filters.status;
    }

    if (search) {
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { incidentType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { detectedAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.incident.count({ where }),
    ]);

    return { incidents, total, page, limit };
  }

  async findById(id: string) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!incident) {
      const error = new Error('Incident not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return incident;
  }

  async create(data: CreateIncidentInput, createdById: string) {
    return prisma.incident.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: data.status,
        incidentType: data.incidentType,
        detectedAt: data.detectedAt,
        reportedAt: data.reportedAt,
        resolvedAt: data.resolvedAt,
        affectedSystems: data.affectedSystems,
        impactDescription: data.impactDescription,
        reportedToAuthority: data.reportedToAuthority,
        authorityReference: data.authorityReference,
        estimatedUsers: data.estimatedUsers,
        createdById,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateIncidentInput) {
    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Incident not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return prisma.incident.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async reportToAuthority(id: string, authorityReference?: string) {
    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Incident not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    if (existing.reportedToAuthority) {
      const error = new Error('Incident has already been reported to authority');
      Object.assign(error, { statusCode: 409 });
      throw error;
    }

    return prisma.incident.update({
      where: { id },
      data: {
        reportedToAuthority: true,
        reportedAt: new Date(),
        status: IncidentStatus.REPORTED_INITIAL,
        authorityReference: authorityReference ?? existing.authorityReference,
      },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Incident not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    await prisma.incident.delete({ where: { id } });
  }

  async getStats(orgId: string) {
    const [bySeverity, byStatus, recentIncidents] = await Promise.all([
      prisma.incident.groupBy({
        by: ['severity'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.incident.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.incident.findMany({
        where: { organizationId: orgId },
        orderBy: { detectedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          detectedAt: true,
        },
      }),
    ]);

    const totalUnreported = await prisma.incident.count({
      where: { organizationId: orgId, reportedToAuthority: false },
    });

    return {
      total: bySeverity.reduce((sum, c) => sum + c._count.id, 0),
      bySeverity: bySeverity.map((c) => ({
        severity: c.severity,
        count: c._count.id,
      })),
      byStatus: byStatus.map((c) => ({
        status: c.status,
        count: c._count.id,
      })),
      totalUnreported,
      recentIncidents,
    };
  }
}

export default new IncidentService();
