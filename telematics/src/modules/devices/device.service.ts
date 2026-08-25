import { prisma } from '../../config/database';
import { parsePagination } from '../../shared/utils/pagination';
import { DeviceStatus } from '@prisma/client';
import { CreateDeviceInput, UpdateDeviceInput } from './device.schemas';

export class DeviceService {
  async findAll(
    orgId: string,
    query: Record<string, unknown>,
    filters?: {
      status?: DeviceStatus;
    },
  ) {
    const { page, limit, skip, search } = parsePagination(query);

    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.status) {
      where['status'] = filters.status;
    }

    if (search) {
      where['OR'] = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { simNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vehicle: true },
      }),
      prisma.device.count({ where }),
    ]);

    return { devices, total, page, limit };
  }

  async findById(orgId: string, id: string) {
    const device = await prisma.device.findFirst({
      where: { id, organizationId: orgId },
      include: { vehicle: true },
    });

    if (!device) {
      const error = new Error('Device not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return device;
  }

  async create(orgId: string, data: CreateDeviceInput) {
    return prisma.device.create({
      data: {
        organizationId: orgId,
        serialNumber: data.serialNumber,
        model: data.model,
        simNumber: data.simNumber,
        firmwareVersion: data.firmwareVersion,
        status: data.status,
      },
      include: { vehicle: true },
    });
  }

  async update(orgId: string, id: string, data: UpdateDeviceInput) {
    await this.findById(orgId, id);

    return prisma.device.update({
      where: { id },
      data,
      include: { vehicle: true },
    });
  }

  async assign(orgId: string, id: string, vehicleId: string) {
    await this.findById(orgId, id);

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, organizationId: orgId },
      include: { device: true },
    });

    if (!vehicle) {
      const error = new Error('Vehicle not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    if (vehicle.device && vehicle.device.id !== id) {
      const error = new Error('Vehicle is already linked to another device');
      Object.assign(error, { statusCode: 409 });
      throw error;
    }

    return prisma.device.update({
      where: { id },
      data: { vehicleId },
      include: { vehicle: true },
    });
  }

  async unassign(orgId: string, id: string) {
    await this.findById(orgId, id);

    return prisma.device.update({
      where: { id },
      data: { vehicleId: null },
      include: { vehicle: true },
    });
  }

  async delete(orgId: string, id: string): Promise<void> {
    await this.findById(orgId, id);
    await prisma.device.delete({ where: { id } });
  }
}

export default new DeviceService();
