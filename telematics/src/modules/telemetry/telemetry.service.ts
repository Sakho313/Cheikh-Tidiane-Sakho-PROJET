import {
  AlertSeverity,
  AlertType,
  EventSeverity,
  EventType,
  GeofenceCategory,
  GeofenceEventType,
  GeofenceType,
  Prisma,
  TripStatus,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { parsePagination } from '../../shared/utils/pagination';
import {
  isPointInCircle,
  isPointInPolygon,
} from '../../shared/utils/geo';
import {
  emitAlert,
  emitDrivingEvent,
  emitGeofenceEvent,
  emitVehiclePosition,
} from '../../realtime/socket';
import { PositionInput } from './telemetry.schemas';

/** Écart maximal (ms) entre deux positions avant de clôturer le trajet courant. */
const TRIP_GAP_MS = 5 * 60 * 1000;
/** Seuil d'accélération franche (m/s²). */
const HARSH_ACCEL_MS2 = 3;
/** Seuil de freinage franc (m/s²). */
const HARSH_BRAKE_MS2 = -3.5;
/** Delta de temps plausible entre deux positions pour calculer une accélération (s). */
const MIN_DELTA_S = 0;
const MAX_DELTA_S = 120;

const SEVERITY_MULTIPLIER: Record<EventSeverity, number> = {
  [EventSeverity.LOW]: 0.5,
  [EventSeverity.MEDIUM]: 1,
  [EventSeverity.HIGH]: 1.5,
  [EventSeverity.CRITICAL]: 2,
};

const BASE_PENALTY: Partial<Record<EventType, number>> = {
  [EventType.SPEEDING]: 2,
  [EventType.HARSH_BRAKING]: 3,
  [EventType.HARSH_ACCELERATION]: 2,
};

function penaltyFor(type: EventType, severity: EventSeverity): number {
  const base = BASE_PENALTY[type] ?? 0;
  return Math.round(base * SEVERITY_MULTIPLIER[severity]);
}

interface IngestSummary {
  ingested: number;
  events: number;
  alerts: number;
}

export class TelemetryService {
  /**
   * Ingère une ou plusieurs positions GPS. Pour chaque position : résout le
   * véhicule, rattache un trajet ONGOING (en clôturant/ouvrant selon les gaps),
   * persiste la position, analyse le comportement (vitesse, accélérations),
   * évalue les géofences et émet les événements temps réel.
   */
  async ingest(positions: PositionInput[]): Promise<IngestSummary> {
    let ingested = 0;
    let events = 0;
    let alerts = 0;

    for (const position of positions) {
      const result = await this.ingestOne(position);
      ingested += 1;
      events += result.events;
      alerts += result.alerts;
    }

    return { ingested, events, alerts };
  }

  private async ingestOne(position: PositionInput): Promise<{ events: number; alerts: number }> {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: position.vehicleId } });
    if (!vehicle) {
      const error = new Error('Vehicle not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const organizationId = vehicle.organizationId;
    const timestamp = position.timestamp ?? new Date();
    const speedKmh = position.speedKmh ?? 0;

    // Dernière position connue (avant insertion) pour les deltas et les transitions de géofence.
    const lastPosition = await prisma.gpsPosition.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: 'desc' },
    });

    // Rattachement au trajet courant.
    const trip = await this.resolveTrip(
      organizationId,
      vehicle.id,
      timestamp,
      position.latitude,
      position.longitude,
      lastPosition?.timestamp ?? null,
    );

    // Boîtier éventuellement lié au véhicule.
    const device = await prisma.device.findUnique({ where: { vehicleId: vehicle.id } });

    await prisma.gpsPosition.create({
      data: {
        organizationId,
        vehicleId: vehicle.id,
        tripId: trip.id,
        deviceId: device?.id ?? null,
        timestamp,
        latitude: position.latitude,
        longitude: position.longitude,
        speedKmh,
        heading: position.heading ?? null,
        altitude: position.altitude ?? null,
        ignition: position.ignition ?? null,
        fuelLevelL: position.fuelLevelL ?? null,
        odometerKm: position.odometerKm ?? null,
        satellites: position.satellites ?? null,
      },
    });

    // Mise à jour de l'odomètre véhicule si la valeur fournie progresse.
    if (position.odometerKm !== undefined && position.odometerKm > vehicle.odometerKm) {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { odometerKm: position.odometerKm },
      });
    }

    // Le boîtier a été vu.
    await prisma.device.updateMany({
      where: { vehicleId: vehicle.id },
      data: { lastSeenAt: timestamp },
    });

    // Position temps réel.
    emitVehiclePosition(organizationId, {
      vehicleId: vehicle.id,
      tripId: trip.id,
      timestamp,
      latitude: position.latitude,
      longitude: position.longitude,
      speedKmh,
      heading: position.heading ?? null,
      ignition: position.ignition ?? null,
    });

    let events = 0;
    let alerts = 0;

    const behavior = await this.analyzeBehavior(
      vehicle.id,
      organizationId,
      trip.id,
      trip.driverId,
      timestamp,
      position,
      speedKmh,
      vehicle.maxSpeedKmh,
      lastPosition,
    );
    events += behavior.events;
    alerts += behavior.alerts;

    const geofence = await this.evaluateGeofences(
      organizationId,
      vehicle.id,
      timestamp,
      position,
      lastPosition,
    );
    alerts += geofence.alerts;

    return { events, alerts };
  }

  /** Trouve le trajet ONGOING courant, en clôturant et en rouvrant selon les gaps. */
  private async resolveTrip(
    organizationId: string,
    vehicleId: string,
    timestamp: Date,
    latitude: number,
    longitude: number,
    lastTimestamp: Date | null,
  ) {
    const ongoing = await prisma.trip.findFirst({
      where: { vehicleId, status: TripStatus.ONGOING },
      orderBy: { startTime: 'desc' },
    });

    if (ongoing) {
      const gap =
        lastTimestamp != null ? timestamp.getTime() - lastTimestamp.getTime() : 0;
      if (gap <= TRIP_GAP_MS) {
        return ongoing;
      }
      // Gap trop long : clôturer le trajet courant à la dernière position connue.
      await prisma.trip.update({
        where: { id: ongoing.id },
        data: {
          status: TripStatus.COMPLETED,
          endTime: lastTimestamp ?? ongoing.startTime,
        },
      });
    }

    return prisma.trip.create({
      data: {
        organizationId,
        vehicleId,
        startTime: timestamp,
        startLat: latitude,
        startLng: longitude,
        status: TripStatus.ONGOING,
      },
    });
  }

  /** Détecte excès de vitesse et accélérations/freinages francs ; crée events + alertes. */
  private async analyzeBehavior(
    vehicleId: string,
    organizationId: string,
    tripId: string,
    driverId: string | null,
    timestamp: Date,
    position: PositionInput,
    speedKmh: number,
    maxSpeedKmh: number | null,
    lastPosition: { timestamp: Date; speedKmh: number } | null,
  ): Promise<{ events: number; alerts: number }> {
    let events = 0;
    let alerts = 0;

    // Excès de vitesse.
    const limit = maxSpeedKmh ?? env.DEFAULT_SPEED_LIMIT_KMH;
    if (speedKmh > limit) {
      const over = speedKmh - limit;
      let severity: EventSeverity = EventSeverity.MEDIUM;
      if (over > 40) severity = EventSeverity.CRITICAL;
      else if (over > 20) severity = EventSeverity.HIGH;

      await this.createEvent({
        organizationId,
        vehicleId,
        driverId,
        tripId,
        type: EventType.SPEEDING,
        severity,
        timestamp,
        latitude: position.latitude,
        longitude: position.longitude,
        speedKmh,
        speedLimitKmh: limit,
        value: over,
      });
      events += 1;

      await this.createAlert({
        organizationId,
        vehicleId,
        driverId,
        type: AlertType.SPEEDING,
        severity: this.toAlertSeverity(severity),
        title: 'Excès de vitesse',
        message: `Vitesse ${Math.round(speedKmh)} km/h pour une limite de ${limit} km/h`,
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp,
      });
      alerts += 1;
    }

    // Accélération / freinage francs.
    if (lastPosition) {
      const deltaT = (timestamp.getTime() - lastPosition.timestamp.getTime()) / 1000;
      if (deltaT > MIN_DELTA_S && deltaT < MAX_DELTA_S) {
        const accel = (speedKmh - lastPosition.speedKmh) / 3.6 / deltaT;
        let type: EventType | null = null;
        if (accel > HARSH_ACCEL_MS2) type = EventType.HARSH_ACCELERATION;
        else if (accel < HARSH_BRAKE_MS2) type = EventType.HARSH_BRAKING;

        if (type) {
          const severity =
            Math.abs(accel) > 5 ? EventSeverity.HIGH : EventSeverity.MEDIUM;
          await this.createEvent({
            organizationId,
            vehicleId,
            driverId,
            tripId,
            type,
            severity,
            timestamp,
            latitude: position.latitude,
            longitude: position.longitude,
            speedKmh,
            value: accel,
          });
          events += 1;
        }
      }
    }

    return { events, alerts };
  }

  /** Crée un DrivingEvent (avec points de pénalité dérivés) et l'émet. */
  private async createEvent(data: {
    organizationId: string;
    vehicleId: string;
    driverId: string | null;
    tripId: string;
    type: EventType;
    severity: EventSeverity;
    timestamp: Date;
    latitude: number;
    longitude: number;
    speedKmh: number;
    speedLimitKmh?: number;
    value: number;
  }): Promise<void> {
    const event = await prisma.drivingEvent.create({
      data: {
        organizationId: data.organizationId,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        tripId: data.tripId,
        type: data.type,
        severity: data.severity,
        timestamp: data.timestamp,
        latitude: data.latitude,
        longitude: data.longitude,
        speedKmh: data.speedKmh,
        speedLimitKmh: data.speedLimitKmh ?? null,
        value: data.value,
        penaltyPoints: penaltyFor(data.type, data.severity),
      },
    });
    emitDrivingEvent(data.organizationId, event);
  }

  /** Crée une Alert et l'émet. */
  private async createAlert(data: {
    organizationId: string;
    vehicleId: string;
    driverId: string | null;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message?: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
  }): Promise<void> {
    const alert = await prisma.alert.create({
      data: {
        organizationId: data.organizationId,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        type: data.type,
        severity: data.severity,
        title: data.title,
        message: data.message ?? null,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
      },
    });
    emitAlert(data.organizationId, alert);
  }

  /** Évalue les transitions d'entrée/sortie de géofences pour la position courante. */
  private async evaluateGeofences(
    organizationId: string,
    vehicleId: string,
    timestamp: Date,
    position: PositionInput,
    lastPosition: { latitude: number; longitude: number } | null,
  ): Promise<{ alerts: number }> {
    const geofences = await prisma.geofence.findMany({
      where: { organizationId, isActive: true },
    });

    let alerts = 0;
    const currentPoint = { latitude: position.latitude, longitude: position.longitude };

    for (const geofence of geofences) {
      const inside = this.isInside(geofence, currentPoint);
      const wasInside = lastPosition ? this.isInside(geofence, lastPosition) : false;

      let type: GeofenceEventType | null = null;
      if (inside && !wasInside) type = GeofenceEventType.ENTER;
      else if (!inside && wasInside) type = GeofenceEventType.EXIT;
      if (!type) continue;

      const event = await prisma.geofenceEvent.create({
        data: {
          organizationId,
          geofenceId: geofence.id,
          vehicleId,
          type,
          timestamp,
          latitude: position.latitude,
          longitude: position.longitude,
        },
      });
      emitGeofenceEvent(organizationId, event);

      if (type === GeofenceEventType.ENTER && geofence.category === GeofenceCategory.RESTRICTED) {
        await this.createAlert({
          organizationId,
          vehicleId,
          driverId: null,
          type: AlertType.GEOFENCE_VIOLATION,
          severity: AlertSeverity.HIGH,
          title: 'Entrée en zone interdite',
          message: `Le véhicule est entré dans la zone « ${geofence.name} »`,
          latitude: position.latitude,
          longitude: position.longitude,
          timestamp,
        });
        alerts += 1;
      }
    }

    return { alerts };
  }

  private isInside(
    geofence: {
      type: GeofenceType;
      centerLat: number | null;
      centerLng: number | null;
      radiusM: number | null;
      polygon: Prisma.JsonValue;
    },
    point: { latitude: number; longitude: number },
  ): boolean {
    if (geofence.type === GeofenceType.CIRCLE) {
      if (
        geofence.centerLat == null ||
        geofence.centerLng == null ||
        geofence.radiusM == null
      ) {
        return false;
      }
      return isPointInCircle(point, geofence.centerLat, geofence.centerLng, geofence.radiusM);
    }

    if (!Array.isArray(geofence.polygon)) return false;
    const polygon = geofence.polygon as Array<[number, number]>;
    return isPointInPolygon(point, polygon);
  }

  private toAlertSeverity(severity: EventSeverity): AlertSeverity {
    switch (severity) {
      case EventSeverity.LOW:
        return AlertSeverity.LOW;
      case EventSeverity.HIGH:
        return AlertSeverity.HIGH;
      case EventSeverity.CRITICAL:
        return AlertSeverity.CRITICAL;
      default:
        return AlertSeverity.MEDIUM;
    }
  }

  /** Dernière position connue de chaque véhicule de l'organisation (carte live). */
  async live(orgId: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: orgId },
      select: { id: true, plate: true, make: true, model: true, status: true },
      orderBy: { plate: 'asc' },
    });

    return Promise.all(
      vehicles.map(async (vehicle) => {
        const positionRecord = await prisma.gpsPosition.findFirst({
          where: { organizationId: orgId, vehicleId: vehicle.id },
          orderBy: { timestamp: 'desc' },
        });
        return { vehicle, position: positionRecord };
      }),
    );
  }

  /** Historique paginé des positions d'un véhicule, filtrable par fenêtre temporelle. */
  async vehiclePositions(
    orgId: string,
    vehicleId: string,
    query: Record<string, unknown>,
    filters?: { from?: Date; to?: Date },
  ) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId, vehicleId };
    if (filters?.from || filters?.to) {
      const timestamp: Record<string, Date> = {};
      if (filters.from) timestamp['gte'] = filters.from;
      if (filters.to) timestamp['lte'] = filters.to;
      where['timestamp'] = timestamp;
    }

    const [positions, total] = await Promise.all([
      prisma.gpsPosition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'asc' },
      }),
      prisma.gpsPosition.count({ where }),
    ]);

    return { positions, total, page, limit };
  }
}

export default new TelemetryService();
