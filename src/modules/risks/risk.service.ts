import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { RiskCategory, RiskStatus } from '@prisma/client';
import { CreateRiskInput, UpdateRiskInput } from './risk.schemas';

export class RiskService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      category?: RiskCategory;
      status?: RiskStatus;
    },
  ) {
    const { page, limit, skip, search } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.category) {
      where['category'] = filters.category;
    }

    if (filters?.status) {
      where['status'] = filters.status;
    }

    if (search) {
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [risks, total] = await Promise.all([
      prisma.risk.findMany({
        where,
        skip,
        take: limit,
        orderBy: { riskScore: 'desc' },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.risk.count({ where }),
    ]);

    return { risks, total, page, limit };
  }

  async findById(id: string) {
    const risk = await prisma.risk.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!risk) {
      const error = new Error('Risk not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return risk;
  }

  async create(data: CreateRiskInput) {
    const riskScore = data.likelihood * data.impact;

    return prisma.risk.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        category: data.category,
        likelihood: data.likelihood,
        impact: data.impact,
        riskScore,
        status: data.status,
        mitigationPlan: data.mitigationPlan,
        ownerId: data.ownerId,
        reviewDate: data.reviewDate,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateRiskInput) {
    const existing = await prisma.risk.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Risk not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const likelihood = data.likelihood ?? existing.likelihood;
    const impact = data.impact ?? existing.impact;
    const riskScore = likelihood * impact;

    const closedAt =
      data.status === RiskStatus.CLOSED && existing.status !== RiskStatus.CLOSED
        ? new Date()
        : existing.closedAt;

    return prisma.risk.update({
      where: { id },
      data: {
        ...data,
        riskScore,
        closedAt,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.risk.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Risk not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    await prisma.risk.delete({ where: { id } });
  }

  async getRiskMatrix(orgId: string) {
    const risks = await prisma.risk.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        title: true,
        likelihood: true,
        impact: true,
        riskScore: true,
        status: true,
        category: true,
      },
    });

    type HeatmapCell = {
      likelihood: number;
      impact: number;
      riskScore: number;
      count: number;
      risks: Array<{ id: string; title: string; status: RiskStatus; category: RiskCategory }>;
      level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };

    const heatmap: HeatmapCell[][] = Array.from({ length: 5 }, (_, liIndex) =>
      Array.from({ length: 5 }, (_, impIndex) => {
        const likelihood = liIndex + 1;
        const impact = impIndex + 1;
        const riskScore = likelihood * impact;
        let level: HeatmapCell['level'];

        if (riskScore <= 4) level = 'LOW';
        else if (riskScore <= 9) level = 'MEDIUM';
        else if (riskScore <= 16) level = 'HIGH';
        else level = 'CRITICAL';

        return { likelihood, impact, riskScore, count: 0, risks: [], level };
      }),
    );

    for (const risk of risks) {
      const liIdx = risk.likelihood - 1;
      const impIdx = risk.impact - 1;
      const cell = heatmap[liIdx]?.[impIdx];
      if (cell) {
        cell.count++;
        cell.risks.push({
          id: risk.id,
          title: risk.title,
          status: risk.status,
          category: risk.category,
        });
      }
    }

    const byCategory = Object.values(RiskCategory).map((category) => {
      const categoryRisks = risks.filter((r) => r.category === category);
      const avgScore =
        categoryRisks.length > 0
          ? Math.round(
              categoryRisks.reduce((sum, r) => sum + r.riskScore, 0) /
                categoryRisks.length,
            )
          : 0;
      return { category, count: categoryRisks.length, avgScore };
    });

    return {
      matrix: heatmap,
      byCategory,
      summary: {
        total: risks.length,
        critical: risks.filter((r) => r.riskScore >= 17).length,
        high: risks.filter((r) => r.riskScore >= 10 && r.riskScore <= 16).length,
        medium: risks.filter((r) => r.riskScore >= 5 && r.riskScore <= 9).length,
        low: risks.filter((r) => r.riskScore <= 4).length,
      },
    };
  }

  async getStats(orgId: string) {
    const [byCategory, byStatus, topRisks] = await Promise.all([
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
      prisma.risk.findMany({
        where: { organizationId: orgId },
        orderBy: { riskScore: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          riskScore: true,
          likelihood: true,
          impact: true,
          category: true,
          status: true,
        },
      }),
    ]);

    return {
      total: byStatus.reduce((sum, c) => sum + c._count.id, 0),
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
        avgScore: Math.round(c._avg.riskScore ?? 0),
      })),
      byStatus: byStatus.map((c) => ({
        status: c.status,
        count: c._count.id,
      })),
      topRisks,
    };
  }
}

export default new RiskService();
