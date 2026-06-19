import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { DriverStatus } from '@prisma/client';
import { CreateDriverInput, UpdateDriverInput } from './driver.schemas';

export class DriverService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      status?: DriverStatus;
    },
  ) {
    const { page, limit, skip, search } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.status) {
      where['status'] = filters.status;
    }

    if (search) {
      where['OR'] = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driver.count({ where }),
    ]);

    return { drivers, total, page, limit };
  }

  async findById(orgId: string, id: string) {
    const driver = await prisma.driver.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!driver) {
      const error = new Error('Driver not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return driver;
  }

  async getStats(orgId: string, id: string) {
    const driver = await this.findById(orgId, id);

    const [tripCount, distanceAgg, eventsByType, recentTrips] = await Promise.all([
      prisma.trip.count({ where: { organizationId: orgId, driverId: id } }),
      prisma.trip.aggregate({
        where: { organizationId: orgId, driverId: id },
        _sum: { distanceKm: true },
      }),
      prisma.drivingEvent.groupBy({
        by: ['type'],
        where: { organizationId: orgId, driverId: id },
        _count: { id: true },
      }),
      prisma.trip.findMany({
        where: { organizationId: orgId, driverId: id },
        orderBy: { startTime: 'desc' },
        take: 5,
      }),
    ]);

    return {
      tripCount,
      totalDistanceKm: distanceAgg._sum.distanceKm ?? 0,
      behaviorScore: driver.behaviorScore,
      eventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count.id })),
      recentTrips,
    };
  }

  async create(orgId: string, data: CreateDriverInput) {
    return prisma.driver.create({
      data: {
        organizationId: orgId,
        firstName: data.firstName,
        lastName: data.lastName,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseExpiry: data.licenseExpiry,
        phone: data.phone,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        hireDate: data.hireDate,
        status: data.status,
      },
    });
  }

  async update(orgId: string, id: string, data: UpdateDriverInput) {
    await this.findById(orgId, id);

    return prisma.driver.update({
      where: { id },
      data,
    });
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.driver.delete({ where: { id } });
  }
}

export default new DriverService();
