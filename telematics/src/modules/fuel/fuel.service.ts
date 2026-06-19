import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { FuelRecordType } from '@prisma/client';
import { CreateFuelRecordInput, UpdateFuelRecordInput } from './fuel.schemas';

type DateRange = { from?: Date; to?: Date };

export class FuelService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      vehicleId?: string;
      driverId?: string;
      type?: FuelRecordType;
    },
  ) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.vehicleId) {
      where['vehicleId'] = filters.vehicleId;
    }

    if (filters?.driverId) {
      where['driverId'] = filters.driverId;
    }

    if (filters?.type) {
      where['type'] = filters.type;
    }

    const [records, total] = await Promise.all([
      prisma.fuelRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          vehicle: { select: { id: true, plate: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.fuelRecord.count({ where }),
    ]);

    return { records, total, page, limit };
  }

  async findByVehicle(orgId: string, vehicleId: string) {
    return prisma.fuelRecord.findMany({
      where: { organizationId: orgId, vehicleId },
      orderBy: { timestamp: 'desc' },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findById(orgId: string, id: string) {
    const record = await prisma.fuelRecord.findFirst({
      where: { id, organizationId: orgId },
      include: {
        vehicle: { select: { id: true, plate: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!record) {
      const error = new Error('Fuel record not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return record;
  }

  async create(orgId: string, data: CreateFuelRecordInput) {
    const totalCost =
      data.totalCost ??
      (data.liters !== undefined && data.pricePerLiter !== undefined
        ? data.liters * data.pricePerLiter
        : undefined);

    return prisma.fuelRecord.create({
      data: {
        organizationId: orgId,
        vehicleId: data.vehicleId,
        driverId: data.driverId ?? null,
        type: data.type,
        timestamp: data.timestamp,
        liters: data.liters,
        pricePerLiter: data.pricePerLiter ?? null,
        totalCost: totalCost ?? null,
        currency: data.currency,
        odometerKm: data.odometerKm ?? null,
        fuelLevelBeforeL: data.fuelLevelBeforeL ?? null,
        fuelLevelAfterL: data.fuelLevelAfterL ?? null,
        location: data.location ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        stationName: data.stationName ?? null,
        isFullTank: data.isFullTank,
        notes: data.notes ?? null,
      },
      include: {
        vehicle: { select: { id: true, plate: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(orgId: string, id: string, data: UpdateFuelRecordInput) {
    await this.findById(orgId, id);

    return prisma.fuelRecord.update({
      where: { id },
      data,
      include: {
        vehicle: { select: { id: true, plate: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.fuelRecord.delete({ where: { id } });
  }

  /**
   * Calcule la consommation L/100km entre pleins (REFUEL) consécutifs disposant
   * d'un relevé d'odomètre. Pour chaque paire consécutive triée par horodatage,
   * la distance est l'écart d'odomètre et la consommation est le volume du plein
   * suivant (carburant utilisé pour parcourir la distance).
   */
  async getVehicleEfficiency(orgId: string, vehicleId: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, organizationId: orgId },
      select: { id: true, avgConsumptionL100: true },
    });

    if (!vehicle) {
      const error = new Error('Vehicle not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const refuels = await prisma.fuelRecord.findMany({
      where: {
        organizationId: orgId,
        vehicleId,
        type: FuelRecordType.REFUEL,
        odometerKm: { not: null },
      },
      orderBy: { timestamp: 'asc' },
      select: { id: true, timestamp: true, liters: true, odometerKm: true },
    });

    const series: Array<{
      from: Date;
      to: Date;
      distanceKm: number;
      liters: number;
      l100: number;
    }> = [];

    for (let i = 1; i < refuels.length; i++) {
      const prev = refuels[i - 1];
      const curr = refuels[i];
      if (!prev || !curr) continue;

      const odoBefore = prev.odometerKm;
      const odoAfter = curr.odometerKm;
      if (odoBefore === null || odoAfter === null) continue;

      const distanceKm = odoAfter - odoBefore;
      if (distanceKm <= 0) continue;

      const liters = curr.liters;
      const l100 = (liters / distanceKm) * 100;

      series.push({
        from: prev.timestamp,
        to: curr.timestamp,
        distanceKm: Math.round(distanceKm * 100) / 100,
        liters: Math.round(liters * 100) / 100,
        l100: Math.round(l100 * 100) / 100,
      });
    }

    const averageL100 =
      series.length > 0
        ? Math.round((series.reduce((sum, s) => sum + s.l100, 0) / series.length) * 100) / 100
        : null;

    return {
      series,
      averageL100,
      referenceL100: vehicle.avgConsumptionL100 ?? null,
    };
  }

  async getStats(orgId: string, range: DateRange) {
    const where: Record<string, unknown> = { organizationId: orgId };

    if (range.from || range.to) {
      const timestamp: Record<string, Date> = {};
      if (range.from) timestamp['gte'] = range.from;
      if (range.to) timestamp['lte'] = range.to;
      where['timestamp'] = timestamp;
    }

    const [totals, byType, byVehicle] = await Promise.all([
      prisma.fuelRecord.aggregate({
        where,
        _sum: { liters: true, totalCost: true },
      }),
      prisma.fuelRecord.groupBy({
        by: ['type'],
        where,
        _sum: { liters: true, totalCost: true },
      }),
      prisma.fuelRecord.groupBy({
        by: ['vehicleId'],
        where,
        _sum: { liters: true, totalCost: true },
      }),
    ]);

    return {
      totalLiters: totals._sum.liters ?? 0,
      totalCost: totals._sum.totalCost ?? 0,
      byType: byType.map((t) => ({
        type: t.type,
        liters: t._sum.liters ?? 0,
        cost: t._sum.totalCost ?? 0,
      })),
      byVehicle: byVehicle.map((v) => ({
        vehicleId: v.vehicleId,
        liters: v._sum.liters ?? 0,
        cost: v._sum.totalCost ?? 0,
      })),
    };
  }

  /**
   * Détecte les chutes de carburant suspectes. Pour chaque véhicule de l'org,
   * parcourt les positions GPS (niveau de carburant renseigné) et signale toute
   * baisse > 15 litres entre deux positions consécutives séparées de moins de
   * 15 minutes. Inclut aussi les FuelRecord marqués THEFT_SUSPECTED.
   * Ne persiste rien.
   */
  async getTheftDetection(orgId: string, range: DateRange) {
    const DROP_THRESHOLD_L = 15;
    const WINDOW_MS = 15 * 60 * 1000;

    const from =
      range.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = range.to ?? new Date();

    const suspicions: Array<{
      vehicleId: string;
      timestamp: Date;
      dropLiters: number;
      latitude: number | null;
      longitude: number | null;
      type: 'LEVEL_DROP' | 'FLAGGED_RECORD';
    }> = [];

    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });

    for (const vehicle of vehicles) {
      const positions = await prisma.gpsPosition.findMany({
        where: {
          organizationId: orgId,
          vehicleId: vehicle.id,
          fuelLevelL: { not: null },
          timestamp: { gte: from, lte: to },
        },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true, latitude: true, longitude: true, fuelLevelL: true },
      });

      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const curr = positions[i];
        if (!prev || !curr) continue;

        const prevLevel = prev.fuelLevelL;
        const currLevel = curr.fuelLevelL;
        if (prevLevel === null || currLevel === null) continue;

        const drop = prevLevel - currLevel;
        const deltaMs = curr.timestamp.getTime() - prev.timestamp.getTime();

        if (drop > DROP_THRESHOLD_L && deltaMs > 0 && deltaMs < WINDOW_MS) {
          suspicions.push({
            vehicleId: vehicle.id,
            timestamp: curr.timestamp,
            dropLiters: Math.round(drop * 100) / 100,
            latitude: curr.latitude,
            longitude: curr.longitude,
            type: 'LEVEL_DROP',
          });
        }
      }
    }

    const flaggedRecords = await prisma.fuelRecord.findMany({
      where: {
        organizationId: orgId,
        type: FuelRecordType.THEFT_SUSPECTED,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: 'desc' },
      select: {
        vehicleId: true,
        timestamp: true,
        liters: true,
        latitude: true,
        longitude: true,
      },
    });

    for (const record of flaggedRecords) {
      suspicions.push({
        vehicleId: record.vehicleId,
        timestamp: record.timestamp,
        dropLiters: Math.round(record.liters * 100) / 100,
        latitude: record.latitude,
        longitude: record.longitude,
        type: 'FLAGGED_RECORD',
      });
    }

    suspicions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return suspicions;
  }
}

export default new FuelService();
