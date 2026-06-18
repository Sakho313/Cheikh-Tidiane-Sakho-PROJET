import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { AlertStatus, VehicleStatus } from '@prisma/client';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicle.schemas';

export class VehicleService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      status?: VehicleStatus;
    },
  ) {
    const { page, limit, skip, search } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.status) {
      where['status'] = filters.status;
    }

    if (search) {
      where['OR'] = [
        { plate: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { device: true },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { vehicles, total, page, limit };
  }

  async findById(orgId: string, id: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, organizationId: orgId },
      include: {
        device: true,
        _count: { select: { trips: true, alerts: true } },
      },
    });

    if (!vehicle) {
      const error = new Error('Vehicle not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return vehicle;
  }

  async getStats(orgId: string, id: string) {
    await this.findById(orgId, id);

    const [tripCount, distanceAgg, eventCount, openAlerts, lastPosition] = await Promise.all([
      prisma.trip.count({ where: { organizationId: orgId, vehicleId: id } }),
      prisma.trip.aggregate({
        where: { organizationId: orgId, vehicleId: id },
        _sum: { distanceKm: true },
      }),
      prisma.drivingEvent.count({ where: { organizationId: orgId, vehicleId: id } }),
      prisma.alert.count({
        where: { organizationId: orgId, vehicleId: id, status: AlertStatus.OPEN },
      }),
      prisma.gpsPosition.findFirst({
        where: { organizationId: orgId, vehicleId: id },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return {
      tripCount,
      totalDistanceKm: distanceAgg._sum.distanceKm ?? 0,
      eventCount,
      openAlerts,
      lastPosition,
    };
  }

  async create(orgId: string, data: CreateVehicleInput) {
    return prisma.vehicle.create({
      data: {
        organizationId: orgId,
        plate: data.plate,
        make: data.make,
        model: data.model,
        year: data.year,
        vin: data.vin,
        color: data.color,
        fuelType: data.fuelType,
        tankCapacityL: data.tankCapacityL,
        avgConsumptionL100: data.avgConsumptionL100,
        odometerKm: data.odometerKm,
        maxSpeedKmh: data.maxSpeedKmh,
        status: data.status,
      },
      include: { device: true },
    });
  }

  async update(orgId: string, id: string, data: UpdateVehicleInput) {
    await this.findById(orgId, id);

    return prisma.vehicle.update({
      where: { id },
      data,
      include: { device: true },
    });
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.vehicle.delete({ where: { id } });
  }
}

export default new VehicleService();
