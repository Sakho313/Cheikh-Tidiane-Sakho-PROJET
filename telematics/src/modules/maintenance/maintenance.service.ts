import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { MaintenanceStatus } from '@prisma/client';
import { CreateMaintenanceInput, UpdateMaintenanceInput } from './maintenance.schemas';

export class MaintenanceService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      vehicleId?: string;
      status?: MaintenanceStatus;
    },
  ) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.vehicleId) {
      where['vehicleId'] = filters.vehicleId;
    }

    if (filters?.status) {
      where['status'] = filters.status;
    }

    const [maintenances, total] = await Promise.all([
      prisma.maintenance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { id: true, plate: true, make: true, model: true } },
        },
      }),
      prisma.maintenance.count({ where }),
    ]);

    return { maintenances, total, page, limit };
  }

  async findByVehicle(orgId: string, vehicleId: string, query: Record<string, unknown>) {
    return this.findAll(orgId, query, { vehicleId });
  }

  async findById(orgId: string, id: string) {
    const maintenance = await prisma.maintenance.findFirst({
      where: { id, organizationId: orgId },
      include: {
        vehicle: { select: { id: true, plate: true, make: true, model: true } },
      },
    });

    if (!maintenance) {
      const error = new Error('Maintenance not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return maintenance;
  }

  async create(orgId: string, data: CreateMaintenanceInput) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, organizationId: orgId },
      select: { id: true },
    });

    if (!vehicle) {
      const error = new Error('Vehicle not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return prisma.maintenance.create({
      data: {
        organizationId: orgId,
        vehicleId: data.vehicleId,
        type: data.type,
        status: data.status,
        description: data.description,
        scheduledDate: data.scheduledDate,
        completedDate: data.completedDate,
        dueOdometerKm: data.dueOdometerKm,
        cost: data.cost,
        currency: data.currency,
        vendor: data.vendor,
        notes: data.notes,
      },
      include: {
        vehicle: { select: { id: true, plate: true, make: true, model: true } },
      },
    });
  }

  async update(orgId: string, id: string, data: UpdateMaintenanceInput) {
    await this.findById(orgId, id);

    return prisma.maintenance.update({
      where: { id },
      data,
      include: {
        vehicle: { select: { id: true, plate: true, make: true, model: true } },
      },
    });
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.maintenance.delete({ where: { id } });
  }
}

export default new MaintenanceService();
