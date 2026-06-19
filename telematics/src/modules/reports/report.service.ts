import { prisma } from '../../config/database';
import { MaintenanceStatus, Prisma, ReportType } from '@prisma/client';
import analyticsService from '../analytics/analytics.service';
import { parsePagination } from '../../shared/utils/pagination';
import { GenerateReportInput } from './report.schemas';

/**
 * Sérialise un objet de rapport en valeur JSON compatible Prisma.
 * Le round-trip JSON convertit les `Date` en chaînes ISO, ce qui rend la
 * structure réellement assignable à `Prisma.InputJsonValue`.
 */
function toReportJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

interface Period {
  start?: Date;
  end?: Date;
}

const REPORT_TITLES: Record<ReportType, string> = {
  [ReportType.DRIVER_BEHAVIOR]: 'Rapport comportement conducteurs',
  [ReportType.FUEL]: 'Rapport carburant',
  [ReportType.FLEET_UTILIZATION]: 'Rapport utilisation de la flotte',
  [ReportType.TRIP]: 'Rapport trajets',
  [ReportType.SAFETY]: 'Rapport sécurité',
  [ReportType.MAINTENANCE]: 'Rapport maintenance',
  [ReportType.EXECUTIVE]: 'Rapport exécutif',
};

export class ReportService {
  async findAll(orgId: string, query: Record<string, unknown>, filters?: { type?: ReportType }) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };
    if (filters?.type) {
      where['type'] = filters.type;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          generatedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return { reports, total, page, limit };
  }

  async findById(orgId: string, id: string) {
    const report = await prisma.report.findFirst({
      where: { id, organizationId: orgId },
      include: {
        generatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!report) {
      const error = new Error('Report not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return report;
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.report.delete({ where: { id } });
  }

  /** Construit le filtre de dates Prisma pour un champ donné. */
  private dateFilter(field: string, period: Period): Record<string, unknown> {
    if (period.start && period.end) {
      return { [field]: { gte: period.start, lte: period.end } };
    }
    if (period.start) {
      return { [field]: { gte: period.start } };
    }
    if (period.end) {
      return { [field]: { lte: period.end } };
    }
    return {};
  }

  // ─── Assemblage des données par type ────────────────────────────────────────

  private async buildDriverBehaviorData(orgId: string, period: Period) {
    const ranking = await analyticsService.getDriverScores(orgId, period.start, period.end);

    const eventsByType = await prisma.drivingEvent.groupBy({
      by: ['type'],
      where: {
        organizationId: orgId,
        ...this.dateFilter('timestamp', { start: ranking.from, end: ranking.to }),
      },
      _count: { _all: true },
    });

    return {
      reportType: ReportType.DRIVER_BEHAVIOR,
      period: { start: ranking.from, end: ranking.to },
      summary: {
        driverCount: ranking.drivers.length,
        avgScore:
          ranking.drivers.length > 0
            ? Math.round(
                (ranking.drivers.reduce((s, d) => s + d.score, 0) / ranking.drivers.length) * 10,
              ) / 10
            : 0,
        totalEventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count._all })),
      },
      ranking: ranking.drivers,
    };
  }

  private async buildFuelData(orgId: string, period: Period) {
    const filter = this.dateFilter('timestamp', period);

    const [totals, byVehicle, vehicles] = await Promise.all([
      prisma.fuelRecord.aggregate({
        where: { organizationId: orgId, ...filter },
        _sum: { liters: true, totalCost: true },
      }),
      prisma.fuelRecord.groupBy({
        by: ['vehicleId'],
        where: { organizationId: orgId, ...filter },
        _sum: { liters: true, totalCost: true },
        orderBy: { _sum: { liters: 'desc' } },
      }),
      prisma.vehicle.findMany({
        where: { organizationId: orgId },
        select: { id: true, plate: true, make: true, model: true, avgConsumptionL100: true },
      }),
    ]);

    const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
    const efficiencies = vehicles
      .map((v) => v.avgConsumptionL100)
      .filter((c): c is number => typeof c === 'number');
    const avgEfficiencyL100 =
      efficiencies.length > 0
        ? Math.round((efficiencies.reduce((s, c) => s + c, 0) / efficiencies.length) * 100) / 100
        : null;

    return {
      reportType: ReportType.FUEL,
      period,
      summary: {
        totalLiters: totals._sum.liters ?? 0,
        totalCost: totals._sum.totalCost ?? 0,
        avgEfficiencyL100,
      },
      byVehicle: byVehicle.map((v) => {
        const vehicle = vehicleMap.get(v.vehicleId);
        return {
          vehicleId: v.vehicleId,
          plate: vehicle?.plate ?? null,
          make: vehicle?.make ?? null,
          model: vehicle?.model ?? null,
          liters: v._sum.liters ?? 0,
          cost: v._sum.totalCost ?? 0,
        };
      }),
    };
  }

  private async buildFleetUtilizationData(orgId: string, period: Period) {
    const utilization = await analyticsService.getFleetUtilization(orgId, period.start, period.end);

    const totalDistance = utilization.vehicles.reduce((s, v) => s + v.distanceKm, 0);
    const totalTrips = utilization.vehicles.reduce((s, v) => s + v.tripCount, 0);
    const activeVehicles = utilization.vehicles.filter((v) => v.tripCount > 0).length;

    return {
      reportType: ReportType.FLEET_UTILIZATION,
      period: { start: utilization.from, end: utilization.to },
      summary: {
        vehicleCount: utilization.vehicles.length,
        activeVehicles,
        utilizationRate:
          utilization.vehicles.length > 0
            ? Math.round((activeVehicles / utilization.vehicles.length) * 1000) / 10
            : 0,
        totalDistanceKm: totalDistance,
        totalTrips,
      },
      byVehicle: utilization.vehicles.map((v) => ({
        vehicleId: v.vehicle.id,
        plate: v.vehicle.plate,
        make: v.vehicle.make,
        model: v.vehicle.model,
        tripCount: v.tripCount,
        distanceKm: v.distanceKm,
        activeDays: v.activeDays,
        idleTimeS: v.idleTimeS,
      })),
    };
  }

  private async buildTripData(orgId: string, period: Period, vehicleId?: string, driverId?: string) {
    const where: Record<string, unknown> = {
      organizationId: orgId,
      ...this.dateFilter('startTime', period),
    };
    if (vehicleId) where['vehicleId'] = vehicleId;
    if (driverId) where['driverId'] = driverId;

    const [trips, agg, byStatus] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: { startTime: 'desc' },
        take: 500,
        include: {
          vehicle: { select: { id: true, plate: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.trip.aggregate({
        where,
        _sum: { distanceKm: true, durationS: true, idleTimeS: true, harshEvents: true },
        _count: { _all: true },
      }),
      prisma.trip.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    return {
      reportType: ReportType.TRIP,
      period,
      summary: {
        totalTrips: agg._count._all,
        totalDistanceKm: agg._sum.distanceKm ?? 0,
        totalDurationS: agg._sum.durationS ?? 0,
        totalIdleTimeS: agg._sum.idleTimeS ?? 0,
        totalHarshEvents: agg._sum.harshEvents ?? 0,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      },
      trips: trips.map((t) => ({
        id: t.id,
        vehiclePlate: t.vehicle.plate,
        driver: t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : null,
        startTime: t.startTime,
        endTime: t.endTime,
        distanceKm: t.distanceKm,
        durationS: t.durationS,
        avgSpeedKmh: t.avgSpeedKmh,
        maxSpeedKmh: t.maxSpeedKmh,
        harshEvents: t.harshEvents,
        status: t.status,
      })),
    };
  }

  private async buildSafetyData(orgId: string, period: Period) {
    const eventFilter = this.dateFilter('timestamp', period);
    const alertFilter = this.dateFilter('timestamp', period);

    const [eventsByType, eventsBySeverity, alertsByType, alertsBySeverity, alertsByStatus] =
      await Promise.all([
        prisma.drivingEvent.groupBy({
          by: ['type'],
          where: { organizationId: orgId, ...eventFilter },
          _count: { _all: true },
        }),
        prisma.drivingEvent.groupBy({
          by: ['severity'],
          where: { organizationId: orgId, ...eventFilter },
          _count: { _all: true },
        }),
        prisma.alert.groupBy({
          by: ['type'],
          where: { organizationId: orgId, ...alertFilter },
          _count: { _all: true },
        }),
        prisma.alert.groupBy({
          by: ['severity'],
          where: { organizationId: orgId, ...alertFilter },
          _count: { _all: true },
        }),
        prisma.alert.groupBy({
          by: ['status'],
          where: { organizationId: orgId, ...alertFilter },
          _count: { _all: true },
        }),
      ]);

    return {
      reportType: ReportType.SAFETY,
      period,
      summary: {
        totalEvents: eventsByType.reduce((s, e) => s + e._count._all, 0),
        totalAlerts: alertsByType.reduce((s, a) => s + a._count._all, 0),
      },
      events: {
        byType: eventsByType.map((e) => ({ type: e.type, count: e._count._all })),
        bySeverity: eventsBySeverity.map((e) => ({ severity: e.severity, count: e._count._all })),
      },
      alerts: {
        byType: alertsByType.map((a) => ({ type: a.type, count: a._count._all })),
        bySeverity: alertsBySeverity.map((a) => ({ severity: a.severity, count: a._count._all })),
        byStatus: alertsByStatus.map((a) => ({ status: a.status, count: a._count._all })),
      },
    };
  }

  private async buildMaintenanceData(orgId: string, period: Period) {
    const now = new Date();

    const [byStatus, costAgg, upcoming, overdue] = await Promise.all([
      prisma.maintenance.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      prisma.maintenance.aggregate({
        where: {
          organizationId: orgId,
          status: MaintenanceStatus.COMPLETED,
          ...this.dateFilter('completedDate', period),
        },
        _sum: { cost: true },
      }),
      prisma.maintenance.findMany({
        where: {
          organizationId: orgId,
          status: MaintenanceStatus.SCHEDULED,
          scheduledDate: { gte: now },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 100,
        include: { vehicle: { select: { id: true, plate: true } } },
      }),
      prisma.maintenance.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { status: MaintenanceStatus.OVERDUE },
            {
              status: MaintenanceStatus.SCHEDULED,
              scheduledDate: { lt: now },
            },
          ],
        },
        orderBy: { scheduledDate: 'asc' },
        take: 100,
        include: { vehicle: { select: { id: true, plate: true } } },
      }),
    ]);

    const mapItem = (m: {
      id: string;
      type: string;
      status: MaintenanceStatus;
      scheduledDate: Date | null;
      cost: number | null;
      vehicle: { id: string; plate: string };
    }) => ({
      id: m.id,
      type: m.type,
      status: m.status,
      scheduledDate: m.scheduledDate,
      cost: m.cost,
      vehiclePlate: m.vehicle.plate,
    });

    return {
      reportType: ReportType.MAINTENANCE,
      period,
      summary: {
        totalCost: costAgg._sum.cost ?? 0,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
        upcomingCount: upcoming.length,
        overdueCount: overdue.length,
      },
      upcoming: upcoming.map(mapItem),
      overdue: overdue.map(mapItem),
    };
  }

  private async buildExecutiveData(orgId: string, period: Period) {
    const [dashboard, fuel, utilization, safety, maintenance, scores] = await Promise.all([
      analyticsService.getDashboard(orgId),
      this.buildFuelData(orgId, period),
      this.buildFleetUtilizationData(orgId, period),
      this.buildSafetyData(orgId, period),
      this.buildMaintenanceData(orgId, period),
      analyticsService.getDriverScores(orgId, period.start, period.end),
    ]);

    return {
      reportType: ReportType.EXECUTIVE,
      period,
      kpis: {
        totalVehicles: dashboard.vehicles.total,
        activeTrips: dashboard.activeTrips,
        openAlerts: dashboard.alerts.open,
        avgDriverScore: dashboard.avgDriverScore,
        fuelCostThisMonth: dashboard.fuelCostThisMonth,
        totalFuelLiters: fuel.summary.totalLiters,
        totalFuelCost: fuel.summary.totalCost,
        fleetUtilizationRate: utilization.summary.utilizationRate,
        totalDistanceKm: utilization.summary.totalDistanceKm,
        totalTrips: utilization.summary.totalTrips,
        totalSafetyEvents: safety.summary.totalEvents,
        totalAlerts: safety.summary.totalAlerts,
        maintenanceUpcoming: maintenance.summary.upcomingCount,
        maintenanceOverdue: maintenance.summary.overdueCount,
        maintenanceCost: maintenance.summary.totalCost,
      },
      topDrivers: scores.drivers.slice(0, 5),
      worstDrivers: scores.drivers.slice(-5).reverse(),
    };
  }

  /**
   * Génère un rapport : assemble les données selon le type, persiste un
   * `Report` et le renvoie.
   */
  async generate(orgId: string, input: GenerateReportInput, generatedById: string | null) {
    const period: Period = {
      start: input.periodStart ? new Date(input.periodStart) : undefined,
      end: input.periodEnd ? new Date(input.periodEnd) : undefined,
    };

    let data: unknown;
    switch (input.type) {
      case ReportType.DRIVER_BEHAVIOR:
        data = await this.buildDriverBehaviorData(orgId, period);
        break;
      case ReportType.FUEL:
        data = await this.buildFuelData(orgId, period);
        break;
      case ReportType.FLEET_UTILIZATION:
        data = await this.buildFleetUtilizationData(orgId, period);
        break;
      case ReportType.TRIP:
        data = await this.buildTripData(orgId, period, input.vehicleId, input.driverId);
        break;
      case ReportType.SAFETY:
        data = await this.buildSafetyData(orgId, period);
        break;
      case ReportType.MAINTENANCE:
        data = await this.buildMaintenanceData(orgId, period);
        break;
      case ReportType.EXECUTIVE:
        data = await this.buildExecutiveData(orgId, period);
        break;
      default: {
        const error = new Error(`Unsupported report type: ${String(input.type)}`);
        Object.assign(error, { statusCode: 400 });
        throw error;
      }
    }

    const datePart = new Date().toISOString().split('T')[0];
    return prisma.report.create({
      data: {
        organizationId: orgId,
        type: input.type,
        title: `${REPORT_TITLES[input.type]} - ${datePart}`,
        periodStart: period.start ?? null,
        periodEnd: period.end ?? null,
        generatedById,
        data: toReportJson(data),
      },
    });
  }
}

export default new ReportService();
