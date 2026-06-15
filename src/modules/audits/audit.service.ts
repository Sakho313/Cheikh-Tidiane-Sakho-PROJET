import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { AuditType, AuditStatus, FindingStatus } from '@prisma/client';
import {
  CreateAuditInput,
  UpdateAuditInput,
  CreateFindingInput,
  UpdateFindingInput,
} from './audit.schemas';

export class AuditService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: { type?: AuditType; status?: AuditStatus },
  ) {
    const { page, limit, skip, search } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.type) {
      where['type'] = filters.type;
    }

    if (filters?.status) {
      where['status'] = filters.status;
    }

    if (search) {
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { scope: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          auditor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { findings: true } },
        },
      }),
      prisma.audit.count({ where }),
    ]);

    return { audits, total, page, limit };
  }

  async findById(id: string) {
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        auditor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        findings: {
          include: {
            control: {
              select: { id: true, article: true, domain: true, requirement: true },
            },
          },
          orderBy: { severity: 'desc' },
        },
      },
    });

    if (!audit) {
      const error = new Error('Audit not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return audit;
  }

  async create(data: CreateAuditInput) {
    return prisma.audit.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        type: data.type,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        auditorId: data.auditorId,
        scope: data.scope,
        methodology: data.methodology,
        summary: data.summary,
      },
      include: {
        auditor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateAuditInput) {
    const existing = await prisma.audit.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Audit not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return prisma.audit.update({
      where: { id },
      data,
      include: {
        auditor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.audit.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Audit not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    await prisma.audit.delete({ where: { id } });
  }

  async addFinding(auditId: string, data: CreateFindingInput) {
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) {
      const error = new Error('Audit not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return prisma.auditFinding.create({
      data: {
        auditId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: data.status,
        controlId: data.controlId,
        recommendation: data.recommendation,
        dueDate: data.dueDate,
      },
      include: {
        control: {
          select: { id: true, article: true, domain: true, requirement: true },
        },
      },
    });
  }

  async updateFinding(auditId: string, findingId: string, data: UpdateFindingInput) {
    const finding = await prisma.auditFinding.findFirst({
      where: { id: findingId, auditId },
    });

    if (!finding) {
      const error = new Error('Finding not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const closedAt =
      data.status === FindingStatus.CLOSED && finding.status !== FindingStatus.CLOSED
        ? new Date()
        : finding.closedAt;

    return prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        ...data,
        closedAt,
      },
      include: {
        control: {
          select: { id: true, article: true, domain: true, requirement: true },
        },
      },
    });
  }

  async getFindings(auditId: string) {
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) {
      const error = new Error('Audit not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return prisma.auditFinding.findMany({
      where: { auditId },
      include: {
        control: {
          select: { id: true, article: true, domain: true, requirement: true },
        },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getStats(orgId: string) {
    const [byType, byStatus, recentAudits] = await Promise.all([
      prisma.audit.groupBy({
        by: ['type'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.audit.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.audit.findMany({
        where: { organizationId: orgId },
        orderBy: { startDate: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          startDate: true,
        },
      }),
    ]);

    const findingStats = await prisma.auditFinding.groupBy({
      by: ['severity'],
      where: { audit: { organizationId: orgId } },
      _count: { id: true },
    });

    return {
      total: byType.reduce((sum, c) => sum + c._count.id, 0),
      byType: byType.map((c) => ({ type: c.type, count: c._count.id })),
      byStatus: byStatus.map((c) => ({ status: c.status, count: c._count.id })),
      findings: {
        bySeverity: findingStats.map((c) => ({
          severity: c.severity,
          count: c._count.id,
        })),
      },
      recentAudits,
    };
  }
}

export default new AuditService();
