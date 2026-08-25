import { EventSeverity, EventType } from '@prisma/client';
import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { emitDrivingEvent } from '../../realtime/socket';
import { CreateEventInput } from './event.schemas';

export class EventService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      vehicleId?: string;
      driverId?: string;
      tripId?: string;
      type?: EventType;
      severity?: EventSeverity;
    },
  ) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };
    if (filters?.vehicleId) where['vehicleId'] = filters.vehicleId;
    if (filters?.driverId) where['driverId'] = filters.driverId;
    if (filters?.tripId) where['tripId'] = filters.tripId;
    if (filters?.type) where['type'] = filters.type;
    if (filters?.severity) where['severity'] = filters.severity;

    const [events, total] = await Promise.all([
      prisma.drivingEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          vehicle: { select: { id: true, plate: true, make: true, model: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.drivingEvent.count({ where }),
    ]);

    return { events, total, page, limit };
  }

  async findById(orgId: string, id: string) {
    const event = await prisma.drivingEvent.findFirst({
      where: { id, organizationId: orgId },
      include: {
        vehicle: { select: { id: true, plate: true, make: true, model: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!event) {
      const error = new Error('Driving event not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return event;
  }

  async getStats(
    orgId: string,
    filters?: {
      vehicleId?: string;
      driverId?: string;
      from?: Date;
      to?: Date;
    },
  ) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (filters?.vehicleId) where['vehicleId'] = filters.vehicleId;
    if (filters?.driverId) where['driverId'] = filters.driverId;
    if (filters?.from || filters?.to) {
      const timestamp: Record<string, Date> = {};
      if (filters.from) timestamp['gte'] = filters.from;
      if (filters.to) timestamp['lte'] = filters.to;
      where['timestamp'] = timestamp;
    }

    const [byType, bySeverity, total] = await Promise.all([
      prisma.drivingEvent.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),
      prisma.drivingEvent.groupBy({
        by: ['severity'],
        where,
        _count: { id: true },
      }),
      prisma.drivingEvent.count({ where }),
    ]);

    return {
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count.id })),
      total,
    };
  }

  async create(orgId: string, data: CreateEventInput) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, organizationId: orgId },
    });
    if (!vehicle) {
      const error = new Error('Vehicle not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const event = await prisma.drivingEvent.create({
      data: {
        organizationId: orgId,
        vehicleId: data.vehicleId,
        driverId: data.driverId ?? null,
        tripId: data.tripId ?? null,
        type: data.type,
        severity: data.severity,
        timestamp: data.timestamp ?? new Date(),
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        speedKmh: data.speedKmh ?? null,
        speedLimitKmh: data.speedLimitKmh ?? null,
        value: data.value ?? null,
        penaltyPoints: data.penaltyPoints,
      },
      include: {
        vehicle: { select: { id: true, plate: true, make: true, model: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    emitDrivingEvent(orgId, event);
    return event;
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.drivingEvent.delete({ where: { id } });
  }
}

export default new EventService();
