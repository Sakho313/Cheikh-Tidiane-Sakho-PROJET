import { z } from 'zod';
import { DeviceStatus } from '@prisma/client';

export const CreateDeviceSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
  model: z.string().max(100).optional(),
  simNumber: z.string().max(50).optional(),
  firmwareVersion: z.string().max(50).optional(),
  status: z
    .nativeEnum(DeviceStatus, {
      errorMap: () => ({ message: 'Invalid device status' }),
    })
    .optional()
    .default(DeviceStatus.ACTIVE),
});

export const UpdateDeviceSchema = CreateDeviceSchema.partial();

export const AssignDeviceSchema = z.object({
  vehicleId: z.string().uuid('Must be a valid vehicle UUID'),
});

export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;
export type AssignDeviceInput = z.infer<typeof AssignDeviceSchema>;
