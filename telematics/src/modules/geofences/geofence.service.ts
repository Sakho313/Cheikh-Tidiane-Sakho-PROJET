import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { Prisma, GeofenceCategory } from '@prisma/client';
import { CreateGeofenceInput, UpdateGeofenceInput } from './geofence.schemas';

export class GeofenceService {
  async findAll(
    orgId: string,
    filters?: {
      category?: GeofenceCategory;
      isActive?: boolean;
    },
  ) {
    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.category) {
      where['category'] = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where['isActive'] = filters.isActive;
    }

    return prisma.geofence.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(orgId: string, id: string) {
    const geofence = await prisma.geofence.findFirst({
      where: { id, organizationId: orgId },
      include: { _count: { select: { events: true } } },
    });

    if (!geofence) {
      const error = new Error('Geofence not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return geofence;
  }

  async create(orgId: string, data: CreateGeofenceInput) {
    return prisma.geofence.create({
      data: {
        organizationId: orgId,
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        category: data.category,
        centerLat: data.centerLat ?? null,
        centerLng: data.centerLng ?? null,
        radiusM: data.radiusM ?? null,
        polygon: data.polygon ?? Prisma.JsonNull,
        color: data.color,
        isActive: data.isActive,
      },
    });
  }

  async update(orgId: string, id: string, data: UpdateGeofenceInput) {
    await this.findById(orgId, id);

    const { polygon, ...rest } = data;
    const updateData: Prisma.GeofenceUpdateInput = { ...rest };
    if (polygon !== undefined) {
      updateData.polygon = polygon;
    }

    return prisma.geofence.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.geofence.delete({ where: { id } });
  }

  async getEvents(orgId: string, id: string, query: Record<string, unknown>) {
    await this.findById(orgId, id);

    const { page, limit, skip } = parsePagination(query);

    const where = { organizationId: orgId, geofenceId: id };

    const [events, total] = await Promise.all([
      prisma.geofenceEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          vehicle: { select: { id: true, plate: true } },
        },
      }),
      prisma.geofenceEvent.count({ where }),
    ]);

    return { events, total, page, limit };
  }
}

export default new GeofenceService();
