import { z } from 'zod';
import { FuelType, VehicleStatus } from '@prisma/client';

export const CreateVehicleSchema = z.object({
  plate: z.string().min(1, 'Plate is required').max(20),
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int('Year must be a whole number').min(1900).max(2100).optional(),
  vin: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  fuelType: z
    .nativeEnum(FuelType, {
      errorMap: () => ({ message: 'Invalid fuel type' }),
    })
    .optional()
    .default(FuelType.DIESEL),
  tankCapacityL: z.number().positive('Tank capacity must be positive').optional(),
  avgConsumptionL100: z.number().nonnegative('Average consumption must be >= 0').optional(),
  odometerKm: z.number().nonnegative('Odometer must be >= 0').optional().default(0),
  maxSpeedKmh: z.number().int().positive('Max speed must be positive').optional(),
  status: z
    .nativeEnum(VehicleStatus, {
      errorMap: () => ({ message: 'Invalid vehicle status' }),
    })
    .optional()
    .default(VehicleStatus.ACTIVE),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
