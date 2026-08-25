import { TripStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { pathDistanceKm } from '../../shared/utils/geo';
import { UpdateTripInput } from './trip.schemas';

/** Seuil de vitesse (km/h) en dessous duquel le véhicule est considéré à l'arrêt. */
const IDLE_SPEED_KMH = 3;

export class TripService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      vehicleId?: string;
      driverId?: string;
      status?: TripStatus;
    },
  ) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };
    if (filters?.vehicleId) where['vehicleId'] = filters.vehicleId;
    if (filters?.driverId) where['driverId'] = filters.driverId;
    if (filters?.status) where['status'] = filters.status;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          vehicle: { select: { id: true, plate: true, make: true, model: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    return { trips, total, page, limit };
  }

  async findById(orgId: string, id: string) {
    const trip = await prisma.trip.findFirst({
      where: { id, organizationId: orgId },
      include: {
        vehicle: { select: { id: true, plate: true, make: true, model: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { positions: true, events: true } },
      },
    });

    if (!trip) {
      const error = new Error('Trip not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return trip;
  }

  async getPositions(orgId: string, id: string) {
    await this.findById(orgId, id);
    return prisma.gpsPosition.findMany({
      where: { organizationId: orgId, tripId: id },
      orderBy: { timestamp: 'asc' },
    });
  }

  /** Trace GeoJSON (LineString) du trajet, ordonnée par timestamp. */
  async getTrack(orgId: string, id: string) {
    await this.findById(orgId, id);
    const positions = await prisma.gpsPosition.findMany({
      where: { organizationId: orgId, tripId: id },
      orderBy: { timestamp: 'asc' },
      select: { latitude: true, longitude: true },
    });

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: positions.map((p) => [p.longitude, p.latitude]),
      },
      properties: { tripId: id },
    };
  }

  async update(orgId: string, id: string, data: UpdateTripInput) {
    await this.findById(orgId, id);

    return prisma.trip.update({
      where: { id },
      data,
      include: {
        vehicle: { select: { id: true, plate: true, make: true, model: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Finalise un trajet : recalcule distance, durée, vitesses, temps d'arrêt et
   * nombre d'événements à partir des positions ordonnées, puis le marque COMPLETED.
   */
  async close(orgId: string, id: string) {
    const trip = await this.findById(orgId, id);

    const positions = await prisma.gpsPosition.findMany({
      where: { organizationId: orgId, tripId: id },
      orderBy: { timestamp: 'asc' },
      select: { latitude: true, longitude: true, speedKmh: true, timestamp: true },
    });

    const distanceKm = pathDistanceKm(positions);

    const lastPosition = positions[positions.length - 1];
    const endTime = trip.endTime ?? lastPosition?.timestamp ?? trip.startTime;
    const durationS = Math.max(
      0,
      Math.round((endTime.getTime() - trip.startTime.getTime()) / 1000),
    );

    const maxSpeedKmh = positions.reduce((max, p) => Math.max(max, p.speedKmh), 0);

    const hours = durationS / 3600;
    const avgSpeedKmh = hours > 0 ? distanceKm / hours : 0;

    // Temps d'arrêt approximé : nombre de points lents × intervalle moyen entre points.
    const idleSamples = positions.filter((p) => p.speedKmh < IDLE_SPEED_KMH).length;
    const avgIntervalS =
      positions.length > 1 ? durationS / (positions.length - 1) : 0;
    const idleTimeS = Math.round(idleSamples * avgIntervalS);

    const harshEvents = await prisma.drivingEvent.count({
      where: { organizationId: orgId, tripId: id },
    });

    const endLat = lastPosition?.latitude ?? trip.endLat ?? null;
    const endLng = lastPosition?.longitude ?? trip.endLng ?? null;

    return prisma.trip.update({
      where: { id },
      data: {
        status: TripStatus.COMPLETED,
        endTime,
        endLat,
        endLng,
        distanceKm,
        durationS,
        maxSpeedKmh,
        avgSpeedKmh,
        idleTimeS,
        harshEvents,
      },
      include: {
        vehicle: { select: { id: true, plate: true, make: true, model: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.trip.delete({ where: { id } });
  }
}

export default new TripService();
