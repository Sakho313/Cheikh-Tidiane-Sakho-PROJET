import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { CreateOrganizationInput, UpdateOrganizationInput } from './organization.schemas';
import { ComplianceStatus } from '@prisma/client';

export class OrganizationService {
  async findAll(query: Record<string, unknown>) {
    const { page, limit, skip, search } = parsePagination(query);

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { country: { contains: search, mode: 'insensitive' as const } },
            { contactEmail: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          sector: true,
          entityType: true,
          country: true,
          contactEmail: true,
          contactPhone: true,
          website: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              incidents: true,
              risks: true,
              audits: true,
            },
          },
        },
      }),
      prisma.organization.count({ where }),
    ]);

    return { organizations, total, page, limit };
  }

  async findById(id: string) {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            incidents: true,
            risks: true,
            audits: true,
            complianceAssessments: true,
          },
        },
      },
    });

    if (!organization) {
      const error = new Error('Organization not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return organization;
  }

  async create(data: CreateOrganizationInput) {
    return prisma.organization.create({
      data: {
        name: data.name,
        sector: data.sector,
        entityType: data.entityType,
        country: data.country,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        website: data.website || null,
      },
    });
  }

  async update(id: string, data: UpdateOrganizationInput) {
    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Organization not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return prisma.organization.update({
      where: { id },
      data: {
        ...data,
        website: data.website === '' ? null : data.website,
      },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Organization not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    await prisma.organization.delete({ where: { id } });
  }

  async getStats(orgId: string) {
    const [incidentCounts, riskCounts, auditCounts, assessmentCounts] = await Promise.all([
      prisma.incident.groupBy({
        by: ['severity'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.risk.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.audit.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.complianceAssessment.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
    ]);

    const totalAssessments = assessmentCounts.reduce((sum, c) => sum + c._count.id, 0);
    const compliantCount =
      assessmentCounts.find((c) => c.status === ComplianceStatus.COMPLIANT)?._count.id ?? 0;

    const complianceScore =
      totalAssessments > 0 ? Math.round((compliantCount / totalAssessments) * 100) : 0;

    return {
      incidents: {
        total: incidentCounts.reduce((sum, c) => sum + c._count.id, 0),
        bySeverity: incidentCounts.map((c) => ({
          severity: c.severity,
          count: c._count.id,
        })),
      },
      risks: {
        total: riskCounts.reduce((sum, c) => sum + c._count.id, 0),
        byStatus: riskCounts.map((c) => ({
          status: c.status,
          count: c._count.id,
        })),
      },
      audits: {
        total: auditCounts.reduce((sum, c) => sum + c._count.id, 0),
        byStatus: auditCounts.map((c) => ({
          status: c.status,
          count: c._count.id,
        })),
      },
      compliance: {
        totalAssessments,
        compliantCount,
        complianceScore,
      },
    };
  }
}

export default new OrganizationService();
