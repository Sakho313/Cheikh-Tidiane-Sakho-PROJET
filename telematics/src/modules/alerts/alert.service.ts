import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { AlertType, AlertSeverity, AlertStatus } from '@prisma/client';
import { CreateAlertInput } from './alert.schemas';

export class AlertService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      status?: AlertStatus;
      type?: AlertType;
      severity?: AlertSeverity;
      vehicleId?: string;
    },
  ) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.status) {
      where['status'] = filters.status;
    }

    if (filters?.type) {
      where['type'] = filters.type;
    }

    if (filters?.severity) {
      where['severity'] = filters.severity;
    }

    if (filters?.vehicleId) {
      where['vehicleId'] = filters.vehicleId;
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          vehicle: { select: { id: true, plate: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    return { alerts, total, page, limit };
  }

  async findById(orgId: string, id: string) {
    const alert = await prisma.alert.findFirst({
      where: { id, organizationId: orgId },
      include: {
        vehicle: { select: { id: true, plate: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!alert) {
      const error = new Error('Alert not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return alert;
  }

  async create(orgId: string, data: CreateAlertInput) {
    return prisma.alert.create({
      data: {
        organizationId: orgId,
        vehicleId: data.vehicleId ?? null,
        driverId: data.driverId ?? null,
        type: data.type,
        severity: data.severity,
        status: data.status,
        title: data.title,
        message: data.message ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
      include: {
        vehicle: { select: { id: true, plate: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async acknowledge(orgId: string, id: string, userId: string) {
    await this.findById(orgId, id);

    return prisma.alert.update({
      where: { id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
      include: {
        vehicle: { select: { id: true, plate: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async resolve(orgId: string, id: string) {
    await this.findById(orgId, id);

    return prisma.alert.update({
      where: { id },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
      },
      include: {
        vehicle: { select: { id: true, plate: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.alert.delete({ where: { id } });
  }

  async getStats(orgId: string) {
    const [byStatus, bySeverity, byType, open] = await Promise.all([
      prisma.alert.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      prisma.alert.groupBy({
        by: ['severity'],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      prisma.alert.groupBy({
        by: ['type'],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      prisma.alert.count({
        where: { organizationId: orgId, status: AlertStatus.OPEN },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count._all })),
      byType: byType.map((t) => ({ type: t.type, count: t._count._all })),
      open,
    };
  }
}

export default new AlertService();
