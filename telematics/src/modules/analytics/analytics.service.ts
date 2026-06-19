import { prisma } from '../../config/database';
import {
  AlertStatus,
  EventType,
  EventSeverity,
  TripStatus,
  VehicleStatus,
} from '@prisma/client';

/**
 * Pénalité de base par type d'événement de conduite.
 * Plus le type est dangereux, plus la pénalité est élevée.
 */
const EVENT_TYPE_WEIGHT: Record<EventType, number> = {
  [EventType.SPEEDING]: 2,
  [EventType.HARSH_BRAKING]: 3,
  [EventType.HARSH_ACCELERATION]: 2,
  [EventType.HARSH_CORNERING]: 2,
  [EventType.EXCESSIVE_IDLING]: 1,
  [EventType.PHONE_USE]: 5,
  [EventType.FATIGUE_DRIVING]: 5,
  [EventType.NO_SEATBELT]: 3,
};

/** Multiplicateur appliqué à la pénalité de base selon la sévérité. */
const SEVERITY_MULTIPLIER: Record<EventSeverity, number> = {
  [EventSeverity.LOW]: 0.5,
  [EventSeverity.MEDIUM]: 1,
  [EventSeverity.HIGH]: 1.5,
  [EventSeverity.CRITICAL]: 2,
};

/** Les types d'événements considérés comme « conduite brusque ». */
const HARSH_EVENT_TYPES: EventType[] = [
  EventType.HARSH_BRAKING,
  EventType.HARSH_ACCELERATION,
  EventType.HARSH_CORNERING,
];

interface EventGroupRow {
  type: EventType;
  severity: EventSeverity;
  count: number;
}

interface DriverScoreResult {
  score: number;
  distanceKm: number;
  tripCount: number;
  /** Nombre d'événements par type sur la période. */
  eventBreakdown: Record<EventType, number>;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultRange(from?: Date, to?: Date): { from: Date; to: Date } {
  const end = to ?? new Date();
  const start = from ?? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: start, to: end };
}

function emptyEventBreakdown(): Record<EventType, number> {
  return {
    [EventType.HARSH_BRAKING]: 0,
    [EventType.HARSH_ACCELERATION]: 0,
    [EventType.HARSH_CORNERING]: 0,
    [EventType.SPEEDING]: 0,
    [EventType.EXCESSIVE_IDLING]: 0,
    [EventType.FATIGUE_DRIVING]: 0,
    [EventType.PHONE_USE]: 0,
    [EventType.NO_SEATBELT]: 0,
  };
}

export class AnalyticsService {
  /**
   * Calcule le score de conduite d'un conducteur sur une période.
   *
   * Formule :
   *   score = 100 - (penaltyPer100), borné à [0, 100]
   * où :
   *   totalPondéré = Σ ( poids(type) × multiplicateur(sévérité) × nbEvénements )
   *   distanceKm   = Σ Trip.distanceKm du conducteur sur la période (min 1 km)
   *   penaltyPer100 = totalPondéré / (distanceKm / 100)
   *
   * La distance minimale de 1 km évite la division par zéro lorsqu'un
   * conducteur a des événements mais aucun trajet enregistré.
   */
  private async computeDriverScore(
    orgId: string,
    driverId: string,
    from: Date,
    to: Date,
  ): Promise<DriverScoreResult> {
    const [eventGroups, distanceAgg, tripCount] = await Promise.all([
      prisma.drivingEvent.groupBy({
        by: ['type', 'severity'],
        where: { organizationId: orgId, driverId, timestamp: { gte: from, lte: to } },
        _count: { _all: true },
      }),
      prisma.trip.aggregate({
        where: { organizationId: orgId, driverId, startTime: { gte: from, lte: to } },
        _sum: { distanceKm: true },
      }),
      prisma.trip.count({
        where: { organizationId: orgId, driverId, startTime: { gte: from, lte: to } },
      }),
    ]);

    const rows: EventGroupRow[] = eventGroups.map((g) => ({
      type: g.type,
      severity: g.severity,
      count: g._count._all,
    }));

    const eventBreakdown = emptyEventBreakdown();
    let weightedTotal = 0;
    for (const row of rows) {
      eventBreakdown[row.type] += row.count;
      weightedTotal += EVENT_TYPE_WEIGHT[row.type] * SEVERITY_MULTIPLIER[row.severity] * row.count;
    }

    const distanceKm = Math.max(distanceAgg._sum.distanceKm ?? 0, 1);
    const penaltyPer100 = weightedTotal / (distanceKm / 100);
    const score = Math.max(0, Math.min(100, 100 - penaltyPer100));

    return {
      score: Math.round(score * 10) / 10,
      distanceKm: distanceAgg._sum.distanceKm ?? 0,
      tripCount,
      eventBreakdown,
    };
  }

  /** Vue d'ensemble de la flotte de l'organisation. */
  async getDashboard(orgId: string) {
    const todayStart = startOfToday();
    const monthStart = startOfMonth();

    const [
      vehiclesByStatus,
      vehicleTotal,
      activeTrips,
      alertsBySeverity,
      openAlerts,
      distanceTodayAgg,
      fuelCostAgg,
      avgScoreAgg,
      harshEventsToday,
    ] = await Promise.all([
      prisma.vehicle.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      prisma.vehicle.count({ where: { organizationId: orgId } }),
      prisma.trip.count({ where: { organizationId: orgId, status: TripStatus.ONGOING } }),
      prisma.alert.groupBy({
        by: ['severity'],
        where: { organizationId: orgId, status: AlertStatus.OPEN },
        _count: { _all: true },
      }),
      prisma.alert.count({ where: { organizationId: orgId, status: AlertStatus.OPEN } }),
      prisma.trip.aggregate({
        where: { organizationId: orgId, startTime: { gte: todayStart } },
        _sum: { distanceKm: true },
      }),
      prisma.fuelRecord.aggregate({
        where: { organizationId: orgId, timestamp: { gte: monthStart } },
        _sum: { totalCost: true },
      }),
      prisma.driver.aggregate({
        where: { organizationId: orgId },
        _avg: { behaviorScore: true },
      }),
      prisma.drivingEvent.count({
        where: {
          organizationId: orgId,
          type: { in: HARSH_EVENT_TYPES },
          timestamp: { gte: todayStart },
        },
      }),
    ]);

    const byStatus = Object.fromEntries(
      Object.values(VehicleStatus).map((s) => [s, 0]),
    ) as Record<VehicleStatus, number>;
    for (const row of vehiclesByStatus) {
      byStatus[row.status] = row._count._all;
    }

    const bySeverity = Object.fromEntries(
      alertsBySeverity.map((row) => [row.severity, row._count._all]),
    );

    return {
      vehicles: { total: vehicleTotal, byStatus },
      activeTrips,
      alerts: { open: openAlerts, bySeverity },
      distanceTodayKm: distanceTodayAgg._sum.distanceKm ?? 0,
      fuelCostThisMonth: fuelCostAgg._sum.totalCost ?? 0,
      avgDriverScore: Math.round((avgScoreAgg._avg.behaviorScore ?? 0) * 10) / 10,
      harshEventsToday,
    };
  }

  /** Classement des conducteurs par score sur la période (défaut : 30 jours). */
  async getDriverScores(orgId: string, fromArg?: Date, toArg?: Date) {
    const { from, to } = defaultRange(fromArg, toArg);

    const drivers = await prisma.driver.findMany({
      where: { organizationId: orgId },
      select: { id: true, firstName: true, lastName: true, status: true },
    });

    const ranking = await Promise.all(
      drivers.map(async (driver) => {
        const result = await this.computeDriverScore(orgId, driver.id, from, to);
        return {
          driverId: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          status: driver.status,
          score: result.score,
          distanceKm: result.distanceKm,
          tripCount: result.tripCount,
          eventBreakdown: result.eventBreakdown,
        };
      }),
    );

    ranking.sort((a, b) => b.score - a.score);

    return { from, to, drivers: ranking };
  }

  /** Détail comportemental d'un conducteur. */
  async getDriverBehavior(orgId: string, driverId: string, fromArg?: Date, toArg?: Date) {
    const { from, to } = defaultRange(fromArg, toArg);

    const driver = await prisma.driver.findFirst({
      where: { id: driverId, organizationId: orgId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        behaviorScore: true,
      },
    });

    if (!driver) {
      const error = new Error('Driver not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const [eventsByType, trend, recentTrips, current] = await Promise.all([
      prisma.drivingEvent.groupBy({
        by: ['type'],
        where: { organizationId: orgId, driverId, timestamp: { gte: from, lte: to } },
        _count: { _all: true },
      }),
      prisma.driverScore.findMany({
        where: { organizationId: orgId, driverId },
        orderBy: { periodStart: 'asc' },
      }),
      prisma.trip.findMany({
        where: { organizationId: orgId, driverId },
        orderBy: { startTime: 'desc' },
        take: 10,
        include: { vehicle: { select: { id: true, plate: true, make: true, model: true } } },
      }),
      this.computeDriverScore(orgId, driverId, from, to),
    ]);

    return {
      driver,
      from,
      to,
      currentScore: current.score,
      eventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count._all })),
      trend,
      recentTrips,
    };
  }

  /** Tendance de consommation carburant de la flotte. */
  async getFuelConsumption(orgId: string, fromArg?: Date, toArg?: Date) {
    const { from, to } = defaultRange(fromArg, toArg);

    const [records, byVehicle] = await Promise.all([
      prisma.fuelRecord.findMany({
        where: { organizationId: orgId, timestamp: { gte: from, lte: to } },
        select: { timestamp: true, liters: true, totalCost: true },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.fuelRecord.groupBy({
        by: ['vehicleId'],
        where: { organizationId: orgId, timestamp: { gte: from, lte: to } },
        _sum: { liters: true, totalCost: true },
        orderBy: { _sum: { liters: 'desc' } },
        take: 10,
      }),
    ]);

    // Agrégation mensuelle (YYYY-MM) en mémoire.
    const monthly = new Map<string, { liters: number; cost: number }>();
    for (const r of records) {
      const key = `${r.timestamp.getUTCFullYear()}-${String(
        r.timestamp.getUTCMonth() + 1,
      ).padStart(2, '0')}`;
      const bucket = monthly.get(key) ?? { liters: 0, cost: 0 };
      bucket.liters += r.liters;
      bucket.cost += r.totalCost ?? 0;
      monthly.set(key, bucket);
    }

    const byMonth = [...monthly.entries()]
      .map(([month, v]) => ({ month, liters: v.liters, cost: v.cost }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const vehicleIds = byVehicle.map((v) => v.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, plate: true, make: true, model: true },
    });
    const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

    const topConsumers = byVehicle.map((v) => ({
      vehicleId: v.vehicleId,
      vehicle: vehicleMap.get(v.vehicleId) ?? null,
      liters: v._sum.liters ?? 0,
      cost: v._sum.totalCost ?? 0,
    }));

    return { from, to, byMonth, topConsumers };
  }

  /** Taux d'utilisation par véhicule. */
  async getFleetUtilization(orgId: string, fromArg?: Date, toArg?: Date) {
    const { from, to } = defaultRange(fromArg, toArg);

    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: orgId },
      select: { id: true, plate: true, make: true, model: true, status: true },
    });

    const utilization = await Promise.all(
      vehicles.map(async (vehicle) => {
        const [agg, trips] = await Promise.all([
          prisma.trip.aggregate({
            where: {
              organizationId: orgId,
              vehicleId: vehicle.id,
              startTime: { gte: from, lte: to },
            },
            _sum: { distanceKm: true, idleTimeS: true },
            _count: { _all: true },
          }),
          prisma.trip.findMany({
            where: {
              organizationId: orgId,
              vehicleId: vehicle.id,
              startTime: { gte: from, lte: to },
            },
            select: { startTime: true },
          }),
        ]);

        const activeDays = new Set(
          trips.map((t) => t.startTime.toISOString().slice(0, 10)),
        ).size;

        return {
          vehicle,
          tripCount: agg._count._all,
          distanceKm: agg._sum.distanceKm ?? 0,
          activeDays,
          idleTimeS: agg._sum.idleTimeS ?? 0,
        };
      }),
    );

    return { from, to, vehicles: utilization };
  }

  /**
   * Recalcule le score d'un conducteur sur la période, persiste un snapshot
   * `DriverScore` (upsert sur driverId+periodStart+periodEnd) et met à jour
   * `Driver.behaviorScore`.
   */
  async recomputeDriverScore(orgId: string, driverId: string, fromArg?: Date, toArg?: Date) {
    const { from, to } = defaultRange(fromArg, toArg);

    const driver = await prisma.driver.findFirst({
      where: { id: driverId, organizationId: orgId },
      select: { id: true },
    });

    if (!driver) {
      const error = new Error('Driver not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const result = await this.computeDriverScore(orgId, driverId, from, to);
    const { eventBreakdown } = result;

    const snapshot = await prisma.driverScore.upsert({
      where: {
        driverId_periodStart_periodEnd: {
          driverId,
          periodStart: from,
          periodEnd: to,
        },
      },
      create: {
        organizationId: orgId,
        driverId,
        periodStart: from,
        periodEnd: to,
        score: result.score,
        distanceKm: result.distanceKm,
        tripCount: result.tripCount,
        harshBraking: eventBreakdown[EventType.HARSH_BRAKING],
        harshAcceleration: eventBreakdown[EventType.HARSH_ACCELERATION],
        harshCornering: eventBreakdown[EventType.HARSH_CORNERING],
        speedingCount: eventBreakdown[EventType.SPEEDING],
        idlingCount: eventBreakdown[EventType.EXCESSIVE_IDLING],
      },
      update: {
        score: result.score,
        distanceKm: result.distanceKm,
        tripCount: result.tripCount,
        harshBraking: eventBreakdown[EventType.HARSH_BRAKING],
        harshAcceleration: eventBreakdown[EventType.HARSH_ACCELERATION],
        harshCornering: eventBreakdown[EventType.HARSH_CORNERING],
        speedingCount: eventBreakdown[EventType.SPEEDING],
        idlingCount: eventBreakdown[EventType.EXCESSIVE_IDLING],
      },
    });

    await prisma.driver.update({
      where: { id: driverId },
      data: { behaviorScore: result.score },
    });

    return snapshot;
  }
}

export default new AnalyticsService();
